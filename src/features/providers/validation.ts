import { z } from 'zod';
import { ProviderError } from './errors';
import type { GenerateRequest } from './types';
const object=z.record(z.string(),z.unknown());
const callSchema=z.object({id:z.string(),name:z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/),arguments:object,thoughtSignature:z.string().optional()});
const requestSchema = z.object({
  model: z.string().min(1).max(250).regex(/^[a-zA-Z0-9._/:-]+$/),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'tool']), content: z.string().max(150_000), toolCalls: z.array(callSchema).max(16).optional(), toolCallId: z.string().optional(), toolName: z.string().optional() })).min(1).max(100),
  system: z.string().max(50_000).optional(), temperature: z.number().min(0).max(2), maxOutputTokens: z.number().int().min(1).max(32768),
  timeoutMs: z.number().int().min(100).max(180000), retries: z.number().int().min(0).max(2).optional(),
  tools: z.array(z.object({ name: z.string(), description: z.string(), parameters: object })).max(40).optional(), jsonMode: z.boolean().optional(),
});
export function validateRequest(input:GenerateRequest){if(!requestSchema.safeParse(input).success)throw new ProviderError('invalid_request');}
