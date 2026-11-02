/* Vistara AI modification, 2026-11-02: branding/privacy changes; see NOTICE and docs/CHANGED_FILES.md. */
// Stands in for `@puppeteer/browsers` in the extension build.
// Since puppeteer-core 25, connect() dynamically imports it for the `channel` option, which is never used here.
// Copied from Vistara AI at ad47282.
const unsupported = (): never => {
  throw new Error('@puppeteer/browsers is not available in the extension');
};

export const Browser = {};
export const ChromeReleaseChannel = {};
export const detectBrowserPlatform = unsupported;
export const resolveDefaultUserDataDir = unsupported;
