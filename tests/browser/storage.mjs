import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'vite';

/** Tests real IndexedDB, while only the privileged Chrome storage API is simulated. */
export async function checkIndexedDB(page) {
  const outDir = await mkdtemp(join(tmpdir(), 'vistara-storage-test-'));
  try {
    await build({ configFile: false, logLevel: 'error', build: { lib: { entry: resolve('src/core/storage.ts'), formats: ['iife'], name: 'VistaraStorage', fileName: () => 'storage.js' }, outDir, emptyOutDir: true } });
    await page.addScriptTag({ path: join(outDir, 'storage.js') });
    const result = await page.evaluate(async () => {
      const store = window.VistaraStorage;
      const areas = { local: {}, session: {} };
      const access = [];
      const makeArea = name => ({
        get: async key => key == null ? { ...areas[name] } : typeof key === 'string' ? { [key]: areas[name][key] } : Object.fromEntries(key.map(k => [k, areas[name][k]])),
        set: async values => Object.assign(areas[name], values),
        remove: async keys => { for (const key of typeof keys === 'string' ? [keys] : keys) delete areas[name][key]; },
        clear: async () => { areas[name] = {}; },
        setAccessLevel: async options => access.push({ area: name, level: options.accessLevel }),
      });
      window.chrome.storage = { local: makeArea('local'), session: makeArea('session') };
      await store.clearData();
      await store.secureStorage();
      const settings = await store.getSettings();
      settings.theme = 'dark';
      await store.saveSettings(settings);
      const savedSettings = await store.getSettings();
      const secret = 'fixture-seed-not-a-real-key';
      await store.setKey('gemini', secret, false);
      const sessionOnly = Object.keys(areas.session).includes('key:gemini') && !Object.keys(areas.local).includes('key:gemini');
      const conversation = {
        id: 'indexeddb-fixture', title: 'Real IndexedDB fixture', updatedAt: 1,
        messages: [{ id: 'user', role: 'user', content: 'Do not log ' + secret }, { id: 'assistant', role: 'assistant', content: '' }],
        usage: { requests: 1, inputTokens: null, outputTokens: null }, provider: 'gemini', model: 'fixture-model',
      };
      await store.saveConversation(conversation);
      const saved = await store.getConversation(conversation.id);
      const rows = await store.listConversations();
      const redacted = !JSON.stringify(saved).includes(secret) && /redact/i.test(saved.messages[0].content);
      await store.recoverInterrupted();
      const recovered = await store.getConversation(conversation.id);
      // Verify the commit through a second, independently opened IndexedDB connection.
      const independent = await new Promise((resolve, reject) => {
        const open = window.indexedDB.open('vistara-ai', 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction('conversations', 'readonly');
          const request = transaction.objectStore('conversations').get(conversation.id);
          let value;
          request.onsuccess = () => { value = request.result; };
          transaction.oncomplete = () => { db.close(); resolve(value); };
          transaction.onerror = () => reject(transaction.error);
        };
      });
      await store.deleteConversation(conversation.id);
      const deleted = await store.getConversation(conversation.id) === undefined;
      await store.setKey('groq', 'fixture-local-only', true);
      const localOptIn = Object.keys(areas.local).includes('key:groq') && !Object.keys(areas.session).includes('key:groq');
      await store.removeKey('groq');
      const removed = await store.getKey('groq') === '';
      await store.clearData();
      const cleared = (await store.listConversations()).length === 0 && Object.keys(areas.local).length === 0 && Object.keys(areas.session).length === 0;
      return { access, theme: savedSettings.theme, sessionOnly, redacted, rows: rows.length, recoveredStatus: recovered.messages[1].status, independentStatus: independent.messages[1].status, deleted, localOptIn, removed, cleared };
    });
    assert.deepEqual(result, {
      access: [{ area: 'session', level: 'TRUSTED_CONTEXTS' }, { area: 'local', level: 'TRUSTED_CONTEXTS' }],
      theme: 'dark', sessionOnly: true, redacted: true, rows: 1, recoveredStatus: 'interrupted', independentStatus: 'interrupted', deleted: true, localOptIn: true, removed: true, cleared: true,
    });
    return result;
  } finally { await rm(outDir, { recursive: true, force: true }); }
}
