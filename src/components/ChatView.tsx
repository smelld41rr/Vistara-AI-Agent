import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Check, ChevronDown, Copy, ExternalLink, FileText, Globe2, Link2, LoaderCircle, MessageSquare, RefreshCw, ShieldCheck, Square, Trash2, X } from 'lucide-react';
import type { Conversation, Settings } from '../core/schemas';
import type { PageSnapshot } from '../features/browser/types';
import { selectedProfile,sameDestination } from '../features/provider-hub/profiles';
import { rpc } from '../core/client';
import { Markdown } from './ui/Markdown';
import { errorMessage, type Notify } from './types';

interface Props { onDeleted: () => Promise<void>; onBusyChange: (busy: boolean) => void; resetKey: number; settings: Settings; hasKey: boolean; conversation?: Conversation; onConversation: (c: Conversation) => void; onSelectConversation: (id: string) => void; onSettings: () => void; notify: Notify }
const prompts = [
  { icon: FileText, title: 'Summarize a page', description: 'Find the important parts', prompt: 'Summarize the current page. Include the key points and any important caveats.', page: true },
  { icon: MessageSquare, title: 'Explain a selection', description: 'Make complex ideas clearer', prompt: 'Explain the selected text from the current page in simple terms.', page: true },
  { icon: Link2, title: 'Find useful links', description: 'See where to go next', prompt: 'List the most relevant links on the current page, with a short explanation of each.', page: true },
  { icon: BookOpen, title: 'Explore an idea', description: 'Think it through together', prompt: 'Help me think through an idea. Start by asking what I am working on.', page: false },
];
export function ChatView({ onDeleted, onBusyChange, resetKey, settings, hasKey, conversation, onConversation, onSelectConversation, onSettings, notify }: Props) {
  const profile=selectedProfile(settings,'chat');
  const [prompt, setPrompt] = useState('');
  const [includePage, setIncludePage] = useState(false);
  const [snapshot, setSnapshot] = useState<PageSnapshot>();
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string>();
  const active = useRef<string | undefined>(undefined);
  const starting = useRef(false);
  const pendingStop = useRef(false);
  const [stopping, setStopping] = useState(false);
  const scrollEnd = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const activeConversation = useRef<string | undefined>(conversation?.id);
  const callbacks = useRef({ onConversation, onSelectConversation, notify });
  callbacks.current = { onConversation, onSelectConversation, notify };
  useEffect(() => { onBusyChange(busy); return () => onBusyChange(false); }, [busy, onBusyChange]);
  useEffect(() => {
    // Finishing our own new request attaches its durable conversation object.
    // Preserve its error/consent state; reset only on an external conversation switch.
    if (conversation?.id !== activeConversation.current) {
      activeConversation.current = conversation?.id;
      setIncludePage(false); setSnapshot(undefined); setError('');
    }
  }, [conversation?.id]);
  useEffect(() => {
    if (active.current) void rpc('CHAT_STOP', { requestId: active.current }).catch(() => undefined);
    activeConversation.current = undefined;
    setPrompt(''); setIncludePage(false); setSnapshot(undefined); setError('');
  }, [resetKey]);
  useEffect(() => {
    const listener = (message: unknown) => {
      if (!message || typeof message !== 'object') return;
      const m = message as { type?: string; requestId?: string; conversationId?: string; event?: { type: string; text?: string; conversation?: Conversation; message?: string; hint?: string } };
      if (m.type !== 'CHAT_EVENT' || !m.event || (!starting.current && m.requestId !== active.current)) return;
      if (starting.current && !active.current) active.current = m.requestId;
      if (m.event.type === 'draft') setDraft(m.event.text ?? '');
      if (m.event.type === 'delta') setDraft((text) => text + (m.event?.text ?? ''));
      if (m.event.type === 'error') { setError([m.event.message, m.event.hint].filter(Boolean).join(' ')); return; }
      if (m.event.type === 'done') {
        setBusy(false); setStopping(false); pendingStop.current = false; starting.current = false; active.current = undefined; setDraft(''); setPendingPrompt('');
        if (m.event.conversation) { activeConversation.current = m.event.conversation.id; callbacks.current.onConversation(m.event.conversation); callbacks.current.onSelectConversation(m.event.conversation.id); }
        if (!m.event.conversation && m.conversationId) void rpc<{ conversations: Conversation[] }>('BOOT').then((b) => {
          const found = b.conversations.find((c) => c.id === m.conversationId); if (found) callbacks.current.onConversation(found);
        });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => { chrome.runtime.onMessage.removeListener(listener); if (active.current) void rpc('CHAT_STOP', { requestId: active.current }).catch(() => undefined); };
  }, []);
  useEffect(() => { scrollEnd.current?.scrollIntoView({ behavior: 'instant', block: 'end' }); }, [draft, conversation?.messages.length, busy]);
  const preview = async () => {
    setReading(true); setError('');
    try { setSnapshot(await rpc<PageSnapshot>('PAGE_READ')); }
    catch (e) { setError(errorMessage(e)); }
    finally { setReading(false); }
  };
  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    if (!hasKey || !profile.model) { onSettings(); notify('Add your API key, discover models, and choose one to start.'); return; }
    if (!profile.consent) { onSettings(); notify('Review and accept the provider disclosure before sending a message.'); return; }
    pendingStop.current = false; setStopping(false); setBusy(true); starting.current = true; active.current = undefined; setDraft(''); setError(''); setPendingPrompt(text.trim()); setPrompt('');
    activeConversation.current = conversation?.id;
    try {
      const result = await rpc<{ requestId: string; conversationId: string }>('CHAT_START', { conversationId: conversation?.id, prompt: text.trim(), includePage });
      if (starting.current) { active.current = result.requestId; activeConversation.current = result.conversationId; onSelectConversation(result.conversationId); if (pendingStop.current) await rpc('CHAT_STOP', { requestId: result.requestId }); }
    } catch (e) { starting.current = false; active.current = undefined; setBusy(false); setPendingPrompt(''); setError(errorMessage(e)); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void send(prompt); };
  const stop = async () => {
    pendingStop.current = true; setStopping(true);
    if (!active.current) return;
    try { await rpc('CHAT_STOP', { requestId: active.current }); }
    catch (e) { setError(errorMessage(e)); }
  };
  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(undefined), 1800); }
    catch { notify('Clipboard access was blocked. You can select and copy the text manually.', 'error'); }
  };
  const clear = async () => {
    if (!conversation || busy || !window.confirm('Delete this conversation from this device?')) return;
    try { await rpc('CONVERSATION_DELETE', { id: conversation.id }); await onDeleted(); onSelectConversation(''); notify('Conversation deleted.'); }
    catch (e) { notify(errorMessage(e), 'error'); }
  };
  const messages = conversation?.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const model = profile.model;
  return <div className="chat-view">
    <div className="context-bar"><div><span className={`status-dot ${hasKey && model ? 'ready' : ''}`}/><button className="text-button provider-button" onClick={onSettings}>{profile.name} <ChevronDown size={13}/></button></div><span className="model-name" title={model || 'No model selected'}>{model ? model.replace(/^models\//, '') : 'Choose a model'}</span></div>
    <div className="chat-scroll">
      {conversation&&!sameDestination(conversation,profile)&&<div className="error-card">This history belongs to another profile or endpoint. Start a new conversation to use {profile.name}; earlier messages will not be forwarded.</div>}
      {!messages.length && !busy && <div className="welcome">
        <div className="welcome-art" aria-hidden="true"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="art-core"><svg viewBox="0 0 44 44" fill="none"><path d="m10 12 12 21 12-21M17 12l5 9 5-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="art-spark s-one"/><span className="art-spark s-two"/></div>
        <div className="eyebrow">A CLEARER WAY TO WORK</div><h1>What’s on your mind?</h1><p className="welcome-copy">Bring a question, a page, or a little curiosity.<br/>Let’s make sense of it together.</p>
        {(!hasKey || !model) && <button className="setup-card" onClick={onSettings}><span className="setup-icon"><ShieldCheck size={20}/></span><span><strong>Make it yours</strong><small>Connect your own AI key to begin</small></span><ArrowUp size={16} className="setup-arrow"/></button>}
        <div className="suggestions">{prompts.map(({ icon: Icon, title, description, prompt: suggestion, page }) => <button key={title} onClick={() => { setPrompt(suggestion); if (page) setIncludePage(true); textarea.current?.focus(); }}><Icon size={18}/><strong>{title}</strong><span>{description}</span></button>)}</div>
        <div className="welcome-note"><ShieldCheck size={13}/><span>Page context is off until you choose to share it.</span></div>
      </div>}
      {messages.length > 0 && <div className="conversation-heading"><span>THIS CONVERSATION</span><button className="icon-button" aria-label="Delete current conversation" disabled={busy} onClick={() => void clear()}><Trash2 size={14}/></button></div>}
      {messages.map((message) => <article className={`message ${message.role}`} key={message.id}><div className="message-label">{message.role === 'user' ? 'You' : <><span className="assistant-mark">v</span> Vistara</>}<span>{message.status && message.status !== 'complete' ? message.status : ''}</span></div><Markdown text={message.content}/>{message.sources?.length ? <div className="sources">{message.sources.map((url) => /^https?:\/\//i.test(url) && <a key={url} href={url} target="_blank" rel="noreferrer noopener"><ExternalLink size={12}/>{(() => { try { return new URL(url).hostname; } catch { return 'Source'; } })()}</a>)}</div> : null}{message.role === 'assistant' && <div className="message-actions"><button className="text-button" onClick={() => void copy(message.id, message.content)}>{copied === message.id ? <Check size={13}/> : <Copy size={13}/>} {copied === message.id ? 'Copied' : 'Copy'}</button></div>}</article>)}
      {busy && <>{pendingPrompt && !messages.some((m) => m.role === 'user' && m.content === pendingPrompt) && <article className="message user"><div className="message-label">You</div><Markdown text={pendingPrompt}/></article>}<article className="message assistant"><div className="message-label"><span className="assistant-mark">v</span> Vistara <span className="thinking-label"><LoaderCircle size={11} className="spin"/>{draft ? 'Responding' : stopping ? 'Stopping' : 'Thinking'}</span></div>{draft ? <Markdown text={draft}/> : <div className="thinking-dots" aria-label="Waiting for AI response"><i/><i/><i/></div>}</article></>}
      {!busy && lastUser && <div className="regenerate-row"><button className="text-button" onClick={() => void send(lastUser.content)}><RefreshCw size={13}/> Ask again</button></div>}
      {error && <div role="alert" className="error-card"><strong>That didn’t go through</strong><p>{error}</p><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}
      <div ref={scrollEnd}/>
    </div>
    {snapshot && <section className="page-preview"><header><strong><FileText size={14}/> Page preview</strong><button className="icon-button" aria-label="Close page preview" onClick={() => setSnapshot(undefined)}><X size={14}/></button></header><p className="preview-title">{snapshot.title}</p><p className="preview-url">{snapshot.url}</p><p>{snapshot.text.slice(0, 500)}{snapshot.text.length > 500 ? '…' : ''}</p><small>{snapshot.headings.length} headings · {snapshot.links.length} links · {snapshot.text.length.toLocaleString()} characters{snapshot.truncated ? ' · truncated' : ''}</small>{snapshot.warnings.map((warning) => <small className="warning-line" key={warning}>{warning}</small>)}<div className="privacy-hint">Preview stays on this device. Enable page context to include a fresh snapshot in your next message.</div></section>}
    <form className="composer-wrap" onSubmit={submit}>
      <div className="composer"><textarea ref={textarea} aria-label="Message Vistara" placeholder="Ask anything, or explore this page…" value={prompt} maxLength={16000} rows={3} disabled={busy} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(prompt); } }}/><div className="composer-tools"><label className={`context-toggle ${includePage ? 'on' : ''}`}><input type="checkbox" checked={includePage} disabled={busy} onChange={(e) => setIncludePage(e.target.checked)}/><Globe2 size={14}/> Page context <span>{includePage ? 'On' : 'Off'}</span></label><div className="composer-right"><button type="button" className="icon-button" title="Preview current page locally" aria-label="Preview current page" disabled={reading || busy} onClick={() => void preview()}>{reading ? <LoaderCircle size={16} className="spin"/> : <FileText size={16}/>}</button>{busy ? <button type="button" className="send-button stop" disabled={stopping} onClick={() => void stop()} aria-label="Stop response" title="Stop response"><Square size={14} fill="currentColor"/></button> : <button type="submit" className="send-button" disabled={!prompt.trim()||Boolean(conversation&&!sameDestination(conversation,profile))} aria-label="Send message"><ArrowUp size={18}/></button>}</div></div></div>
      <p className="composer-disclosure">{includePage ? <>Current page content will be sent to {profile.name}.</> : <>Your message goes to {profile.name}. Page context is off.</>}</p>
      {conversation && <details className="usage"><summary>Conversation usage <ArrowDown size={11}/></summary><div>{conversation.usage.requests} requests · Input tokens: {conversation.usage.inputTokens ?? 'unavailable'} · Output tokens: {conversation.usage.outputTokens ?? 'unavailable'}<br/>Remaining provider quota is unavailable. No unlimited free usage.</div></details>}
    </form>
  </div>;
}
