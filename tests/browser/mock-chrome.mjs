/** Explicitly scripted background substitute; never shipped with production assets. */
export function installMockChrome({ snapshot, seededConversation }) {
  const listeners = new Set();
  const requests = [];
  const settings = {
    provider: 'gemini', models: { gemini: '', groq: '' }, consent: { gemini: false, groq: false },
    theme: 'light', compact: false, fontSize: 14, temperature: 0.4, maxOutputTokens: 2048,
    timeoutMs: 30000, retries: 1, contextBudget: 12000, maxSteps: 12,
  };
  const state = { settings, conversations: seededConversation ? [seededConversation] : [], keys: { gemini: false, groq: false }, requests, active: null, nextChatError: null };
  const model = { id: 'fixture-model', name: 'Fixture model (mock only)', capabilities: { text: true, tools: 'unknown', streaming: true, structured: 'unknown', images: 'unknown' }, freeTier: 'unknown' };
  const emit = message => { for (const listener of listeners) listener(message, { id: 'vistara-fixture' }, () => {}); };
  const recordConversation = conversation => {
    state.conversations = [conversation, ...state.conversations.filter(c => c.id !== conversation.id)];
  };
  const dataFor = async (type, payload = {}) => {
    requests.push({ type, payload: type === 'KEY_SET' ? { ...payload, key: '[REDACTED]' } : payload });
    switch (type) {
      case 'AGENT_GET': return null;
      case 'BOOT': return globalThis.structuredClone({ settings: state.settings, conversations: state.conversations, keys: state.keys });
      case 'SETTINGS_SAVE': state.settings = globalThis.structuredClone(payload.settings); return state.settings;
      case 'KEY_SET': state.keys[payload.provider] = true; return null;
      case 'KEY_REMOVE': state.keys[payload.provider] = false; return null;
      case 'MODELS_LIST': return [model];
      case 'CONNECTION_TEST': return { message: 'Fixture connection ready (mock only).', models: [model] };
      case 'PAGE_READ': return snapshot;
      case 'CHAT_START': {
        const id = payload.conversationId ?? `fixture-chat-${Date.now()}`;
        const prior = state.conversations.find(c => c.id === id);
        const conversation = prior ? globalThis.structuredClone(prior) : {
          id, title: payload.prompt.slice(0, 50), updatedAt: Date.now(), messages: [],
          usage: { requests: 0, inputTokens: null, outputTokens: null }, provider: state.settings.provider, model: state.settings.models[state.settings.provider],
        };
        conversation.messages.push({ id: globalThis.crypto.randomUUID(), role: 'user', content: payload.prompt });
        const requestId = `request-${Date.now()}`;
        const text = payload.includePage
          ? `Fixture response from actual page text: ${snapshot.text.slice(0, 200)}\n\nSource: ${snapshot.url}`
          : 'Fixture response (mock provider only). <img src=x onerror="window.__injected=true">';
        state.active = { requestId, conversation, cancelled: false, text };
        const task = state.active;
        const plannedError = state.nextChatError; state.nextChatError = null;
        setTimeout(() => {
          if (task.cancelled) return;
          if (plannedError) {
            conversation.messages.push({ id: globalThis.crypto.randomUUID(), role: 'assistant', content: '', status: 'interrupted' });
            recordConversation(conversation);
            emit({ type: 'CHAT_EVENT', requestId, conversationId: id, event: { type: 'error', ...plannedError } });
            emit({ type: 'CHAT_EVENT', requestId, conversationId: id, event: { type: 'done', conversation } });
            state.active = null; return;
          }
          emit({ type: 'CHAT_EVENT', requestId, conversationId: id, event: { type: 'delta', text: text.slice(0, 30) } });
          setTimeout(() => {
            if (task.cancelled) return;
            emit({ type: 'CHAT_EVENT', requestId, conversationId: id, event: { type: 'delta', text: text.slice(30) } });
            conversation.messages.push({ id: globalThis.crypto.randomUUID(), role: 'assistant', content: text, status: 'complete', sources: payload.includePage ? [snapshot.url] : [] });
            conversation.usage.requests++;
            recordConversation(conversation);
            emit({ type: 'CHAT_EVENT', requestId, conversationId: id, event: { type: 'done', conversation } });
            state.active = null;
          }, 500);
        }, 250);
        return { requestId, conversationId: id };
      }
      case 'CHAT_STOP': {
        const task = state.active;
        if (task && task.requestId === payload.requestId) {
          task.cancelled = true;
          task.conversation.messages.push({ id: globalThis.crypto.randomUUID(), role: 'assistant', content: '', status: 'cancelled' });
          recordConversation(task.conversation);
          emit({ type: 'CHAT_EVENT', requestId: task.requestId, conversationId: task.conversation.id, event: { type: 'done', conversation: task.conversation } });
          state.active = null;
        }
        return null;
      }
      case 'CONVERSATION_DELETE': state.conversations = state.conversations.filter(c => c.id !== payload.id); return null;
      case 'HISTORY_CLEAR': state.conversations = []; return null;
      case 'DATA_CLEAR': state.conversations = []; state.keys = { gemini: false, groq: false }; state.settings = globalThis.structuredClone(settings); return null;
      default: throw new Error(`Unsupported fixture RPC: ${type}`);
    }
  };
  window.__vistaraMock = state;
  window.chrome = {
    runtime: {
      id: 'vistara-fixture',
      getURL: path => new URL(path, window.location.origin).href,
      onMessage: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) },
      sendMessage: async request => {
        try { return { ok: true, id: request.id, data: await dataFor(request.type, request.payload) }; }
        catch (error) { return { ok: false, id: request.id, error: { message: error.message, code: 'fixture_error' } }; }
      },
    },
    permissions: {
      contains: async () => true,
      request: async details => { requests.push({ type: 'PERMISSION_REQUEST', payload: details }); return true; },
      getAll: async () => ({ permissions: [], origins: [] }),
      remove: async () => true,
    },
    tabs: { query: async () => [{ id: 1, title: snapshot.title, url: snapshot.url }] },
  };
}
