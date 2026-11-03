import { describe, expect, it, vi } from 'vitest';
import { proposeRefArguments, argumentShapes } from '../arguments';
import { ClickArgsSchema, SetArgsSchema, TargetSchema } from '../../protocol/schemas';
import { Controller } from '../controller';
import { TOOL_HANDLERS } from '../tools';
import type { TabHost, TabAttachment } from '../ports';
const print = { role: 'button', name: 'Hint', tag: 'button', text: '', nth: null, context: null };
async function setup() {
  const frame = {
    frameId: 'main',
    parentFrameId: undefined,
    loaderId: 'doc1',
    sessionId: undefined,
    url: 'https://example.test/',
  };
  let name = 'Hint';
  const send = vi.fn(async (_session: unknown, method: string) =>
    method === 'Accessibility.getPartialAXTree'
      ? { nodes: [{ backendDOMNodeId: 9, role: { value: 'button' }, name: { value: name } }] }
      : {},
  );
  const attachment = {
    tabId: 1,
    cdp: { send, on: () => () => {} },
    topology: { frames: async () => [frame], mainFrameId: () => frame.frameId, onFrameEvent: () => () => {} },
    page: {},
    detached: null,
    onDetach: () => () => {},
    close: async () => {},
  } as unknown as TabAttachment;
  const controller = await Controller.create({
    attacher: { attach: async () => attachment },
    tabs: {
      onRemoved: () => () => {},
      onNavigationTarget: () => () => {},
      get: async () => ({ tabId: 1, url: 'https://example.test/', title: 'fixture' }),
    } as unknown as TabHost,
    epochStore: { read: async () => null, write: async () => {} },
  });
  const session = controller.createSession();
  session.shareTab(1);
  await controller.attach(1);
  const record = controller.registry.assign(
    { tabId: 1, sessionId: undefined, frameId: 'main', loaderId: 'doc1', backendNodeId: 9 },
    'ax',
    print,
  );
  session.known.replace(1, [[record.ref, { source: 'ax', print }]]);
  const state = controller.tabState(1);
  state.last = {
    actionSeq: state.actionSeq,
    observation: { shown: new Map([[record.ref, { source: 'ax', print }]]) },
  } as unknown as NonNullable<typeof state.last>;
  state.probe = {
    resolve: vi.fn(async () => 'node'),
    release: vi.fn(async () => {}),
    call: vi.fn(),
  } as unknown as NonNullable<typeof state.probe>;
  return {
    controller,
    session,
    record,
    state,
    send,
    changeIdentity: () => {
      name = 'Submit';
    },
    frame,
  };
}
describe('strict schemas and unambiguous agent adaptation', () => {
  it('keeps bare strings and nested id targets invalid in the original schema', () => {
    expect(TargetSchema.safeParse('g29').success).toBe(false);
    expect(TargetSchema.safeParse({ id: 'g29' }).success).toBe(false);
    expect(TargetSchema.safeParse({ ref: 'g29', id: 'g29' }).success).toBe(false);
    expect(ClickArgsSchema.safeParse({ target: { ref: 'g29' } }).success).toBe(true);
    expect(SetArgsSchema.safeParse({ target: { role: 'textbox', name: 'Editor' }, value: 'Hello' }).success).toBe(true);
  });
  it('proposes only bare refs at explicit target positions, retaining exact values', () => {
    const args = { fields: [{ target: 'g29', value: 'private code\n\t' }], target: 'g54', submit: 'g90', text: 'g99' };
    const n = proposeRefArguments(args);
    expect(n.refs.map(r => r.path)).toEqual(['target', 'fields.0.target']);
    expect((n.args as { fields: Array<{ target: { ref: string }; value: string }> }).fields[0]).toEqual({
      target: { ref: 'g29' },
      value: 'private code\n\t',
    });
    expect(args.fields[0]?.target).toBe('g29');
    expect((n.args as { submit: string }).submit).toBe('g90');
  });
  it.each(['#editor', 'button[name=Hint]', 'g0', 'g29 extra', 'https://example.test'])(
    'never interprets %s as a reference',
    v => expect(proposeRefArguments({ target: v }).refs).toEqual([]),
  );
  it('diagnostics contain shapes only, never source text, secrets or arbitrary keys', () => {
    const d = JSON.stringify(
      argumentShapes({
        target: { id: 'private-secret', selector: 'private-selector', 'private-key': 'value' },
        value: 'private Java code',
      }),
    );
    expect(d).not.toContain('private');
    expect(d).toContain('object(id,selector,other-keys)');
  });
});
describe('real Session adapter with mocked CDP, not native Chrome', () => {
  it('reproduces the user-visible pre-dispatch error and sanitizes it', async () => {
    const f = await setup();
    const result = await f.session.call('click', { target: 'g29' });
    expect(result.error).toMatchObject({ code: 'INVALID_ARGUMENT', delivered: false });
    expect(result.argumentDiagnostic).toMatchObject({
      stage: 'controller-validation',
      dispatchAttempted: false,
      targets: [{ path: 'target', shape: 'string' }],
    });
    expect(result.text).toContain('target');
    expect(result.text).toContain('Nothing was dispatched');
  });
  it('normalizes an observed same-session ref only after live identity checks, then invokes the original handler once', async () => {
    const f = await setup();
    const handler = vi.spyOn(TOOL_HANDLERS, 'click').mockResolvedValue({
      lines: ['fixture handler only'],
      receipt: {
        action: 'click',
        mechanism: 'pointer',
        dispatched: true,
        effect: { verdict: 'changed', signals: [] },
      },
    });
    try {
      const r = await f.session.call('click', { target: f.record.ref }, { normalizeRefTargets: true });
      expect(r.ok).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0]?.[1].target).toEqual({ ref: f.record.ref });
      expect(f.send.mock.calls.some(c => c[1] === 'Accessibility.getPartialAXTree')).toBe(true);
      expect(r.argumentDiagnostic).toMatchObject({ normalized: true, dispatchAttempted: true });
    } finally {
      handler.mockRestore();
    }
  });
  it.each([
    'unknown',
    'not-presented',
    'stale',
    'changed',
    'other-session',
    'cross-tab',
    'last-capture',
    'capture-before-action',
    'cancel',
  ])('fails closed for %s and never invokes an action handler', async kind => {
    const f = await setup();
    const target = f.record.ref;
    let session = f.session;
    const args: Record<string, unknown> = { target };
    const abort = new AbortController();
    if (kind === 'unknown') args.target = 'z999';
    if (kind === 'not-presented') session.known.forget(1);
    if (kind === 'stale') f.controller.registry.documentChanged(1, ['main']);
    if (kind === 'changed') f.changeIdentity();
    if (kind === 'other-session') {
      session = f.controller.createSession();
      session.shareTab(1);
    }
    if (kind === 'cross-tab') {
      session.shareTab(2);
      args.tabId = 2;
    }
    if (kind === 'last-capture') f.state.last = undefined;
    if (kind === 'capture-before-action') f.state.actionSeq++;
    if (kind === 'cancel') abort.abort();
    const handler = vi.spyOn(TOOL_HANDLERS, 'click');
    try {
      const r = await session.call('click', args, { normalizeRefTargets: true, signal: abort.signal });
      expect(r.ok).toBe(false);
      expect(r.error?.delivered).toBe(false);
      expect(handler).not.toHaveBeenCalled();
      expect(f.send.mock.calls.every(c => !String(c[1]).startsWith('Input.'))).toBe(true);
    } finally {
      handler.mockRestore();
    }
  });
  it('never repairs nested id or mixed reference/selector targets', async () => {
    const f = await setup();
    for (const target of [{ id: f.record.ref }, { ref: f.record.ref, selector: 'button' }]) {
      const r = await f.session.call('click', { target }, { normalizeRefTargets: true });
      expect(r.error?.code).toBe('INVALID_ARGUMENT');
      expect(r.argumentDiagnostic?.dispatchAttempted).toBe(false);
    }
  });
  it('validates every repaired form ref before any field can dispatch, and preserves exact supplied code', async () => {
    const f = await setup();
    const handler = vi.spyOn(TOOL_HANDLERS, 'fill_form').mockResolvedValue({ lines: ['fixture handler only'] });
    try {
      const r = await f.session.call(
        'fill_form',
        {
          fields: [
            { target: f.record.ref, value: 'class Main {}' },
            { target: 'z999', value: 'second' },
          ],
        },
        { normalizeRefTargets: true },
      );
      expect(r.ok).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    } finally {
      handler.mockRestore();
    }
  });
  it('two explicitly requested valid actions dispatch once each; no hidden retry', async () => {
    const f = await setup();
    const handler = vi.spyOn(TOOL_HANDLERS, 'click').mockResolvedValue({ lines: ['fixture handler only'] });
    try {
      for (let i = 0; i < 2; i++)
        expect((await f.session.call('click', { target: f.record.ref }, { normalizeRefTargets: true })).ok).toBe(true);
      expect(handler).toHaveBeenCalledTimes(2);
    } finally {
      handler.mockRestore();
    }
  });
  it('reports nested target.ref field codes without retaining rejected input', async () => {
    const f = await setup();
    const r = await f.session.call('click', { target: { ref: 'secret value', id: 'private code' } });
    expect(r.error?.code).toBe('INVALID_ARGUMENT');
    expect(JSON.stringify(r.error?.details)).not.toContain('secret');
    expect(JSON.stringify(r.error?.details)).not.toContain('private');
  });
});
