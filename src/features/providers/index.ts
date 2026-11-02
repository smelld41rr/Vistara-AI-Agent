import { validateRequest } from './validation';
import { z, type ZodType } from 'zod';
import { ProviderBase } from './base';
import { checkedProfile,newProfile,type Profile } from '../provider-hub/profiles';
import { AnthropicProvider } from './anthropic';
import { ProviderError } from './errors';
import { readJSON, readSSE, request as httpRequest, scope } from './transport';
import type { GenerateRequest, GenerateResult, Model, Provider, ProviderId, ProviderMessage, StreamEvent, ToolCall, Usage } from './types';
export * from './types';
export { ProviderError, normalizeProviderError } from './errors';

const object = z.record(z.string(), z.unknown());
const callSchema = z.object({ id: z.string(), name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/), arguments: object, thoughtSignature: z.string().optional() });
const geminiPayload = z.object({
  candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional(), thoughtSignature: z.string().optional(), functionCall: z.object({ id: z.string().optional(), name: z.string(), args: object.optional() }).optional() }).passthrough()).optional() }).optional(), finishReason: z.string().optional() })).optional(),
  usageMetadata: z.object({ promptTokenCount: z.number().optional(), candidatesTokenCount: z.number().optional(), totalTokenCount: z.number().optional() }).optional(),
  promptFeedback: z.object({ blockReason: z.string().optional() }).optional(),
});
const groqCall = z.object({ id: z.string().optional(), index: z.number().optional(), type: z.string().optional(), function: z.object({ name: z.string().optional(), arguments: z.string().optional() }) });
const groqMessage = z.object({ content: z.string().nullable().optional(), tool_calls: z.array(groqCall).optional() });
const groqPayload = z.object({
  choices: z.array(z.object({ message: groqMessage.optional(), delta: groqMessage.optional(), finish_reason: z.string().nullable().optional() })).optional(),
  usage: z.object({ prompt_tokens: z.number().optional(), completion_tokens: z.number().optional(), total_tokens: z.number().optional() }).nullable().optional(),
  x_groq: z.object({ usage: z.object({ prompt_tokens: z.number().optional(), completion_tokens: z.number().optional(), total_tokens: z.number().optional() }).optional() }).optional(),
});
function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ProviderError('invalid_request');
  return result.data;
}
function usage(value?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null): Usage | undefined {
  return value ? { inputTokens: value.prompt_tokens, outputTokens: value.completion_tokens, totalTokens: value.total_tokens } : undefined;
}
function geminiResult(raw: unknown): GenerateResult {
  const data = parse(geminiPayload, raw);
  const reason = data.candidates?.[0]?.finishReason;
  if (data.promptFeedback?.blockReason || ['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'IMAGE_SAFETY'].includes(reason ?? '')) throw new ProviderError('content_blocked');
  if (['MALFORMED_FUNCTION_CALL', 'UNEXPECTED_TOOL_CALL'].includes(reason ?? '')) throw new ProviderError('invalid_request');
  const candidate = data.candidates?.[0];
  if (!candidate && !data.usageMetadata) throw new ProviderError('invalid_request');
  const parts = candidate?.content?.parts ?? [];
  const calls: ToolCall[] = parts.flatMap(part => part.functionCall ? [parse(callSchema, { id: part.functionCall.id ?? crypto.randomUUID(), name: part.functionCall.name, arguments: part.functionCall.args ?? {}, thoughtSignature: part.thoughtSignature })] : []);
  return {
    text: parts.filter(part => !part.thought).map(part => part.text ?? '').join(''),
    toolCalls: calls.length ? calls : undefined,
    usage: data.usageMetadata ? { inputTokens: data.usageMetadata.promptTokenCount, outputTokens: data.usageMetadata.candidatesTokenCount, totalTokens: data.usageMetadata.totalTokenCount } : undefined,
    finishReason: candidate?.finishReason,
  };
}
function geminiContents(messages: ProviderMessage[]): unknown[] {
  return messages.map(message => {
    if (message.role === 'tool') return { role: 'user', parts: [{ functionResponse: { id: message.toolCallId, name: message.toolName ?? message.toolCallId, response: { result: message.content } } }] };
    const parts: unknown[] = message.content ? [{ text: message.content }] : [];
    for (const call of message.toolCalls ?? []) parts.push({ functionCall: { id: call.id, name: call.name, args: call.arguments }, ...(call.thoughtSignature ? { thoughtSignature: call.thoughtSignature } : {}) });
    return { role: message.role === 'assistant' ? 'model' : 'user', parts };
  });
}
function body(profile:Profile, input: GenerateRequest, stream: boolean): Record<string, unknown> {
  if (profile.protocol === 'gemini') return {
    contents: geminiContents(input.messages),
    ...(input.system ? { systemInstruction: { parts: [{ text: input.system }] } } : {}),
    generationConfig: { ...(profile.temperatureEnabled?{temperature:input.temperature}:{}), maxOutputTokens: input.maxOutputTokens, ...(input.jsonMode ? { responseMimeType: 'application/json' } : {}) },
    ...(input.tools?.length ? { tools: [{ functionDeclarations: input.tools }] } : {}),
  };
  const messages: unknown[] = input.system ? [{ role: 'system', content: input.system }] : [];
  for (const message of input.messages) messages.push({
    role: message.role, content: message.content || (message.toolCalls?.length ? null : ''),
    ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
    ...(message.toolCalls?.length ? { tool_calls: message.toolCalls.map(call => ({ id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.arguments) } })) } : {}),
  });
  return { model: input.model, messages, ...(profile.temperatureEnabled?{temperature:input.temperature}:{}), [profile.options.tokenParameter]: input.maxOutputTokens, stream, ...(stream&&profile.options.streamUsage ? { stream_options: { include_usage: true } } : {}), ...(input.tools?.length ? { tools: input.tools.map(tool => ({ type: 'function', function: tool })) } : {}), ...(input.jsonMode ? { response_format: { type: 'json_object' } } : {}) };
}
class HTTPProvider extends ProviderBase {
  readonly displayName: string;
  #key: string;
  #fetch: typeof fetch;
  constructor(readonly id: ProviderId, key: string, fetcher: typeof fetch,profile:Profile) {
    super(profile);
    this.#key = key;
    this.#fetch = fetcher;
    this.displayName = profile.name;
  }
  #headers(): Record<string, string> {
    return { 'Content-Type': 'application/json', ...(this.profile.protocol === 'gemini' ? { 'x-goog-api-key': this.#key } : { Authorization: `Bearer ${this.#key}` }) };
  }
  async listModels(signal?: AbortSignal): Promise<Model[]> {
    if(!this.profile.discover)throw new ProviderError('incompatible_capabilities');
    const guard = scope(this.profile.timeoutMs,this.requestSignal(signal));
    const models: Model[] = [];
    let pageToken: string | undefined;
    try {
      for (let page = 0; page < 20; page++) {
        const endpoint = this.profile.protocol === 'gemini' ? `${this.profile.baseUrl}/models?pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}` : `${this.profile.baseUrl}/models`;
        const response = await httpRequest(this.#fetch, endpoint, { headers: this.#headers() }, guard.signal);
        const json = await readJSON(response);
        if (this.profile.protocol === 'gemini') {
          const result = parse(z.object({ models: z.array(z.object({ name: z.string(), displayName: z.string().optional(), supportedGenerationMethods: z.array(z.string()).optional() })).optional(), nextPageToken: z.string().optional() }), json);
          for (const model of result.models ?? []) {
            if (!model.supportedGenerationMethods?.includes('generateContent') || /tts|speech|audio|embedding|image-generation/i.test(model.name)) continue;
            models.push({ id: model.name.replace(/^models\//, ''), name: model.displayName ?? model.name, capabilities: { text: true, tools: 'unknown', streaming: true, structured: 'unknown', images: 'unknown' }, freeTier: 'unknown' });
          }
          if (!result.nextPageToken) break;
          if (result.nextPageToken === pageToken) throw new ProviderError('invalid_request');
          pageToken = result.nextPageToken;
          if (page === 19) throw new ProviderError('invalid_request');
        } else {
          const list=z.array(z.object({id:z.string(),active:z.boolean().optional(),object:z.string().optional()}));
          const parsed=parse(z.union([z.object({data:list}),list]),json);const result={data:Array.isArray(parsed)?parsed:parsed.data};
          // /models includes speech and other non-chat models. Do not represent those as chat models.
          for (const model of result.data) if (model.active !== false && !/whisper|tts|speech|audio|orpheus|guard|moderation|embedding|rerank|diffusion|flux|realtime|transcri/i.test(model.id)) models.push({ id: model.id, name: model.id, capabilities: { text: true, tools: 'unknown', streaming: true, structured: 'unknown', images: 'unknown' }, freeTier: 'unknown' });
          break;
        }
      }
      return [...new Map(models.map(model => [model.id, model])).values()].sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) { throw guard.error(error); } finally { guard.dispose(); }
  }
  async #response(input: GenerateRequest, stream: boolean, signal: AbortSignal): Promise<Response> {
    const model = input.model.replace(/^models\//, '');
    const endpoint = this.profile.protocol === 'gemini' ? `${this.profile.baseUrl}/models/${encodeURIComponent(model)}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}` : `${this.profile.baseUrl}/chat/completions`;
    return httpRequest(this.#fetch, endpoint, { method: 'POST', headers: this.#headers(), body: JSON.stringify(body(this.profile, input, stream)) }, signal, input.retries);
  }
  async generate(input: GenerateRequest): Promise<GenerateResult> {
    validateRequest(input);
    const guard = scope(input.timeoutMs, this.requestSignal(input.signal));
    try {
      const response = await this.#response(input, false, guard.signal);
      const json = await readJSON(response);
      if (this.profile.protocol === 'gemini') return geminiResult(json);
      const data = parse(groqPayload, json);
      const candidate = data.choices?.[0];
      if (!candidate?.message) throw new ProviderError('invalid_request');
      if (candidate.finish_reason === 'content_filter') throw new ProviderError('content_blocked');
      const toolCalls = candidate.message.tool_calls?.map(call => {
        let args: unknown;
        try { args = JSON.parse(call.function.arguments ?? '{}') as unknown; } catch { throw new ProviderError('invalid_request'); }
        return parse(callSchema, { id: call.id ?? crypto.randomUUID(), name: call.function.name, arguments: args });
      });
      return { text: candidate.message.content ?? '', toolCalls, usage: usage(data.usage ?? data.x_groq?.usage), finishReason: candidate.finish_reason ?? undefined };
    } catch (error) { throw guard.error(error); } finally { guard.dispose(); }
  }
  async *stream(input: GenerateRequest): AsyncGenerator<StreamEvent> {
    if(!this.profile.streaming)throw new ProviderError('unsupported_streaming');
    validateRequest(input);
    const guard = scope(input.timeoutMs, this.requestSignal(input.signal));
    let result: GenerateResult = { text: '' };
    const calls = new Map<number, { id: string; name: string; arguments: string }>();
    let received = false;
    try {
      const response = await this.#response(input, true, guard.signal);
      for await (const json of readSSE(response, guard.signal)) {
        received = true;
        if (this.profile.protocol === 'gemini') {
          const next = geminiResult(json);
          result.text += next.text;
          if (next.toolCalls) result.toolCalls = [...(result.toolCalls ?? []), ...next.toolCalls];
          result.usage = next.usage ?? result.usage;
          result.finishReason = next.finishReason ?? result.finishReason;
          if (next.text) yield { type: 'delta', text: next.text };
        } else {
          const data = parse(groqPayload, json);
          const candidate = data.choices?.[0];
          if (candidate?.finish_reason === 'content_filter') throw new ProviderError('content_blocked');
          const delta = candidate?.delta;
          if (delta?.content) { result.text += delta.content; yield { type: 'delta', text: delta.content }; }
          for (const call of delta?.tool_calls ?? []) {
            const current = calls.get(call.index ?? 0) ?? { id: '', name: '', arguments: '' };
            current.id += call.id ?? ''; current.name += call.function.name ?? ''; current.arguments += call.function.arguments ?? '';
            if (current.arguments.length > 100_000) throw new ProviderError('invalid_request');
            calls.set(call.index ?? 0, current);
          }
          result.usage = usage(data.usage ?? data.x_groq?.usage) ?? result.usage;
          result.finishReason = candidate?.finish_reason ?? result.finishReason;
        }
        if (result.text.length > 500_000) throw new ProviderError('invalid_request');
      }
      if (!received || !result.finishReason) throw new ProviderError('stream_parser');
      if (calls.size) result = { ...result, toolCalls: [...calls.values()].map(call => {
        let args: unknown;
        try { args = JSON.parse(call.arguments || '{}') as unknown; } catch { throw new ProviderError('invalid_request'); }
        return parse(callSchema, { id: call.id || crypto.randomUUID(), name: call.name, arguments: args });
      }) };
      yield { type: 'done', result };
    } catch (error) { if(error instanceof ProviderError&&error.code==='invalid_request')throw new ProviderError('stream_parser');throw guard.error(error); } finally { guard.dispose(); }
  }
  async generateStructured<T>(input: GenerateRequest, schema: ZodType<T>): Promise<{ data: T; result: GenerateResult }> {
    const result = await this.generate({ ...input, jsonMode: true });
    let json: unknown;
    try { json = JSON.parse(result.text) as unknown; } catch { throw new ProviderError('invalid_request'); }
    return { data: parse(schema, json), result };
  }
}
export function createProvider(id:ProviderId,key:string,options:{fetch?:typeof fetch;profile?:Profile}={}):Provider{
 if(!options.profile&&!['gemini','groq'].includes(id))throw new ProviderError('invalid_request');
 const profile=checkedProfile(options.profile??newProfile(id==='gemini'?'gemini':'groq',id));
 if(profile.id!==id||!key.trim()||key.length>1024)throw new ProviderError('auth_invalid');
 return profile.protocol==='anthropic'?new AnthropicProvider(profile,key,options.fetch??fetch):new HTTPProvider(id,key,options.fetch??fetch,profile);
}
