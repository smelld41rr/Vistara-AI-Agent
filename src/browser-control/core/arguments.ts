// Vistara argument adapter: only a bare reference can be proposed for repair; the session proves it safe before use.
export interface TargetArgument {
  path: string;
  value: unknown;
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function targetArguments(args: unknown): TargetArgument[] {
  if (!record(args)) return [];
  const out: TargetArgument[] = [];
  if ('target' in args) out.push({ path: 'target', value: args.target });
  if (Array.isArray(args.fields))
    args.fields.slice(0, 200).forEach((f, i) => {
      if (record(f) && 'target' in f) out.push({ path: `fields.${i}.target`, value: f.target });
    });
  if (record(args.submit)) out.push({ path: 'submit', value: args.submit });
  if (record(args.to)) out.push({ path: 'to', value: args.to });
  return out;
}
export function targetShape(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (!record(value)) return typeof value;
  const names = ['ref', 'role', 'name', 'nth', 'within', 'id', 'selector', 'x', 'y'].filter(k => k in value);
  return `object(${names.join(',')}${Object.keys(value).some(k => !names.includes(k)) ? ',other-keys' : ''})`;
}
export function argumentShapes(args: unknown) {
  return targetArguments(args).map(t => ({ path: t.path, shape: targetShape(t.value) }));
}
export function proposeRefArguments(raw: unknown): { args: unknown; refs: Array<{ path: string; ref: string }> } {
  if (!record(raw)) return { args: raw, refs: [] };
  const refs: Array<{ path: string; ref: string }> = [];
  const adapt = (value: unknown, path: string) => {
    if (typeof value === 'string' && /^[A-Za-z]+[1-9][0-9]*$/.test(value) && value.length <= 64) {
      refs.push({ path, ref: value });
      return { ref: value };
    }
    return value;
  };
  const args = { ...raw };
  if ('target' in args) args.target = adapt(args.target, 'target');
  if (Array.isArray(args.fields))
    args.fields = args.fields.map((f, i) =>
      record(f) && 'target' in f ? { ...f, target: adapt(f.target, `fields.${i}.target`) } : f,
    );
  // submit/to strings have defined meanings (Enter/scroll): never reinterpret them.
  return { args, refs };
}

interface ValidationIssue {
  path: readonly PropertyKey[];
  code: string;
  errors?: readonly (readonly ValidationIssue[])[];
}
/** Zod's union children are expanded to safe field paths/codes only; never raw messages or input. */
export function validationIssues(
  issues: readonly ValidationIssue[],
  prefix: readonly PropertyKey[] = [],
): Array<{ path: string; code: string }> {
  const allowed = [
    'target',
    'fields',
    'ref',
    'role',
    'name',
    'nth',
    'within',
    'submit',
    'to',
    'value',
    'text',
    'keys',
    'tabId',
  ];
  return issues
    .flatMap(i => {
      const path = prefix.length && i.path[0] !== prefix[0] ? [...prefix, ...i.path] : i.path;
      if (i.errors) return i.errors.flatMap(branch => validationIssues(branch, path));
      return [
        {
          path:
            path
              .map(p => (typeof p === 'number' ? p : allowed.includes(String(p)) ? String(p) : '(field)'))
              .join('.') || '(arguments)',
          code: i.code,
        },
      ];
    })
    .slice(0, 24);
}
