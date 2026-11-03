import { describe, it, expect } from 'vitest';
import { allTools } from '../tools';
import { Guards } from '../guards';
import { failed } from '../testing/fake-layer';
describe('model targets and validation recovery', () => {
  it('offers ref and semantic objects only, including nested form fields and scroll destinations', () => {
    for (const name of ['click', 'set', 'type', 'press', 'fill_form', 'hover', 'scroll', 'upload']) {
      const tool = allTools().find(t => t.name === name)!;
      const schema = JSON.stringify(tool.parameters);
      expect(schema).not.toContain('"selector"');
      expect(schema).not.toContain('"x"');
      expect(schema).not.toContain('"y"');
      expect(schema).toContain('"ref"');
    }
    for (const name of ['click', 'set', 'type', 'press', 'fill_form', 'find', 'snapshot'])
      expect(allTools().find(t => t.name === name)?.description).toContain('{');
  });
  it('nudges once then stops identical invalid target shapes even with different private values', () => {
    const g = new Guards();
    const bad = failed('INVALID_ARGUMENT');
    const first = g.record('set', { target: 'g29', value: 'secret-code-one' }, bad, true);
    expect(first.nudge).toContain('target OBJECT');
    const second = g.record('set', { target: 'g29', value: 'secret-code-two' }, bad, true);
    expect(second.stop).toContain('Repeated invalid');
    expect(JSON.stringify(g.state)).not.toContain('secret-code');
  });
  it('does not mislabel policy refusals or possibly dispatched actions as validation failures', () => {
    const g = new Guards();
    expect(g.record('tabs', { action: 'close' }, undefined, true).nudge).toBeUndefined();
    const r = failed('INVALID_ARGUMENT');
    r.error!.delivered = 'unknown';
    expect(g.record('click', { target: 'g29' }, r, true).nudge).toBeUndefined();
  });
  it('SDK invalid calls stop on the second matching shape without retaining raw SDK messages', () => {
    const g = new Guards();
    expect(g.record('click', { target: { id: 'g29' } }, undefined, true, true).nudge).toBeTruthy();
    expect(g.record('click', { target: { id: 'g29' } }, undefined, true, true).stop).toBeTruthy();
  });
});
