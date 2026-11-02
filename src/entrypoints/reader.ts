import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { readPage } from '../features/browser/reader';
import { ReadPageMessageSchema } from '../features/browser/types';

declare global { var __vistaraReaderInstalled: boolean | undefined; }

export default defineUnlistedScript(() => {
    if (globalThis.__vistaraReaderInstalled) return;
    globalThis.__vistaraReaderInstalled = true;
    chrome.runtime.onMessage.addListener((message: unknown, sender, reply) => {
      if (sender.id !== chrome.runtime.id) return false;
      const parsed = ReadPageMessageSchema.safeParse(message);
      if (!parsed.success) return false;
      try { reply({ ok: true, snapshot: readPage(document, parsed.data.budget) }); }
      catch { reply({ ok: false, error: 'This page cannot be read. Open a normal website, click the extension toolbar icon, and try again.' }); }
      return false;
    });
});
