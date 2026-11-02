import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { access, readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { checkNativeExtension } from '../tests/browser/native.mjs';
import { startServer } from '../tests/browser/server.mjs';
import { installMockChrome } from '../tests/browser/mock-chrome.mjs';
import { checkIndexedDB } from '../tests/browser/storage.mjs';

const dist = resolve('.output/chrome-mv3');
const report = { startedAt: new Date().toISOString(), native: null, mockBrowser: { category: 'mocked-browser', status: 'RUNNING', checks: [], errors: [] } };
await mkdir('screenshots', { recursive: true });
await mkdir('docs', { recursive: true });
report.native = await checkNativeExtension(dist);
console.log(`NATIVE ${report.native.status}: ${report.native.reason ?? report.native.checks.join('; ')}`);
const server = await startServer(dist, resolve('tests/fixtures/site'));
let browser;
async function check(name, fn) {
  await fn();
  report.mockBrowser.checks.push(name);
  console.log(`PASS [mocked-browser] ${name}`);
}
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  report.mockBrowser.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 400, height: 900 } });
  const errors = report.mockBrowser.errors;
  context.on('page', page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  });
  const fixture = await context.newPage();
  await fixture.goto(`${server.url}/fixtures/article.html`);
  let readerPath = join(dist, 'reader.js');
  try { await access(readerPath); } catch {
    const scripts = await readdir(join(dist, 'content-scripts'));
    const readerScript = scripts.find(file => /reader.*\.js$/.test(file));
    assert.ok(readerScript, 'Built reader content script exists');
    readerPath = join(dist, 'content-scripts', readerScript);
  }
  await fixture.addInitScript(() => {});
  await fixture.evaluate(() => {
    window.__readerListeners = [];
    window.chrome = { runtime: { id: 'vistara-fixture', onMessage: { addListener: listener => window.__readerListeners.push(listener) } } };
  });
  await fixture.addScriptTag({ path: readerPath });
  const readSnapshot = () => fixture.evaluate(() => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Reader response timed out')), 3000);
    for (const listener of window.__readerListeners) listener({ type: 'READ_PAGE', budget: 12000 }, { id: 'vistara-fixture' }, response => { clearTimeout(timer); resolve(response); });
  }));
  const readerReply = await readSnapshot();
  assert.equal(readerReply.ok, true, JSON.stringify(readerReply));
  const snapshot = readerReply.snapshot;
  await check('compiled reader returns actual fixture text, title and URL', async () => {
    assert.ok(snapshot.text.length > 30);
    assert.equal(snapshot.url, fixture.url());
    assert.equal(snapshot.title, await fixture.title());
    const actualText = await fixture.locator('body').innerText();
    assert.ok(actualText.includes(snapshot.headings[0].text));
  });
  await check('reader reinjection remains singleton and read-only', async () => {
    const before = await fixture.locator('body').innerHTML();
    await fixture.addScriptTag({ path: readerPath });
    assert.equal(await fixture.evaluate(() => window.__readerListeners.length), 1);
    await readSnapshot();
    const after = await fixture.locator('body').innerHTML();
    // Script elements inserted by Playwright are test harness artifacts, not reader mutations.
    assert.equal(after.replace(/<script[\s\S]*?<\/script>/g, ''), before.replace(/<script[\s\S]*?<\/script>/g, ''));
  });
  await check('reader excludes hidden instructions and sensitive field values', async () => {
    await fixture.evaluate(() => {
      const hidden = document.createElement('div'); hidden.hidden = true; hidden.textContent = 'HIDDEN_INJECTION_SECRET'; document.body.append(hidden);
      const password = document.createElement('input'); password.type = 'password'; password.value = 'PASSWORD_MUST_NOT_LEAK'; document.body.append(password);
      const otp = document.createElement('input'); otp.autocomplete = 'one-time-code'; otp.value = 'OTP_MUST_NOT_LEAK'; document.body.append(otp);
    });
    const reply = await readSnapshot();
    assert.equal(reply.ok, true);
    assert.doesNotMatch(JSON.stringify(reply.snapshot), /HIDDEN_INJECTION_SECRET|PASSWORD_MUST_NOT_LEAK|OTP_MUST_NOT_LEAK/);
  });
  await check('real IndexedDB commits, redaction, interruption recovery and deletion', async () => {
    await checkIndexedDB(fixture);
  });
  const page = await context.newPage();
  await page.addInitScript(installMockChrome, { snapshot });
  await page.goto(`${server.url}/sidepanel.html`);
  await page.getByRole('navigation', { name: 'Main navigation' }).waitFor();
  await check('production React sidebar renders and page context defaults OFF', async () => {
    assert.equal(await page.getByRole('checkbox', { name: /Page context/ }).isChecked(), false);
    await page.getByRole('heading', { name: 'What’s on your mind?' }).waitFor();
  });
  await check('compiled UI fits 320, 400 and 480 pixel panels', async () => {
    for (const width of [320, 400, 480]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `overflow at ${width}px`);
    }
    await page.setViewportSize({ width: 400, height: 900 });
    await page.screenshot({ path: 'screenshots/chat-fixture.png', fullPage: true });
  });
  await check('page preview is a local read and does not start a provider request', async () => {
    await page.getByRole('button', { name: 'Preview current page', exact: true }).click();
    await page.getByText(snapshot.title, { exact: true }).waitFor();
    const calls = await page.evaluate(() => window.__vistaraMock.requests.map(r => r.type));
    assert.ok(calls.includes('PAGE_READ'));
    assert.equal(calls.includes('CHAT_START'), false);
    await page.getByRole('button', { name: 'Close page preview' }).click();
  });
  await check('future milestone screens show honest Not built yet state', async () => {
    for (const name of ['Workflows', 'Extract']) {
      await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
      await page.getByText('Not built yet', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Back to Chat' }).click();
    }
  });
  await check('Settings renders provider cloud disclosure and terms', async () => {
    await page.getByRole('navigation').getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByText(/external cloud provider/i).first().waitFor();
    await page.getByRole('link', { name: /Review provider terms/ }).waitFor();
  });
  await check('BYOK controls save a session key and discover models only on a user gesture', async () => {
    await page.getByLabel('Your API key', { exact: true }).fill('fixture-key-not-a-real-secret');
    assert.equal(await page.getByRole('checkbox', { name: 'Remember key on this device' }).isChecked(), false);
    await page.getByRole('button', { name: 'Save key', exact: true }).click();
    await page.getByLabel('Replace API key', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Test connection', exact: true }).click();
    await page.getByText('Fixture connection ready (mock only).', { exact: true }).first().waitFor();
    await page.getByRole('button', { name: 'Discover models', exact: true }).click();
    await page.getByText('1 models discovered. Choose one below.', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('Model', { exact: true }).inputValue(), '');
    const calls = await page.evaluate(() => window.__vistaraMock.requests);
    const index = calls.findIndex(r => r.type === 'MODELS_LIST');
    assert.equal(calls[index - 1].type, 'PERMISSION_REQUEST');
    assert.deepEqual(calls[index - 1].payload.origins, ['https://generativelanguage.googleapis.com/*']);
    const saveKey = calls.find(r => r.type === 'KEY_SET');
    assert.equal(saveKey.payload.persist, false);
  });
  await check('model selection and per-provider consent save without selecting a model automatically', async () => {
    await page.getByLabel('Model', { exact: true }).selectOption('fixture-model');
    await page.getByRole('checkbox', { name: /I understand and consent/ }).check();
    await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
    await page.getByText('Preferences saved.', { exact: true }).waitFor();
    await page.getByRole('group', { name: 'AI provider', exact: true }).getByRole('button', { name: /Groq/ }).click();
    assert.equal(await page.getByRole('checkbox', { name: /I understand and consent/ }).isChecked(), false);
    await page.getByRole('group', { name: 'AI provider', exact: true }).getByRole('button', { name: /Google Gemini/ }).click();
    assert.equal(await page.getByRole('checkbox', { name: /I understand and consent/ }).isChecked(), true);
    await page.screenshot({ path: 'screenshots/settings-fixture.png', fullPage: true });
  });
  await check('theme, compact spacing and font settings apply after saving', async () => {
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Compact spacing' }).check();
    await page.getByLabel(/Font size/).fill('16');
    await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(await page.locator('html').getAttribute('data-compact'), 'true');
    assert.match(await page.locator('html').getAttribute('style'), /16px/);
    await page.getByRole('navigation').getByRole('button', { name: 'Chat', exact: true }).click();
  });
  await check('streamed mock response renders as escaped text with no HTML execution', async () => {
    await page.getByRole('textbox', { name: 'Message Vistara' }).fill('Explain an idea');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.getByText(/Fixture response \(mock provider only\)/).waitFor();
    await page.getByRole('button', { name: 'Ask again', exact: true }).waitFor();
    assert.equal(await page.locator('.markdown img').count(), 0);
    assert.equal(await page.evaluate(() => window.__injected === true), false);
    await page.getByRole('button', { name: 'Copy', exact: true }).click();
    await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
  });
  await check('context-enabled prompt uses the actual fixture snapshot through the scripted provider', async () => {
    await page.getByRole('button', { name: 'New conversation', exact: true }).click();
    assert.equal(await page.getByRole('checkbox', { name: /Page context/ }).isChecked(), false);
    await page.getByRole('checkbox', { name: /Page context/ }).check();
    await page.getByRole('textbox', { name: 'Message Vistara' }).fill('Summarize this fixture');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.getByText(/Fixture response from actual page text:/).waitFor();
    await page.getByRole('button', { name: 'Ask again', exact: true }).waitFor();
    const content = await page.locator('.message.assistant .markdown').innerText();
    assert.ok(content.includes(snapshot.text.slice(0, 100)));
    const calls = await page.evaluate(() => window.__vistaraMock.requests.filter(r => r.type === 'CHAT_START'));
    assert.equal(calls.at(-1).payload.includePage, true);
  });
  await check('Stop cancels an in-progress mock request without reporting completion', async () => {
    await page.getByRole('button', { name: 'New conversation', exact: true }).click();
    await page.getByRole('textbox', { name: 'Message Vistara' }).fill('Please wait for cancellation');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.getByRole('button', { name: 'Stop response', exact: true }).click();
    await page.getByText('cancelled', { exact: true }).waitFor();
    assert.ok(await page.evaluate(() => window.__vistaraMock.requests.some(r => r.type === 'CHAT_STOP')));
  });
  await check('401, 403 and 429 normalized errors render with recovery guidance', async () => {
    for (const failure of [
      { code: 'auth_invalid', message: 'The API key is invalid.', hint: 'Replace your key in Settings.' },
      { code: 'forbidden', message: 'Provider access was refused.', hint: 'Check provider project permissions.' },
      { code: 'rate_limited', message: 'Provider rate limit reached.', hint: 'Wait before trying again. No automatic retry.' },
    ]) {
      await page.getByRole('button', { name: 'New conversation', exact: true }).click();
      await page.evaluate(error => { window.__vistaraMock.nextChatError = error; }, failure);
      await page.getByRole('textbox', { name: 'Message Vistara' }).fill('Check error display');
      await page.getByRole('button', { name: 'Send message' }).click();
      await page.getByText(failure.message + ' ' + failure.hint, { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Send message' }).waitFor();
    }
  });
  await check('history search, restore, export and delete controls work against the scripted store', async () => {
    await page.getByRole('navigation').getByRole('button', { name: 'History', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search conversations' }).fill('Summarize this fixture');
    assert.equal(await page.locator('.history-card').count(), 1);
    await page.locator('.history-open').click();
    assert.equal(await page.getByRole('checkbox', { name: /Page context/ }).isChecked(), false);
    await page.getByText(/Fixture response from actual page text:/).waitFor();
    await page.getByRole('navigation').getByRole('button', { name: 'History', exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const savedDownload = await download;
    assert.equal(savedDownload.suggestedFilename(), 'vistara-conversations.json');
    const exported = JSON.parse(await readFile(await savedDownload.path(), 'utf8'));
    assert.ok(exported.conversations.length > 0);
    assert.doesNotMatch(JSON.stringify(exported), /fixture-key-not-a-real-secret/);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByRole('heading', { name: 'A fresh start.', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__vistaraMock.conversations.length), 0);
  });
  await check('keyboard focus is visible and settings have no horizontal overflow at 320px', async () => {
    await page.getByRole('navigation').getByRole('button', { name: 'Settings', exact: true }).click();
    await page.setViewportSize({ width: 320, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement !== document.body), true);
    await page.getByRole('button', { name: 'Save preferences', exact: true }).focus();
    const focus = await page.getByRole('button', { name: 'Save preferences', exact: true }).evaluate(element => ({ outline: window.getComputedStyle(element).outlineStyle, width: window.getComputedStyle(element).outlineWidth }));
    assert.notEqual(focus.outline, 'none');
    assert.notEqual(focus.width, '0px');
  });
  report.mockBrowser.status = errors.length ? 'FAILED' : 'PASSED';
  assert.deepEqual(errors, [], 'No uncaught browser page exceptions');
  await context.close();
} catch (error) {
  report.mockBrowser.status = 'FAILED'; report.mockBrowser.failure = error.stack ?? String(error); console.error(report.mockBrowser.failure);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server.close();
  report.finishedAt = new Date().toISOString();
  await writeFile('docs/browser-results.json', JSON.stringify(report, null, 2) + '\n');
  await writeFile('screenshots/README.md', '# Screenshot provenance\n\nThese captures show the real production React bundles rendered in Chromium with a scripted mock Chrome/backend interface on a local fixture server. They are **not** screenshots of a natively installed extension or live third-party websites. No API key was used. See docs/browser-results.json for actual executed scenarios and native loading status.\n');
  console.log(`Mocked-browser checks: ${report.mockBrowser.checks.length}; uncaught errors: ${report.mockBrowser.errors.length}; result: ${report.mockBrowser.status}`);
}
