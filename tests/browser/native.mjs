import { chromium } from 'playwright';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Does not disable or modify enterprise policies. */
export async function checkNativeExtension(dist) {
  const profile = await mkdtemp(join(tmpdir(), 'vistara-native-'));
  let context;
  const result = { category: 'real-extension', status: 'NOT_RUN', checks: [], errors: [], policy: null };
  try {
    try {
      const policy = JSON.parse(await readFile('/etc/chromium/policies/managed/extensions.json', 'utf8'));
      result.policy = { ExtensionInstallBlocklist: policy.ExtensionInstallBlocklist, ExtensionInstallSources: policy.ExtensionInstallSources };
    } catch { /* not every platform has managed policy files */ }
    context = await chromium.launchPersistentContext(profile, {
      executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
      headless: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      args: ['--no-sandbox', `--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    });
    result.browser = context.browser()?.version() ?? 'Chromium persistent context';
    const manifest = JSON.parse(await readFile(join(dist, 'manifest.json'), 'utf8'));
    let worker = context.serviceWorkers().find(w => w.url().endsWith(`/${manifest.background.service_worker}`));
    if (!worker) {
      try { worker = await context.waitForEvent('serviceworker', { timeout: 7000, predicate: w => w.url().endsWith(`/${manifest.background.service_worker}`) }); }
      catch { /* record rather than pretend installed */ }
    }
    const policyPage = await context.newPage();
    await policyPage.goto('chrome://policy');
    result.policyPageOpened = policyPage.url() === 'chrome://policy/';
    result.policyText = (await policyPage.locator('body').innerText()).slice(0, 12000);
    if (!worker) {
      result.status = result.policy?.ExtensionInstallBlocklist?.includes('*') ? 'BLOCKED' : 'FAILED';
      result.reason = result.status === 'BLOCKED'
        ? 'Managed Chromium sets ExtensionInstallBlocklist=["*"]. The production extension worker did not load with standard unpacked-extension flags. Policy was not changed or bypassed.'
        : 'No production extension worker appeared after the standard unpacked-extension launch. Native loading was not verified.';
      return result;
    }
    result.checks.push('Production background service worker loaded');
    const id = new URL(worker.url()).host;
    const panel = await context.newPage();
    panel.on('pageerror', error => result.errors.push(error.message));
    await panel.goto(`chrome-extension://${id}/${manifest.side_panel.default_path}`);
    await panel.getByRole('navigation', { name: 'Main navigation' }).waitFor();
    result.checks.push('Production sidepanel document rendered in a native extension origin');
    result.status = result.errors.length ? 'FAILED' : 'PASSED';
    result.note = 'This opens the actual sidepanel extension document; toolbar sidePanel.open gesture remains a manual Windows check.';
    return result;
  } catch (error) {
    result.status = 'FAILED'; result.reason = String(error.message ?? error); return result;
  } finally {
    await context?.close();
    await rm(profile, { recursive: true, force: true });
  }
}
