import { describe, expect, it } from 'vitest';
import { testCompatibleModel, providerProblem } from '../compatible-test';
import { createModel, PROVIDER_PRESETS, normalizeCompatibleUrl, insecureRemoteEndpoint, streamTurn } from '@src/llm';
const spec = {
  kind: 'openai-compatible' as const,
  baseUrl: 'https://integrate.api.nvidia.com/v1',
  modelName: 'nvidia/exact-model-id',
  apiKey: 'test-wire-credential',
};
function sse(delta: unknown, finish = 'stop') {
  const chunk = (d: unknown, f: string | null) => ({
    id: 'response',
    object: 'chat.completion.chunk',
    created: 0,
    model: spec.modelName,
    choices: [{ index: 0, delta: d, finish_reason: f }],
  });
  return new Response(
    `data: ${JSON.stringify(chunk(delta, null))}\n\ndata: ${JSON.stringify(chunk({}, finish))}\n\ndata: [DONE]\n\n`,
    { headers: { 'content-type': 'text/event-stream' } },
  );
}
function mockProvider(target: unknown = { ref: 'g29' }, continuation = 'VISTARA_OK') {
  const calls: Array<{ url: string; headers: Headers; body?: Record<string, unknown>; redirect?: RequestRedirect }> =
    [];
  const fetcher: typeof fetch = async (url, init) => {
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
    calls.push({ url: String(url), headers: new Headers(init?.headers), body, redirect: init?.redirect });
    if (!body) return Response.json({ data: [{ id: spec.modelName }] });
    const messages = body.messages as Array<{ role: string }>;
    if (messages.at(-1)?.role === 'tool') return sse({ role: 'assistant', content: continuation });
    const tools = body.tools as Array<{ function: { name: string } }> | undefined;
    if (!tools) return sse({ role: 'assistant', content: 'VISTARA_OK' });
    const name = tools[0].function.name;
    return sse(
      {
        role: 'assistant',
        tool_calls: [
          {
            index: 0,
            id: `id-${name}`,
            type: 'function',
            function: {
              name,
              arguments: JSON.stringify({ target, ...(name === 'set' ? { value: 'Hello world' } : {}) }),
            },
          },
        ],
      },
      'tool_calls',
    );
  };
  return { calls, fetcher };
}
describe('NVIDIA/custom provider: actual SDK with simulated HTTP, no live inference/browser', () => {
  it('keeps exact NVIDIA model ID, bearer auth, base URL and tool-result IDs through continuation', async () => {
    const { calls, fetcher } = mockProvider();
    const result = await testCompatibleModel(spec, 'tools', { fetch: fetcher });
    expect(result).toMatchObject({ ok: true, toolCalling: true });
    expect(calls).toHaveLength(3);
    for (const call of calls) {
      expect(call.url).toBe(spec.baseUrl + '/chat/completions');
      expect(call.headers.get('authorization')).toBe('Bearer ' + spec.apiKey);
      expect(call.body?.model).toBe(spec.modelName);
      expect(call.redirect).toBe('error');
    }
    const messages = calls[2].body?.messages as Array<Record<string, unknown>>;
    expect(messages.at(-1)).toMatchObject({ role: 'tool', tool_call_id: 'id-set' });
    expect(JSON.stringify(calls[0].body?.tools)).toContain('"ref"');
    expect(JSON.stringify(calls[0].body?.tools)).not.toContain('selector');
  });
  it.each(['g29', { id: 'g29' }, { ref: 'stale-other' }])(
    'rejects malformed or wrong synthetic target %j without dispatch',
    async target => {
      const { fetcher, calls } = mockProvider(target);
      const r = await testCompatibleModel(spec, 'tools', { fetch: fetcher });
      expect(r.ok).toBe(false);
      expect(r.toolCalling).toBe(false);
      expect(calls).toHaveLength(1);
    },
  );
  it('rejects broken tool-result continuation', async () => {
    const { fetcher } = mockProvider({ ref: 'g29' }, 'I cannot continue');
    expect((await testCompatibleModel(spec, 'tools', { fetch: fetcher })).error).toContain('continuation');
  });
  it('distinguishes connection and text readiness from Agent Ready', async () => {
    const { fetcher, calls } = mockProvider();
    expect(await testCompatibleModel(spec, 'connection', { fetch: fetcher })).toMatchObject({
      ok: true,
      connected: true,
      toolCalling: false,
    });
    expect(calls[0].url).toBe(spec.baseUrl + '/models');
    expect(await testCompatibleModel(spec, 'text', { fetch: fetcher })).toMatchObject({
      ok: true,
      chatReady: true,
      toolCalling: false,
    });
  });
  it('text-only models fail tools instead of being declared Agent Ready', async () => {
    const r = await testCompatibleModel(spec, 'tools', {
      fetch: async () => sse({ role: 'assistant', content: 'Hello' }),
    });
    expect(r.ok).toBe(false);
    expect(r.toolCalling).toBe(false);
  });
  it('sanitizes diagnostic errors and actual streaming errors which echo the saved key', async () => {
    const fetcher: typeof fetch = async () =>
      new Response(JSON.stringify({ error: { message: 'Invalid API key ' + spec.apiKey } }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    const r = await testCompatibleModel(spec, 'text', { fetch: fetcher });
    expect(r.error).toContain('Invalid API key');
    expect(JSON.stringify(r)).not.toContain(spec.apiKey);
    const raw = await streamTurn({
      chat: createModel(spec, { fetch: fetcher }),
      system: 'test',
      messages: [{ role: 'user', content: 'test' }],
      retry: { attempts: 1, baseMs: 0, maxMs: 0 },
    });
    expect(JSON.stringify(raw)).not.toContain(spec.apiKey);
  });
  it.each([
    [401, 'Invalid API key'],
    [402, 'credits'],
    [429, 'rate limit'],
    [503, 'unavailable'],
    [404, 'Unsupported model'],
    [403, 'Access denied'],
  ] as const)('classifies status %i', (status, expected) =>
    expect(providerProblem(new Error('failure'), status)).toContain(expected),
  );
  it('keeps exact documented preset paths, without assuming universal capability', () => {
    expect(PROVIDER_PRESETS.find(p => p.id === 'nvidia')?.baseUrl).toBe(spec.baseUrl);
    expect(PROVIDER_PRESETS.find(p => p.id === 'together')?.baseUrl).toBe('https://api.together.ai/v1');
    expect(PROVIDER_PRESETS.map(p => p.id)).toEqual(
      expect.arrayContaining([
        'nvidia',
        'groq',
        'together',
        'cerebras',
        'fireworks',
        'deepinfra',
        'xai',
        'deepseek',
        'mistral',
      ]),
    );
    for (const p of PROVIDER_PRESETS) expect(normalizeCompatibleUrl(p.baseUrl + '/')).toBe(p.baseUrl);
  });
  it.each([
    'https://host.test/v1/chat/completions',
    'ftp://host.test',
    'https://user:pass@host.test/v1',
    'https://host.test/v1?key=private',
    'https://host.test/#secret',
  ])('rejects bad base URL %s', url => expect(() => normalizeCompatibleUrl(url)).toThrow());
  it('never sends list credentials when a custom endpoint is missing', async () => {
    const { fetcher, calls } = mockProvider();
    const r = await testCompatibleModel({ ...spec, baseUrl: undefined }, 'connection', { fetch: fetcher });
    expect(r.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });
  it('preserves custom proxy paths and localhost support and flags remote HTTP', () => {
    expect(normalizeCompatibleUrl(' https://proxy.test/custom/inference/v9/ ')).toBe(
      'https://proxy.test/custom/inference/v9',
    );
    expect(insecureRemoteEndpoint('http://example.test/api')).toBe(true);
    expect(insecureRemoteEndpoint('http://localhost:11434/v1')).toBe(false);
    expect(insecureRemoteEndpoint('http://[::1]:8000/v1')).toBe(false);
    expect(() => createModel({ kind: 'openai-compatible', modelName: 'm' })).toThrow('required');
  });
});
