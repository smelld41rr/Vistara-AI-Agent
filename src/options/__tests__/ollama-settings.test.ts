import { afterEach, describe, expect, it, vi } from 'vitest';
import { agentModelAvailable, DEFAULT_SETTINGS, mergeSettings, usableModel, withBaseUrl } from '@src/store/settings';
import type { ProviderConfig } from '@src/store/settings';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OriginFix, KINDS } from '../ProvidersSection';
const local: ProviderConfig = {
  id: 'local',
  kind: 'ollama',
  name: 'Ollama (Local)',
  baseUrl: 'http://localhost:11434',
  models: [{ name: 'qwen3:8b', agentTest: { passed: true, at: '2026-11-03' }, overrides: { contextWindow: 32000 } }],
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe('local settings and readiness', () => {
  it('keeps every existing provider and preset', () => {
    expect(KINDS.map(p => p.kind)).toEqual(
      expect.arrayContaining([
        'ollama',
        'lmstudio',
        'gemini',
        'anthropic',
        'openai',
        'openrouter',
        'openai-compatible',
      ]),
    );
    expect(KINDS.find(p => p.kind === 'ollama')).toMatchObject({
      label: 'Ollama (Local)',
      needsKey: false,
      baseUrl: 'http://localhost:11434',
    });
  });
  it('shows only the exact extension origin in local server setup commands', () => {
    vi.stubGlobal('chrome', { runtime: { getURL: () => 'chrome-extension://vistara-id/' } });
    const html = renderToStaticMarkup(createElement(OriginFix, { kind: 'ollama' }));
    expect(html).toContain('chrome-extension://vistara-id');
    expect(html).not.toContain('chrome-extension://*');
    expect(html).not.toContain('OLLAMA_ORIGINS=null');
  });
  it('requires a passed local structured-tool test, preserving cloud behavior', () => {
    expect(agentModelAvailable(local, { name: 'untested' })).toBe(false);
    expect(agentModelAvailable(local, { name: 'failed', agentTest: { passed: false, at: '' } })).toBe(false);
    expect(agentModelAvailable(local, local.models[0])).toBe(true);
    expect(agentModelAvailable({ ...local, kind: 'gemini' }, { name: 'saved' })).toBe(true);
  });
  it('invalidates old endpoint tests without deleting models or user overrides, and never silently switches providers', () => {
    const changed = withBaseUrl(local, 'http://localhost:11435');
    expect(changed.models[0]).toEqual({ name: 'qwen3:8b', overrides: { contextWindow: 32000 } });
    expect(
      usableModel([changed, { ...local, id: 'cloud', kind: 'gemini' }], { providerId: 'local', model: 'qwen3:8b' }),
    ).toBeNull();
    expect(mergeSettings({ ...DEFAULT_SETTINGS, theme: 'light', turnCap: 42 }).turnCap).toBe(42);
  });
  it('persists added providers, default selection and failed diagnostics through storage subscriptions; rejects stale saves', async () => {
    const data: Record<string, unknown> = { 'nb.settings': { ...DEFAULT_SETTINGS, theme: 'light', turnCap: 42 } };
    const listeners: Array<(changes: Record<string, { newValue: unknown }>) => void> = [];
    const area = {
      get: async (keys: string[]) => Object.fromEntries(keys.map(k => [k, data[k]])),
      set: async (patch: Record<string, unknown>) => {
        Object.assign(data, patch);
        listeners.forEach(fn => fn(Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, { newValue: v }]))));
      },
      onChanged: { addListener: (fn: (typeof listeners)[number]) => listeners.push(fn) },
    };
    vi.stubGlobal('chrome', { storage: { local: area } });
    vi.resetModules();
    const { providersStorage, settingsStorage } = await import('@src/store/settings');
    const { saveTest } = await import('../model-test');
    const changed = vi.fn();
    providersStorage.subscribe(changed);
    await providersStorage.set([local]);
    await settingsStorage.set(s => ({ ...s, defaultModel: { providerId: local.id, model: local.models[0].name } }));
    expect(await settingsStorage.get()).toMatchObject({
      theme: 'light',
      turnCap: 42,
      defaultModel: { providerId: 'local', model: 'qwen3:8b' },
    });
    expect(changed).toHaveBeenCalled();
    const failed = {
      patch: { agentTest: { passed: false, at: 'now' }, noToolCalling: true },
      result: { ok: false, toolCalling: false, ms: 1 },
    };
    await saveTest('local', 'http://wrong-server', 'qwen3:8b', failed);
    expect((await providersStorage.get())[0].models[0].agentTest?.passed).toBe(true);
    await saveTest('local', local.baseUrl, 'qwen3:8b', failed);
    expect((await providersStorage.get())[0].models[0]).toMatchObject({
      noToolCalling: true,
      agentTest: { passed: false },
    });
  });
});
