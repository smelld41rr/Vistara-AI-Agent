import { useState } from 'react';
import { Download, History, MessageSquare, Search, Trash2 } from 'lucide-react';
import type { Conversation } from '../core/schemas';
import { rpc } from '../core/client';
import { redact } from '../core/security';
import { downloadFile, errorMessage, providerNames, type Notify } from './types';
interface Props { conversations: Conversation[]; onOpen: (id: string) => void; reload: () => Promise<void>; notify: Notify }
export function HistoryView({ conversations, onOpen, reload, notify }: Props) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));
  const remove = async (id?: string) => {
    if (!window.confirm(id ? 'Delete this conversation?' : 'Delete all conversation history from this browser?')) return;
    setBusy(true);
    try { await rpc(id ? 'CONVERSATION_DELETE' : 'HISTORY_CLEAR', id ? { id } : {}); await reload(); notify(id ? 'Conversation deleted.' : 'Conversation history cleared.'); }
    catch (e) { notify(errorMessage(e), 'error'); } finally { setBusy(false); }
  };
  return <section className="page-view history-view"><div className="page-heading"><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h1>A little history.</h1><p>Your conversations, kept on this device.</p></div><div className="search-field"><Search size={16}/><input aria-label="Search conversations" placeholder="Search conversations…" value={query} onChange={(e) => setQuery(e.target.value)}/></div>
    {!conversations.length ? <div className="empty-state"><History size={28}/><h2>A fresh start.</h2><p>Your conversations will appear here after your first message.</p></div> : <><div className="history-toolbar"><span>{filtered.length} conversation{filtered.length === 1 ? '' : 's'}</span><button className="text-button" onClick={() => downloadFile('vistara-conversations.json', redact(JSON.stringify({ exportedAt: new Date().toISOString(), conversations }, null, 2)))}><Download size={13}/>Export</button><button className="text-button danger-text" disabled={busy} onClick={() => void remove()}><Trash2 size={13}/>Clear</button></div><div className="history-list">{filtered.map((c) => <article className="history-card" key={c.id}><button className="history-open" onClick={() => onOpen(c.id)}><span className="history-icon"><MessageSquare size={16}/></span><span><strong>{c.title}</strong><small>{providerNames[c.provider]} · {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small><p>{c.messages.length} messages · {c.usage.requests} requests</p></span></button><button className="icon-button" title="Delete conversation" aria-label={`Delete ${c.title}`} onClick={() => void remove(c.id)} disabled={busy}><Trash2 size={15}/></button></article>)}</div>{!filtered.length && <div className="empty-state"><Search size={25}/><h2>No matches yet.</h2><p>Try a different conversation title.</p></div>}</>}
    <div className="history-note"><strong>A note on this early build</strong><p>Task timelines and workflow run history will be added with those milestones. No task runs are simulated here.</p></div>
  </section>;
}
