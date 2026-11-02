import type { Conversation, Settings } from '../core/schemas';
export interface BootData { settings: Settings; conversations: Conversation[]; keys: { gemini: boolean; groq: boolean } }
export type View = 'Chat' | 'Agent Tasks' | 'Workflows' | 'Extract Data' | 'History' | 'Settings';
export type ProviderId = 'gemini' | 'groq';
export type Notify = (message: string, kind?: 'success' | 'error') => void;
export const providerNames: Record<ProviderId, string> = { gemini: 'Google Gemini', groq: 'Groq' };
export const providerOrigins: Record<ProviderId, string> = { gemini: 'https://generativelanguage.googleapis.com/*', groq: 'https://api.groq.com/*' };
export function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Something went wrong. Please try again.';
  const hint = 'hint' in error && typeof error.hint === 'string' ? error.hint : '';
  return [error.message, hint && !error.message.includes(hint) ? hint : ''].filter(Boolean).join(' ');
}
export function downloadFile(filename: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
