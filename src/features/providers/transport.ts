import { ProviderError, normalizeProviderError } from './errors';

export interface RequestScope { signal: AbortSignal; dispose(): void; error(error: unknown): ProviderError }
export function scope(timeoutMs: number, parent?: AbortSignal): RequestScope {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  parent?.addEventListener('abort', abort, { once: true });
  if (parent?.aborted) abort();
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, Math.min(180_000, Math.max(100, timeoutMs)));
  return {
    signal: controller.signal,
    dispose() { clearTimeout(timer); parent?.removeEventListener('abort', abort); },
    error(error) {
      if (controller.signal.aborted) return new ProviderError(timedOut ? 'timeout' : 'cancelled');
      if (error instanceof ProviderError) return error;
      return new ProviderError('network');
    },
  };
}
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new ProviderError('cancelled')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}
export async function request(fetcher: typeof fetch, url: string, init: RequestInit, signal: AbortSignal, retries = 0): Promise<Response> {
  for (let attempt = 0; attempt <= Math.min(2, Math.max(0, retries)); attempt++) {
    if (signal.aborted) throw new ProviderError('cancelled');
    let response: Response;
    try { response = await fetcher(url, { ...init, signal }); }
    catch (error) {
      if (signal.aborted) throw error;
      if (attempt < Math.min(2, Math.max(0, retries))) { await delay(250 * 2 ** attempt + Math.random() * 150, signal); continue; }
      throw new ProviderError('network');
    }
    if (response.ok) return response;
    const detail = (await response.text()).slice(0, 16_000);
    if ([500, 502, 503, 504].includes(response.status) && attempt < Math.min(2, Math.max(0, retries))) {
      await delay(250 * 2 ** attempt + Math.random() * 150, signal); continue;
    }
    // In particular, 429 is never retried automatically.
    throw normalizeProviderError(response.status, detail, response.headers.get('retry-after') ?? undefined);
  }
  throw new ProviderError('network');
}
export async function readJSON(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length > 4_000_000) throw new ProviderError('invalid_request');
  try { return JSON.parse(text) as unknown; } catch { throw new ProviderError('invalid_request'); }
}
export async function* readSSE(response: Response, signal: AbortSignal): AsyncGenerator<unknown> {
  if (!response.body) throw new ProviderError('invalid_request');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let bytes = 0;
  let eventCount = 0;
  const abort = () => { void reader.cancel(); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new ProviderError('cancelled');
      const { value, done } = await reader.read();
      if (signal.aborted) throw new ProviderError('cancelled');
      bytes += value?.byteLength ?? 0;
      if (bytes > 4_000_000) throw new ProviderError('invalid_request');
      buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/g, '\n');
      if (buffer.length > 1_000_000) throw new ProviderError('invalid_request');
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (data === '[DONE]') return;
        if (!data) continue;
        if (++eventCount > 20_000) throw new ProviderError('invalid_request');
        try { yield JSON.parse(data) as unknown; } catch (error) { if (error instanceof ProviderError) throw error; throw new ProviderError('invalid_request'); }
      }
      if (done) {
        if (buffer.trim()) {
          const data = buffer.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
          if (data && data !== '[DONE]') { try { yield JSON.parse(data) as unknown; } catch { throw new ProviderError('invalid_request'); } }
        }
        break;
      }
    }
  } finally { signal.removeEventListener('abort', abort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
