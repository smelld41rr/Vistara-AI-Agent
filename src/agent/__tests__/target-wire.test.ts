import { describe, it, expect } from 'vitest';
import { createModel, streamTurn } from '@src/llm';
import { allTools } from '@src/agent/tools';
import { ClickArgsSchema } from '@src/browser-control';
describe('actual Gemini SDK tool serialization with simulated HTTP, no live API', () => {
  it.each([{ ref: 'g29' }, 'g29', { id: 'g29' }])(
    'retains response target %j without guessing or executing it',
    async target => {
      const requests: Array<Record<string, unknown>> = [];
      const fetcher = async (_url: unknown, init?: RequestInit) => {
        requests.push(JSON.parse(init?.body as string));
        const payload = {
          candidates: [
            {
              content: { role: 'model', parts: [{ functionCall: { name: 'click', args: { target } } }] },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 1 },
        };
        return new Response('data: ' + JSON.stringify(payload) + '\n\n', {
          headers: { 'content-type': 'text/event-stream' },
        });
      };
      const selected = Object.fromEntries(
        allTools()
          .filter(t => ['click', 'set', 'type', 'press', 'fill_form', 'find', 'snapshot'].includes(t.name))
          .map(t => [t.name, t]),
      );
      const result = await streamTurn({
        chat: createModel(
          { kind: 'gemini', modelName: 'gemini-fixture', apiKey: 'synthetic-test-only' },
          { fetch: fetcher as typeof fetch },
        ),
        system: 'Fixture only',
        messages: [{ role: 'user', content: 'Click Hint' }],
        tools: selected,
        retry: { attempts: 1, baseMs: 1, maxMs: 1 },
      });
      expect(requests).toHaveLength(1);
      const defs = JSON.stringify(requests[0].tools);
      expect(defs).toContain('"ref"');
      expect(defs).not.toContain('"selector"');
      expect(defs).not.toContain('"x"');
      expect(defs).toContain('target OBJECT');
      expect(result.toolCalls[0]?.input).toEqual({ target });
      expect(result.toolCalls[0]?.invalid).toBeUndefined();
      expect(ClickArgsSchema.safeParse(result.toolCalls[0]?.input).success).toBe(
        typeof target === 'object' && 'ref' in target,
      );
    },
  );
});
