export function Brand({ small = false }: { small?: boolean }) {
  return <div className={`brand ${small ? 'small' : ''}`}>
    <svg className="brand-mark" viewBox="0 0 36 36" fill="none" aria-hidden="true"><rect width="36" height="36" rx="11" fill="currentColor"/><path d="m9 11 9 15 9-15M14 11l4 7 4-7" stroke="var(--mark-ink)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div><strong>vistara<span>ai</span></strong>{!small && <span className="brand-sub">A little clarity. A lot of possibility.</span>}</div>
  </div>;
}
