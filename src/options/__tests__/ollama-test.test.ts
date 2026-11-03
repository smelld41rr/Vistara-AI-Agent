import { describe, expect, it } from 'vitest';
import { testOllamaAgent, ollamaProblem } from '../ollama-test';
import { openAICompatibleBaseUrl, listModels } from '@src/llm';
function response(name: string, target: unknown) {
  const delta = {
    role: 'assistant',
    tool_calls: [
      {
        index: 0,
        id: 'diagnostic',
        type: 'function',
        function: { name, arguments: JSON.stringify({ target, ...(name === 'set' ? { value: 'Hello world' } : {}) }) },
      },
    ],
  };
  const chunk = (delta: unknown, finish: string | null) => ({
    id: 'test',
    object: 'chat.completion.chunk',
    created: 0,
    model: 'local',
    choices: [{ index: 0, delta, finish_reason: finish }],
  });
  return new Response(
    `data: ${JSON.stringify(chunk(delta, null))}\n\ndata: ${JSON.stringify(chunk({}, 'tool_calls'))}\n\ndata: [DONE]\n\n`,
    { headers: { 'content-type': 'text/event-stream' } },
  );
}
describe('Ollama diagnostics through actual SDK with simulated HTTP; no local inference or browser', () => {
  it.each(['http://localhost:11434', 'http://localhost:11434/v1/', ' http://localhost:11434/v1/v1 '])(
    'normalizes %s',
    url => expect(openAICompatibleBaseUrl('ollama', url)).toBe('http://localhost:11434/v1'),
  );
  it.each([
    'ftp://localhost:11434',
    'http://user:password@localhost:11434',
    'http://localhost:11434?key=secret',
    'not a URL',
  ])('rejects unsafe URL %s', url => expect(() => openAICompatibleBaseUrl('ollama', url)).toThrow());
  it('lists only actual server entries; does not synthesize or download models', async () => {
    const urls: string[] = [];
    const list = await listModels({ kind: 'ollama', baseUrl: 'http://localhost:11434/v1/v1/' }, async input => {
      urls.push(String(input));
      return Response.json({ models: [{ name: 'qwen3:8b' }] });
    });
    expect(urls).toEqual(['http://localhost:11434/api/tags']);
    expect(list.models).toEqual(['qwen3:8b']);
  });
  it.each([{ ref: 'g29' }, 'g29', { id: 'g29' }])('checks exact structured arguments for %j', async target => {
    const requests: Array<{ url: string; body?: Record<string, unknown> }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
      requests.push({ url: String(url), body });
      if (!body) return Response.json({ models: [{ name: 'local' }] });
      const tools = body.tools as Array<{ function: { name: string } }>;
      return response(tools[0].function.name, target);
    };
    const r = await testOllamaAgent({ kind: 'ollama', modelName: 'local' }, { fetch: fetcher });
    const valid = typeof target === 'object' && 'ref' in target;
    expect(r.ok).toBe(valid);
    expect(r.toolCalling).toBe(valid);
    expect(requests).toHaveLength(valid ? 3 : 2);
    expect(requests[1].url).toBe('http://localhost:11434/v1/chat/completions');
    expect(JSON.stringify(requests[1].body?.tools)).toContain('"ref"');
    expect(JSON.stringify(requests[1].body?.tools)).not.toContain('"selector"');
  });
  it('never tests an unavailable model or downloads one', async () => {
    let count = 0;
    const r = await testOllamaAgent(
      { kind: 'ollama', modelName: 'missing' },
      {
        fetch: async () => {
          count++;
          return Response.json({ models: [] });
        },
      },
    );
    expect(r.ok).toBe(false);
    expect(r.error).toContain('not installed');
    expect(count).toBe(1);
  });
  it.each([
    'timeout',
    'out of memory',
    'context length exceeded',
    '404 model not found',
    '403 forbidden',
    'does not support tools',
  ])('provides actionable error for %s', message =>
    expect(ollamaProblem(new Error(message))).not.toContain('Could not connect'),
  );
});
