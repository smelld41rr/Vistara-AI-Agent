/* Vistara AI modification, 2026-11-02: branding/privacy changes; see NOTICE and docs/CHANGED_FILES.md. */
// Vistara modification: clear any old uninstall-feedback service; no replacement tracking URL.
export const UNINSTALL_FORM = '';
export function setUninstallPage(): void {
  void chrome.runtime.setUninstallURL('').catch(error => console.error('[uninstall] clearing page failed', error));
}
