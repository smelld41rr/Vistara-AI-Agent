import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
async function setup() {
  const data: Record<string, unknown> = {
    'nb.keys': { original: 'old-test-credential', other: 'isolated-test-credential' },
    'nb.settings': { theme: 'light', defaultModel: { providerId: 'original', model: 'exact' } },
    'nb.providers': [
      {
        id: 'original',
        kind: 'openai-compatible',
        name: 'Custom',
        baseUrl: 'https://old.test/v1',
        models: [{ name: 'exact', agentTest: { passed: true, at: '' }, overrides: { contextWindow: 64000 } }],
      },
    ],
  };
  const area = {
    get: async (keys: string[]) => Object.fromEntries(keys.filter(k => k in data).map(k => [k, data[k]])),
    set: async (patch: Record<string, unknown>) => {
      Object.assign(data, patch);
    },
    onChanged: { addListener: () => {} },
  };
  vi.stubGlobal('chrome', { storage: { local: area } });
  vi.resetModules();
  return { data, ...(await import('../provider-security')), ...(await import('@src/store/settings')) };
}
describe('endpoint and credential isolation through mocked Chrome storage; no network', () => {
  it('requires confirmation and leaves all stored data intact on rejection', async () => {
    const s = await setup();
    const before = JSON.stringify(s.data);
    await expect(s.changeProviderEndpoint('original', 'https://new.test/v1', false)).rejects.toThrow('confirmation');
    expect(JSON.stringify(s.data)).toBe(before);
  });
  it('rotates identity, clears only the old key/results, preserves models/context/default and rejects stale key saves', async () => {
    const s = await setup();
    await s.changeProviderEndpoint('original', 'https://new.test/v1/', true);
    const p = (await s.providersStorage.get())[0];
    expect(p.id).not.toBe('original');
    expect(p.baseUrl).toBe('https://new.test/v1');
    expect(await s.keysStorage.get()).toEqual({ other: 'isolated-test-credential' });
    expect(p.models[0]).toEqual({ name: 'exact', overrides: { contextWindow: 64000 } });
    expect((await s.settingsStorage.get()).defaultModel).toEqual({ providerId: p.id, model: 'exact' });
    expect(s.usableModel([p], { providerId: p.id, model: 'exact' })).toBeNull();
    await expect(s.saveProviderKey('original', 'https://old.test/v1', 'new-test-key')).rejects.toThrow('changed');
    await s.saveProviderKey(p.id, p.baseUrl, 'new-test-key');
    expect(await s.keysStorage.get()).toMatchObject({ [p.id]: 'new-test-key', other: 'isolated-test-credential' });
  });
  it('a diagnostic started with an old key cannot mark the new key Agent Ready', async () => {
    const s = await setup();
    const { saveTest } = await import('../model-test');
    await s.saveProviderKey('original', 'https://old.test/v1', 'replacement-test-credential');
    expect((await s.providersStorage.get())[0].credentialRevision).toBe(1);
    await saveTest('original', 'https://old.test/v1', 'exact', {
      credentialRevision: 0,
      patch: { agentTest: { passed: true, at: 'old' } },
    });
    expect((await s.providersStorage.get())[0].models[0].agentTest).toBeUndefined();
    await saveTest('original', 'https://old.test/v1', 'exact', {
      credentialRevision: 1,
      patch: { agentTest: { passed: true, at: 'new' } },
    });
    expect((await s.providersStorage.get())[0].models[0].agentTest?.passed).toBe(true);
  });
  it('only a passed structured-tool diagnostic enables a custom model; text-only state does not', async () => {
    const s = await setup();
    const p = (await s.providersStorage.get())[0];
    expect(s.agentModelAvailable(p, { name: 'm', chatTest: { passed: true, at: '' } })).toBe(false);
    expect(s.agentModelAvailable(p, { name: 'm', agentTest: { passed: true, at: '' } })).toBe(true);
    expect(s.agentModelAvailable(p, { name: 'm', agentTest: { passed: false, at: '' } })).toBe(false);
    expect(s.usableModel([p], { providerId: 'removed', model: 'm' })).toBeNull();
  });
});
