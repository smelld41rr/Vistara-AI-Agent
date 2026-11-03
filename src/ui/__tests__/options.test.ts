import { afterEach, describe, expect, it, vi } from 'vitest';
import { openSettings } from '../options';
import { readFileSync } from 'node:fs';
afterEach(() => vi.unstubAllGlobals());
function chromeStub(existing = false) {
  const tabs = existing ? [{ id: 12, windowId: 3, url: 'chrome-extension://vistara/options.html#general' }] : [];
  const api = {
    runtime: { getURL: (path: string) => `chrome-extension://vistara${path}`, openOptionsPage: vi.fn(async () => {}) },
    tabs: {
      query: vi.fn(async () => tabs),
      update: vi.fn(async () => {}),
      create: vi.fn(async ({ url }: { url: string }) => {
        tabs.push({ id: 14, windowId: 3, url });
      }),
    },
    windows: { update: vi.fn(async () => {}) },
  };
  vi.stubGlobal('chrome', api);
  return api;
}
describe('standalone settings navigation, mocked Chrome APIs', () => {
  it('uses Chrome options page for Settings without touching task/conversation state', async () => {
    const api = chromeStub();
    await openSettings();
    expect(api.runtime.openOptionsPage).toHaveBeenCalledOnce();
    expect(api.tabs.create).not.toHaveBeenCalled();
    expect(readFileSync('entrypoints/options/index.html', 'utf8')).toContain(
      'name="manifest.open_in_tab" content="true"',
    );
  });
  it('focuses and routes an existing exact extension tab to Providers', async () => {
    const api = chromeStub(true);
    await openSettings('providers');
    expect(api.tabs.update).toHaveBeenCalledWith(12, {
      active: true,
      url: 'chrome-extension://vistara/options.html#providers',
    });
    expect(api.windows.update).toHaveBeenCalledWith(3, { focused: true });
    expect(api.tabs.create).not.toHaveBeenCalled();
  });
  it('creates the local providers page once and reuses it for consecutive requests', async () => {
    const api = chromeStub();
    await Promise.all([openSettings('providers'), openSettings('permissions')]);
    expect(api.tabs.create).toHaveBeenCalledTimes(1);
    expect(api.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://vistara/options.html#providers' });
    expect(api.tabs.update).toHaveBeenCalledWith(
      14,
      expect.objectContaining({ url: 'chrome-extension://vistara/options.html#permissions' }),
    );
  });
});
