/** Explicitly scripted background substitute; never shipped with production assets. */
export function installMockChrome({ snapshot, seededConversation }) {
  const listeners = new Set();
  const requests = [];
  const settings = {
    provider: 'gemini', models: { gemini: '', groq: '' }, consent: { gemini: false, groq: false },
    theme: 'light', compact: false, fontSize: 14, temperature: 0.4, maxOutputTokens: 2048,
    timeoutMs: 30000, retries: 1, contextBudget: 12000, maxSteps: 12,
  };
  const profile=kind=>({id:kind,name:kind==='gemini'?'Google Gemini':'Groq',kind,protocol:kind==='gemini'?'gemini':'openai',baseUrl:kind==='gemini'?'https://generativelanguage.googleapis.com/v1beta':'https://api.groq.com/openai/v1',model:'',consent:false,discover:true,streaming:true,tools:true,temperatureEnabled:true,temperature:0.3,timeoutMs:45000,maxOutputTokens:2048,localHttp:false,options:{tokenParameter:'max_tokens',streamUsage:false,fallbackNonStreaming:false}});
  settings.hub={version:1,profiles:[profile('gemini'),profile('groq')],chatDefault:'gemini',tasksDefault:'gemini'};
  const diagnosticReports={};
  const state = { settings, conversations: seededConversation ? [seededConversation] : [], keys: { gemini: false, groq: false }, requests, active: null, nextChatError: null };
  const model = { id: 'fixture-model', name: 'Fixture model (mock only)', capabilities: { text: true, tools: 'unknown', streaming: true, structured: 'unknown', images: 'unknown' }, freeTier: 'unknown' };
  const emit = message => { for (const listener of listeners) listener(message, { id: 'vistara-fixture' }, () => {}); };
  const recordConversation = conversation => {
    state.conversations = [conversation, ...state.conversations.filter(c => c.id !== conversation.id)];
  };
  const dataFor = async (type, payload = {}) => {
    requests.push({ type, payload: ['KEY_SET','PROFILE_SAVE','PROFILE_DIAG'].includes(type) ? { ...payload, key: '[REDACTED]' } : payload });
    switch (type) {
      case 'AGENT_GET': return null;
      case 'BOOT': return globalThis.structuredClone({ settings: state.settings, conversations: state.conversations, keys: state.keys });
      case 'SETTINGS_SAVE': state.settings = globalThis.structuredClone(payload.settings); return state.settings;
      case 'PROFILE_SAVE': {const p=globalThis.structuredClone(payload.profile);p.diagnostics=diagnosticReports[p.id];const profiles=state.settings.hub.profiles;const i=profiles.findIndex(x=>x.id===p.id);if(i<0)profiles.push(p);else profiles[i]=p;if(payload.key)state.keys[p.id]=true;state.settings.models[p.id]=p.model;state.settings.consent[p.id]=p.consent;return p;}
      case 'PROFILE_DEFAULT':state.settings.hub[payload.target==='chat'?'chatDefault':'tasksDefault']=payload.id;if(payload.target==='chat')state.settings.provider=payload.id;return state.settings.hub;
      case 'PROFILE_DIAG':{const p=payload.profile;const unverified={status:'unverified',message:'Not tested (scripted UI fixture).',at:0};const report=diagnosticReports[p.id]??{binding:'fixture-only',authentication:unverified,models:unverified,text:unverified,stream:unverified,tools:unverified,usage:{requests:0,inputTokens:null,outputTokens:null}};report.authentication={status:'pass',message:'Mock authentication only',at:Date.now()};report[payload.stage]={status:'pass',message:'Fixture '+payload.stage+' passed (mock only).',at:Date.now()};diagnosticReports[p.id]=report;return {report,models:payload.stage==='models'?[model]:undefined};}
      case 'PROFILE_EXPORT':return {version:1,profiles:state.settings.hub.profiles.map(profile=>{const p={...profile,consent:false};delete p.diagnostics;return p;})};
      case 'PROFILE_CANCEL':return null;
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
