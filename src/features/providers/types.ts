import type { ZodType } from 'zod';

export type ProviderId = string;
export type ErrorCode = 'auth_invalid' | 'forbidden' | 'rate_limited' | 'quota_exhausted' | 'billing_required' | 'model_unavailable' | 'network' | 'timeout' | 'invalid_request' | 'content_blocked' | 'unknown' | 'cancelled' | 'temporarily_unavailable' | 'stream_parser' | 'incompatible_capabilities' | 'redirect_blocked' | 'permission_missing' | 'unsupported_streaming';
export interface Model {
  id: string;
  name: string;
  capabilities: { text: boolean; tools: boolean | 'unknown'; streaming: boolean; structured: boolean | 'unknown'; images: boolean | 'unknown' };
  freeTier: 'unknown';
}
export interface ToolCall { id: string; name: string; arguments: Record<string, unknown>; thoughtSignature?: string }
export interface ToolDefinition { name: string; description: string; parameters: Record<string, unknown> }
export interface ProviderMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  toolName?: string;
}
export interface GenerateRequest {
  model: string;
  messages: ProviderMessage[];
  system?: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  retries?: number;
  signal?: AbortSignal;
  tools?: ToolDefinition[];
  jsonMode?: boolean;
}
export interface Usage { inputTokens?: number; outputTokens?: number; totalTokens?: number }
export interface GenerateResult { text: string; toolCalls?: ToolCall[]; usage?: Usage; finishReason?: string }
export type StreamEvent = { type: 'delta'; text: string } | { type: 'done'; result: GenerateResult };
export interface Provider {
  readonly id: ProviderId;
  readonly displayName: string;
  testConnection(request:GenerateRequest):Promise<GenerateResult>;
  generateWithTools(request:GenerateRequest):Promise<GenerateResult>;
  cancel():void;
  getCapabilities():Model['capabilities'];
  listModels(signal?: AbortSignal): Promise<Model[]>;
  generate(request: GenerateRequest): Promise<GenerateResult>;
  stream(request: GenerateRequest): AsyncGenerator<StreamEvent>;
  generateStructured<T>(request: GenerateRequest, schema: ZodType<T>): Promise<{ data: T; result: GenerateResult }>;
}
