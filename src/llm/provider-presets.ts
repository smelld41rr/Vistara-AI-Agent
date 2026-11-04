// Official compatibility documentation checked 4 November 2026; presets select endpoints, not guaranteed capabilities.
export const PROVIDER_PRESETS = [
  { id: 'xai', label: 'xAI Grok', baseUrl: 'https://api.x.ai/v1' },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com' },
  { id: 'mistral', label: 'Mistral', baseUrl: 'https://api.mistral.ai/v1' },
  {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    docs: 'https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-120b-infer',
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    docs: 'https://console.groq.com/docs/openai',
  },
  {
    id: 'together',
    label: 'Together AI',
    baseUrl: 'https://api.together.ai/v1',
    docs: 'https://docs.together.ai/docs/inference/openai-compatibility',
  },
  {
    id: 'cerebras',
    label: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    docs: 'https://inference-docs.cerebras.ai/resources/openai',
  },
  {
    id: 'fireworks',
    label: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    docs: 'https://docs.fireworks.ai/tools-sdks/openai-compatibility',
  },
  {
    id: 'deepinfra',
    label: 'DeepInfra',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    docs: 'https://docs.deepinfra.com/chat/overview',
  },
];

/** Base URL only: preserve vendor version/path, never invent /v1 or accept full operation URLs. */
export function normalizeCompatibleUrl(input: string): string {
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new Error('Invalid endpoint: enter an absolute HTTP(S) API base URL.');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  )
    throw new Error('Invalid endpoint: credentials, query, fragment and non-HTTP protocols are not supported.');
  const path = parsed.pathname.replace(/\/+$/, '');
  if (/\/(?:chat\/completions|responses|models)$/i.test(path))
    throw new Error('Invalid endpoint: enter the API base URL, not /chat/completions, /responses or /models.');
  parsed.pathname = path;
  return parsed.toString().replace(/\/+$/, '');
}
export function insecureRemoteEndpoint(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}
