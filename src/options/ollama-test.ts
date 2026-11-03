// Diagnostic calls never execute browser tools. Arguments must pass the original strict schemas.
import { ClickArgsSchema, SetArgsSchema } from '@src/browser-control';
import { createModel, listModels, streamTurn } from '@src/llm';
import type { ConnectionResult, CreateModelOptions, ModelSpec } from '@src/llm';

export function ollamaProblem(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/timeout|timed out|abort/i.test(message))
    return 'Request timed out. Increase the request timeout or use a smaller model.';
  if (/memory|allocation|out of memory|requires more/i.test(message))
    return 'Insufficient memory. Close other models or select a smaller downloaded model.';
  if (/context|token.*limit/i.test(message))
    return 'Model context is too small. Increase Ollama num_ctx within your hardware limits or choose a larger-context model.';
  if (/404|not found/i.test(message))
    return 'Model or endpoint not found. Refresh List Models and select an installed model; check the server URL.';
  if (/403|cors|origin/i.test(message))
    return 'The server may have blocked this extension origin. Configure the exact Vistara origin below and restart Ollama.';
  if (/tool.*support|does not support tools/i.test(message))
    return 'This model does not support tool calling. Choose a tool-capable installed model and test again.';
  if (/invalid.*url|url.*invalid/i.test(message))
    return 'Enter a valid http:// or https:// server URL without credentials, query or fragment.';
  // Browser fetch cannot distinguish not installed, stopped server, refused connection and some CORS failures.
  return 'Could not connect or validate the model response. Verify Ollama is installed and running, the server URL is correct, and the extension origin is allowed. Check Ollama logs for the exact cause.';
}

export async function testOllamaAgent(spec: ModelSpec, options: CreateModelOptions = {}): Promise<ConnectionResult> {
  const started = performance.now();
  const failed = (error: string, originRefused = false): ConnectionResult => ({
    ok: false,
    toolCalling: false,
    error,
    originRefused,
    ms: performance.now() - started,
  });
  try {
    const installed = await listModels(spec, options.fetch);
    if (![...installed.models, ...installed.hidden].includes(spec.modelName))
      return failed(
        'Model is not installed on this server. Refresh List Models and download your chosen model manually in Ollama.',
      );
    const target = {
      type: 'object',
      properties: { ref: { type: 'string', enum: ['g29'] } },
      required: ['ref'],
      additionalProperties: false,
    };
    for (const name of ['click', 'set'] as const) {
      const parameters = {
        type: 'object',
        properties: { target, ...(name === 'set' ? { value: { type: 'string', enum: ['Hello world'] } } : {}) },
        required: name === 'set' ? ['target', 'value'] : ['target'],
        additionalProperties: false,
      };
      const result = await streamTurn({
        chat: createModel({ ...spec, maxOutputTokens: 1024 }, options),
        system:
          'This is a tool-format diagnostic. Call only the specified tool exactly once. Do not write text. The tool is not executed.',
        messages: [
          {
            role: 'user',
            content:
              name === 'click'
                ? 'Call click with {"target":{"ref":"g29"}}.'
                : 'Call set with {"target":{"ref":"g29"},"value":"Hello world"}.',
          },
        ],
        tools: { [name]: { description: 'Diagnostic only; structured reference target required.', parameters } },
        retry: { attempts: 1, baseMs: 0, maxMs: 0 },
        fallback: false,
      });
      if (result.error) return failed(ollamaProblem(new Error(result.error.message)), result.error.status === 403);
      const call = result.toolCalls[0];
      const schema = name === 'click' ? ClickArgsSchema : SetArgsSchema;
      const parsed = schema.safeParse(call?.input);
      if (
        result.toolCalls.length !== 1 ||
        call?.toolName !== name ||
        call.invalid ||
        !parsed.success ||
        JSON.stringify((call.input as { target?: unknown }).target) !== JSON.stringify({ ref: 'g29' }) ||
        (name === 'set' && (call.input as { value?: unknown }).value !== 'Hello world')
      )
        return failed(
          `Structured ${name} diagnostic failed. This model is not Agent Ready; choose a tool-capable model or retest. No browser action was dispatched.`,
        );
    }
    return { ok: true, toolCalling: true, ms: performance.now() - started };
  } catch (error) {
    return failed(ollamaProblem(error), !!(error as { originRefused?: boolean })?.originRefused);
  }
}
