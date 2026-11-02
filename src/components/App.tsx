import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Database, History, ListTodo, LoaderCircle, MessageSquare, Plus, Settings2, Workflow, X } from 'lucide-react';
import { rpc } from '../core/client';
import type { Conversation, Settings } from '../core/schemas';
import { useAppStore } from '../hooks/useAppStore';
import { Brand } from './ui/Brand';
import { AgentView } from './AgentView';
import { ChatView } from './ChatView';
import { SettingsView } from './SettingsView';
import { HistoryView } from './HistoryView';
import { errorMessage, type BootData, type Notify, type View } from './types';

const nav = [
  { name: 'Chat', icon: MessageSquare }, { name: 'Agent Tasks', icon: ListTodo }, { name: 'Workflows', icon: Workflow },
  { name: 'Extract Data', icon: Database }, { name: 'History', icon: History }, { name: 'Settings', icon: Settings2 },
] as const;
const pending: Partial<Record<View, { description: string; milestone: string }>> = {
  Workflows: { description: 'Reusable workflows and their visual editor are planned after the browser action engine is verified.', milestone: 'Milestone 5' },
  'Extract Data': { description: 'Structured extraction, comparisons, and CSV exports are planned. You can already ask about headings or links in Chat.', milestone: 'Milestone 4' },
};
export function App() {
  const { view, setView } = useAppStore();
  const [boot, setBoot] = useState<BootData>();
  const [bootError, setBootError] = useState('');
  const [currentId, setCurrentId] = useState<string>();
  const [resetKey, setResetKey] = useState(0);
  const [chatBusy, setChatBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; kind: string }>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify: Notify = useCallback((message, kind = 'success') => {
    setNotice({ message, kind }); clearTimeout(timer.current); timer.current = setTimeout(() => setNotice(undefined), 6500);
  }, []);
  const reload = useCallback(async () => {
    try { setBoot(await rpc<BootData>('BOOT')); setBootError(''); }
    catch (error) { setBootError(errorMessage(error)); }
  }, []);
  useEffect(() => { void reload(); return () => clearTimeout(timer.current); }, [reload]);
  useEffect(() => {
    if (!boot) return;
    const { settings } = boot;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.compact = String(settings.compact);
    document.documentElement.style.setProperty('--user-font-size', `${settings.fontSize}px`);
  }, [boot]);
  const updateConversation = useCallback((conversation: Conversation) => setBoot((b) => b ? { ...b, conversations: [conversation, ...b.conversations.filter((c) => c.id !== conversation.id)] } : b), []);
  const saveSettings = async (settings: Settings) => {
    const saved = await rpc<Settings>('SETTINGS_SAVE', { settings });
    setBoot((b) => b ? { ...b, settings: saved } : b);
  };
  if (bootError) return <main className="startup"><Brand/><AlertCircle size={30}/><h1>Couldn’t connect to Vistara</h1><p>{bootError}</p><p className="muted">Open this panel from the installed Chrome extension. If you updated the extension, reload it at chrome://extensions.</p><button className="primary" onClick={() => void reload()}>Try again</button></main>;
  if (!boot) return <main className="startup"><Brand/><LoaderCircle className="spin" size={26}/><p>Opening your workspace…</p></main>;
  const conversation = boot.conversations.find((c) => c.id === currentId);
  return <div className="app-shell">
    <header className="app-header"><Brand small/><div className="header-actions"><span className="build-badge">EARLY BUILD</span><button className="icon-button" aria-label="New conversation" title={chatBusy ? "Stop the response before starting a new conversation" : "New conversation"} disabled={chatBusy} onClick={() => { setCurrentId(undefined); setResetKey((key) => key + 1); setView('Chat'); }}><Plus size={19}/></button></div></header>
    <nav className="main-nav" aria-label="Main navigation">{nav.map(({ name, icon: Icon }) => <button key={name} onClick={() => setView(name)} className={view === name ? 'selected' : ''} aria-current={view === name ? 'page' : undefined} title={name}><Icon size={17}/><span>{name === 'Agent Tasks' ? 'Tasks' : name === 'Extract Data' ? 'Extract' : name}</span></button>)}</nav>
    {notice && <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`toast ${notice.kind}`}><span>{notice.message}</span><button aria-label="Dismiss notification" className="icon-button" onClick={() => setNotice(undefined)}><X size={15}/></button></div>}
    <main className={`main-content ${view === 'Chat' ? 'chat-main' : ''}`}>
      {view === 'Chat' && <ChatView onDeleted={reload} onBusyChange={setChatBusy} resetKey={resetKey} settings={boot.settings} hasKey={boot.keys[boot.settings.provider]} conversation={conversation} onConversation={updateConversation} onSelectConversation={setCurrentId} onSettings={() => setView('Settings')} notify={notify}/>}
      {view === 'Agent Tasks' && <AgentView/>}
      {view === 'Settings' && <SettingsView boot={boot} saveSettings={saveSettings} reload={reload} notify={notify}/>}
      {view === 'History' && <HistoryView conversations={boot.conversations} onOpen={(id) => { setCurrentId(id); setView('Chat'); }} reload={reload} notify={notify}/>}
      {pending[view] && <section className="pending-state"><div className="pending-symbol"><Workflow size={28}/></div><div className="eyebrow">{pending[view]?.milestone}</div><h1>{view}</h1><span className="status-pill">Not built yet</span><p>{pending[view]?.description}</p><p className="muted">This screen is not built yet. Chat remains read-only; browser actions run from Tasks with explicit consent and approvals. Workflows and schedules remain pending.</p><button className="secondary" onClick={() => setView('Chat')}><ArrowLeft size={15}/> Back to Chat</button></section>}
    </main>
    <footer className="app-footer"><span className="local-dot"/> Stored on this device<span>v0.2.0 · M2</span></footer>
  </div>;
}
