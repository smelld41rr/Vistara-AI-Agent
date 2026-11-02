import type { ErrorCode } from './types';

const guidance: Record<ErrorCode, [string, string]> = {
  auth_invalid: ['The API key was rejected.', 'Replace the key in Settings, then test the connection.'],
  forbidden: ['The provider denied this request.', 'Check key restrictions, region, project access and provider terms.'],
  rate_limited: ['The provider rate limit was reached. The request stopped.', 'Wait for the provider retry window before trying again. No automatic retry or provider switch was made.'],
  quota_exhausted: ['The provider quota is exhausted. The request stopped.', 'Check the provider dashboard and free-tier limits. No automatic retry or provider switch was made.'],
  billing_required: ['This request requires billing or credits at the provider.', 'Choose an eligible model or check your provider account. Vistara never enables billing.'],
  model_unavailable: ['The selected model is unavailable.', 'Refresh the model list and explicitly choose an available model.'],
  network: ['The provider could not be reached.', 'Check your connection and grant access to the selected provider in Settings.'],
  timeout: ['The provider response timed out.', 'Try again manually or increase the request timeout in Settings.'],
  invalid_request: ['The provider request or response was invalid.', 'Check model capabilities and settings. Unknown capabilities are not guaranteed to work.'],
  content_blocked: ['The provider blocked the response.', 'Review the request and provider safety guidance.'],
  unknown: ['The provider could not complete this request.', 'Try again manually and check the provider service status.'],
  cancelled: ['The request was stopped.', 'You can send a new request when ready.'],
};
export class ProviderError extends Error {
  readonly code: ErrorCode;
  readonly hint: string;
  readonly retryAfter?: string;
  constructor(code: ErrorCode, retryAfter?: string) {
    super(guidance[code][0]);
    this.name = 'ProviderError';
    this.code = code;
    this.hint = guidance[code][1];
    // Never pass arbitrary server header content into UI or logs.
    if (retryAfter && /^(\d{1,8}|[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT)$/.test(retryAfter)) this.retryAfter = retryAfter;
  }
}
export function normalizeProviderError(status: number, detail = '', retryAfter?: string): ProviderError {
  // The body is inspected only for classification, never returned or logged.
  if (status === 401) return new ProviderError('auth_invalid');
  if (/billing|payment.required|insufficient.credit/i.test(detail) || status === 402) return new ProviderError('billing_required');
  if (status === 403) return new ProviderError('forbidden');
  if (status === 429) return new ProviderError(/quota|resource.exhausted|insufficient_quota/i.test(detail) ? 'quota_exhausted' : 'rate_limited', retryAfter);
  if (status === 404) return new ProviderError('model_unavailable');
  if (status === 400 || status === 422) return new ProviderError('invalid_request');
  if (status >= 500) return new ProviderError('network');
  return new ProviderError('unknown');
}
