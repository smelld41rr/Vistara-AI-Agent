// Native extension fixture check. Never a GUVI/site/model verification claim; no remote CDP or real provider requests.
import { controllerReady } from '@src/extension/layer';
import { defineCheck } from './registry';
import { assert, withTab } from './helpers';
import { FIXTURE_ORIGIN } from '../fixtures-config';
defineCheck({
  name: 'argument-controls',
  title: 'Arguments and supported editors',
  description: 'Real CDP Hint/code/Run Code, form approval refusal and common controls on a local fixture.',
  async run() {
    return withTab(`${FIXTURE_ORIGIN}/argument-controls.html`, async tab => {
      const controller = await controllerReady;
      const session = controller.createSession({ confirm: 'sensitive', handover: true });
      session.shareTab(tab.tabId);
      try {
        const snapshot = await session.call('snapshot', { mode: 'interactive' });
        assert(snapshot.ok, snapshot.text);
        const find = async (role: string, name: string) => {
          const r = await session.call('find', { role, name });
          assert(r.ok, r.text);
          const matches = r.data as Array<{ ref: string }>;
          assert(matches.length === 1, `Expected exactly one ${role}; got ${matches.length}`);
          return matches[0].ref;
        };
        const click = await session.call(
          'click',
          { target: await find('button', 'Hint'), expect: { text: 'Hint opened by real click.' } },
          { normalizeRefTargets: true },
        );
        assert(click.ok && click.receipt?.postcondition?.status === 'met', click.text);
        const editor = await find('textbox', 'Java 8 code');
        const set = await session.call(
          'set',
          { target: editor, value: 'class Main {}', expect: { value: 'class Main {}' } },
          { normalizeRefTargets: true },
        );
        assert(set.ok && set.receipt?.postcondition?.status === 'met', set.text);
        const run = await session.call('click', {
          target: { ref: await find('button', 'Run Code') },
          expect: { text: 'Fixture run output: supplied code observed.' },
        });
        assert(run.ok && run.receipt?.postcondition?.status === 'met', run.text);
        const cm = await session.call('set', {
          target: { ref: await find('textbox', 'CodeMirror content') },
          value: 'exact contenteditable text',
          expect: { value: 'exact contenteditable text' },
        });
        assert(cm.ok && cm.receipt?.postcondition?.status === 'met', cm.text);
        const select = await session.call('set', {
          target: { ref: await find('combobox', 'Language') },
          value: 'JavaScript',
        });
        assert(select.ok && select.receipt?.postcondition?.status === 'met', select.text);
        const checkbox = await session.call('set', {
          target: { ref: await find('checkbox', 'Show tests') },
          value: true,
        });
        assert(checkbox.ok && checkbox.receipt?.postcondition?.status === 'met', checkbox.text);
        // No confirmation route approves this fixture's consequential action: it must not dispatch.
        const submit = await session.call(
          'click',
          { target: { ref: await find('button', 'Submit') } },
          { signal: AbortSignal.timeout(500) },
        );
        assert(!submit.ok && submit.error?.delivered === false, 'Submit must not run without required approval');
        const after = await session.call('read', {});
        assert(!after.text.includes('Fixture submission received'), 'Unapproved submit unexpectedly executed');
        return {
          hint: click.receipt,
          editor: set.receipt,
          run: run.receipt,
          contenteditable: cm.receipt,
          select: select.receipt,
          checkbox: checkbox.receipt,
          submissionBlocked: true,
        };
      } finally {
        await controller.closeSession(session);
      }
    });
  },
});
