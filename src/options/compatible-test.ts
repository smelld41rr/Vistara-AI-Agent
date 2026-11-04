// Public synthetic diagnostics through the existing model/stream path; never dispatch to a webpage.
import { ClickArgsSchema, SetArgsSchema } from '@src/browser-control';
import { createModel, listModels, streamTurn } from '@src/llm';
import type { ConnectionResult, CreateModelOptions, ModelMessage, ModelSpec } from '@src/llm';
export type DiagnosticMode = 'connection' | 'text' | 'tools';
export function providerProblem(error: unknown, status?: number): string {
  const message = error instanceof Error ? error.message : String(error);
  if (status === 401 || /invalid.*(?:api.?key|authentication)/i.test(message))
    return 'Invalid API key. Save a valid key for this provider.';
  if (status === 402 || /credit|billing|quota.*exceed|insufficient.*quota/i.test(message))
    return 'Provider credits or billing are required. Vistara will not purchase credits or change providers.';
  if (status === 429) return 'Provider rate limit reached. Wait and retry; no other provider was selected.';
  if (status && status >= 500) return 'Provider unavailable. Retry later or check its service status.';
  if (/context|token.*limit/i.test(message))
    return 'Context-window overflow. Use a supported context size or a suitable model.';
  if (/timeout|timed out|abort/i.test(message)) return 'Request timed out. Adjust the optional timeout or try again.';
  if (status === 404)
    return 'Unsupported model or endpoint. Verify the exact model ID and API base URL; manual model entry is available.';
  if (/Invalid endpoint|Invalid URL/i.test(message))
    return 'Invalid endpoint. Enter the HTTP(S) API base URL, without credentials, query, fragment or /chat/completions.';
  if (status === 403) return 'Access denied: check model permissions, endpoint access and provider origin/CORS policy.';
  if (/tool/i.test(message))
    return 'Structured tool-call failure. The model is not Agent Ready; test a compatible model.';
  return 'Network, extension permission or response failure. Check Chrome site access, network restrictions and provider logs. Browser fetch cannot reliably identify CORS as the sole cause.';
}

export async function testCompatibleModel(
  spec: ModelSpec,
  mode: DiagnosticMode,
  options: CreateModelOptions = {},
): Promise<ConnectionResult> {
  const start = performance.now();
  const fail = (message: string): ConnectionResult => ({
    ok: false,
    toolCalling: false,
    error: message,
    ms: performance.now() - start,
  });
  try {
    if (mode === 'connection') {
      await listModels(spec, options.fetch);
      return { ok: true, toolCalling: false, connected: true, ms: performance.now() - start };
    }
    const chat = createModel(
      { ...spec, maxOutputTokens: 1024, requestTimeoutMs: spec.requestTimeoutMs ?? 120_000 },
      options,
    );
    const base = { chat, retry: { attempts: 1, baseMs: 0, maxMs: 0 }, fallback: false as const };
    if (mode === 'text') {
      const r = await streamTurn({
        ...base,
        system: 'This is a connection test. Reply with VISTARA_OK. No tools.',
        messages: [{ role: 'user', content: 'Reply VISTARA_OK.' }],
      });
      if (r.error) return fail(providerProblem(new Error(r.error.message), r.error.status));
      if (!r.text.trim() || r.toolCalls.length || r.finish === 'length')
        return fail('Text generation failed or was truncated. The model is not Chat Ready.');
      return { ok: true, toolCalling: false, chatReady: true, ms: performance.now() - start };
    }
    const target = {
      type: 'object',
      properties: { ref: { type: 'string', enum: ['g29'] } },
      required: ['ref'],
      additionalProperties: false,
    };
    for (const name of ['click', 'set'] as const) {
      const tools = {
        [name]: {
          description: 'Diagnostic only; never executed. Use the exact structured target.',
          parameters: {
            type: 'object',
            properties: { target, ...(name === 'set' ? { value: { type: 'string', enum: ['Hello world'] } } : {}) },
            required: name === 'set' ? ['target', 'value'] : ['target'],
            additionalProperties: false,
          },
        },
      };
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: `Call ${name} exactly once with target {"ref":"g29"}${name === 'set' ? ' and value "Hello world"' : ''}.`,
        },
      ];
      const r = await streamTurn({
        ...base,
        system: 'Test structured browser tools. Call only the specified tool, exactly once. No prose.',
        messages,
        tools,
      });
      if (r.error) return fail(providerProblem(new Error(r.error.message), r.error.status));
      const call = r.toolCalls[0];
      if (
        r.toolCalls.length !== 1 ||
        !call?.toolCallId ||
        call.toolName !== name ||
        call.invalid ||
        !(name === 'click' ? ClickArgsSchema : SetArgsSchema).safeParse(call.input).success ||
        JSON.stringify((call.input as { target?: unknown }).target) !== '{"ref":"g29"}' ||
        (name === 'set' && (call.input as { value?: unknown }).value !== 'Hello world')
      )
        return fail(
          `Structured ${name} arguments failed validation. No browser action was dispatched; this model is not Agent Ready.`,
        );
      if (name === 'set') {
        const continued = await streamTurn({
          ...base,
          system: 'After the synthetic diagnostic result reply VISTARA_OK, with no tools.',
          tools,
          toolChoice: 'none',
          messages: [
            ...messages,
            {
              role: 'assistant',
              content: [{ type: 'tool-call', toolCallId: call.toolCallId, toolName: name, input: call.input }],
            },
            {
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolCallId: call.toolCallId,
                  toolName: name,
                  output: { type: 'text', value: 'Synthetic diagnostic complete. No browser action executed.' },
                },
              ],
            },
          ],
        });
        if (continued.error) return fail(providerProblem(new Error(continued.error.message), continued.error.status));
        if (!continued.text.includes('VISTARA_OK') || continued.toolCalls.length || continued.finish === 'length')
          return fail('Tool-result continuation failed. The model is not Agent Ready.');
      }
    }
    return { ok: true, toolCalling: true, ms: performance.now() - start };
  } catch (error) {
    return fail(providerProblem(error, (error as { status?: number })?.status));
  }
}
