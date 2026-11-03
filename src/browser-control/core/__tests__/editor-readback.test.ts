import { describe, it, expect } from 'vitest';
import { readBack } from '../tools/text';
describe('exact code/editor read-back (pure receipt logic, not native editor verification)', () => {
  const code = 'class Main {\n\tprivate String secret = "fixture only";\n}\n';
  it('requires exact multiline read-back and does not print typed source', () => {
    const r = readBack(code, code, false);
    expect(r?.status).toBe('met');
    expect(JSON.stringify(r)).not.toContain('class Main');
  });
  it('reports modified whitespace/autoformatting as unmet rather than claiming insertion succeeded', () => {
    const r = readBack(code, code.replace('\t', '    '), false);
    expect(r?.status).toBe('unmet');
    expect(JSON.stringify(r)).not.toContain('private String');
  });
  it('does not infer success when read-back failed or when only a framework container was found', () =>
    expect(readBack(code, null, false)?.status).toBe('not_checked'));
  it('keeps secret-field receipts masked', () => {
    expect(readBack(code, code, true)).toEqual({ status: 'met', detail: 'value is masked' });
  });
});
