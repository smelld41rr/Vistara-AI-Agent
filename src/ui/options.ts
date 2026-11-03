// One full-page extension settings tab; no conversation or task state is touched.
export type OptionsSection = 'general' | 'providers' | 'permissions' | 'shortcuts' | 'memory' | 'data' | 'about';
let opening: Promise<void> = Promise.resolve();
export function openSettings(section?: OptionsSection): Promise<void> {
  const next = opening
    .catch(() => {})
    .then(async () => {
      if (!section) {
        await chrome.runtime.openOptionsPage();
        return;
      }
      const base = chrome.runtime.getURL('/options.html');
      const tabs = await chrome.tabs.query({});
      const existing = tabs.find(t => t.url?.split(/[?#]/)[0] === base && t.id !== undefined);
      if (existing) {
        await chrome.tabs.update(existing.id!, { active: true, url: `${base}#${section}` });
        await chrome.windows.update(existing.windowId, { focused: true });
      } else await chrome.tabs.create({ url: `${base}#${section}` });
    });
  opening = next;
  return next;
}
