/* Vistara AI modification, 2026-11-02: branding/privacy changes; see NOTICE and docs/CHANGED_FILES.md. */
// Vistara modification: project links are untracked and never contact the original product service.
export const websiteUrl = (path: '/' | '/docs', _place: 'side-panel' | 'settings' | 'about') =>
  `https://github.com/smelld41rr/Vistara-AI-Agent${path === '/docs' ? '#readme' : ''}`;
