/** Deterministic test double. Never exposed as a user-selectable production provider. */
import type { ZodType } from 'zod';
import { ProviderError } from './errors';
import type { GenerateRequest, GenerateResult, Model, Provider, StreamEvent } from './types';
export type MockStep = { result?: GenerateResult; deltas?: string[]; delayMs?: number; error?: ProviderError };
export class MockProvider implements Provider {
  readonly id = 'gemini' as const;
  readonly displayName = 'Scripted test provider';
  readonly requests: GenerateRequest[] = [];
  #steps: MockStep[];
  constructor(steps: MockStep[]) { this.#steps = [...steps]; }
  async listModels(): Promise<Model[]> { return [{ id: 'fixture-model', name: 'Fixture model (test only)', capabilities: { text: true, tools: true, streaming: true, structured: true, images: false }, freeTier: 'unknown' }]; }
  async #next(input: GenerateRequest): Promise<MockStep> {
    if (input.signal?.aborted) throw new ProviderError('cancelled');
    this.requests.push(input);
    const step = this.#steps.shift();
    if (!step) throw new ProviderError('invalid_request');
    if (step.delayMs) await new Promise<void>((resolve, reject) => {
      const cleanup = () => input.signal?.removeEventListener('abort', abort);
      const abort = () => { clearTimeout(timer); cleanup(); reject(new ProviderError('cancelled')); };
      const timer = setTimeout(() => { cleanup(); resolve(); }, Math.min(step.delayMs ?? 0, 10_000));
      input.signal?.addEventListener('abort', abort, { once: true });
      if (input.signal?.aborted) abort();
    });
    if (step.error) throw step.error;
    return step;
  }
  async generate(input: GenerateRequest): Promise<GenerateResult> {
    const step = await this.#next(input);
    return step.result ?? { text: step.deltas?.join('') ?? '' };
  }
  async *stream(input: GenerateRequest): AsyncGenerator<StreamEvent> {
    const step = await this.#next(input);
    for (const text of step.deltas ?? [step.result?.text ?? '']) {
      if (input.signal?.aborted) throw new ProviderError('cancelled');
      yield { type: 'delta', text };
    }
    yield { type: 'done', result: step.result ?? { text: step.deltas?.join('') ?? '' } };
  }
  async generateStructured<T>(input: GenerateRequest, schema: ZodType<T>): Promise<{ data: T; result: GenerateResult }> {
    const result = await this.generate(input);
    try {
      const parsed = schema.safeParse(JSON.parse(result.text) as unknown);
      if (!parsed.success) throw new ProviderError('invalid_request');
      return { data: parsed.data, result };
    } catch { throw new ProviderError('invalid_request'); }
  }
}
