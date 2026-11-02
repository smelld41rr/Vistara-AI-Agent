/** Unit tests with mocked Chrome storage; IndexedDB persistence is covered separately by browser tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/core/schemas';
import { getKey, getSettings, removeKey, saveSettings, secureStorage, setKey } from '../../src/core/storage';
function storageArea() {
  const data: Record<string, unknown> = {};
  return {
    data,
    get: vi.fn(async (key: string | null) => key === null ? {...data} : ({ [key]: data[key] })),
    set: vi.fn(async (values: Record<string, unknown>) => { Object.assign(data, structuredClone(values)); }),
    remove: vi.fn(async (key: string) => { delete data[key]; }),
    clear: vi.fn(async () => { for (const key of Object.keys(data)) delete data[key]; }),
    setAccessLevel: vi.fn(async () => {}),
  };
}
let local: ReturnType<typeof storageArea>;
let session: ReturnType<typeof storageArea>;
beforeEach(() => {
  local = storageArea(); session = storageArea();
  vi.stubGlobal('chrome', { storage: { local, session } });
});
describe('storage and key isolation (mocked Chrome storage)', () => {
  it('restricts local and session stores to trusted extension contexts', async () => {
    await secureStorage();
    expect(local.setAccessLevel).toHaveBeenCalledWith({ accessLevel: 'TRUSTED_CONTEXTS' });
    expect(session.setAccessLevel).toHaveBeenCalledWith({ accessLevel: 'TRUSTED_CONTEXTS' });
  });
  it('migrates missing settings conservatively and preserves invalid saved settings', async () => {
    expect(await getSettings()).toMatchObject(DEFAULT_SETTINGS);
    expect((await getSettings()).consent).toEqual({ gemini: false, groq: false });
    local.data.settings = { temperature: 'invalid', consent: { gemini: true, groq: true } };
    await expect(getSettings()).rejects.toThrow('preserved');
    expect(local.data.settings).toEqual({temperature:'invalid',consent:{gemini:true,groq:true}});
  });
  it('validates settings before saving them', async () => {
    const settings = structuredClone(DEFAULT_SETTINGS); settings.theme = 'dark';
    expect(await saveSettings(settings)).toEqual(settings);
    expect(local.data.settings).toEqual(settings);
    await expect(saveSettings({ ...settings, timeoutMs: -1 })).rejects.toThrow();
    expect(local.set).toHaveBeenCalledTimes(1);
  });
  it('stores a new key in session only by default and deletes any stale persisted copy', async () => {
    local.data['key:gemini'] = 'stale-test-key';
    await setKey('gemini', 'new-session-test-key');
    expect(session.data['key:gemini']).toBe('new-session-test-key');
    expect(local.data['key:gemini']).toBeUndefined();
    expect(local.set).not.toHaveBeenCalled();
    expect(await getKey('gemini')).toBe('new-session-test-key');
  });
  it('persists a key only with explicit persist=true and removes the session copy', async () => {
    session.data['key:groq'] = 'old-session-test-key';
    await setKey('groq', 'persisted-test-key', true);
    expect(session.data['key:groq']).toBeUndefined();
    expect(local.data['key:groq']).toBe('persisted-test-key');
    expect(await getKey('groq')).toBe('persisted-test-key');
  });
  it('prefers a valid session key and rejects non-string stored values', async () => {
    session.data['key:gemini'] = 'session-test-key'; local.data['key:gemini'] = 'local-test-key';
    expect(await getKey('gemini')).toBe('session-test-key');
    session.data['key:gemini'] = { malformed: true }; local.data['key:gemini'] = 42;
    expect(await getKey('gemini')).toBe('');
  });
  it('removes both copies of only the requested provider key', async () => {
    session.data['key:gemini'] = 'session-test-key'; local.data['key:gemini'] = 'local-test-key'; local.data['key:groq'] = 'other-test-key';
    await removeKey('gemini');
    expect(session.data['key:gemini']).toBeUndefined(); expect(local.data['key:gemini']).toBeUndefined();
    expect(await getKey('groq')).toBe('other-test-key');
  });
});
