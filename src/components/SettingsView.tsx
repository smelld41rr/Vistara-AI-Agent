import { useEffect, useState, type FormEvent } from 'react';
import { Check, ChevronRight, ExternalLink, KeyRound, LoaderCircle, LockKeyhole, Monitor, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react';
import { rpc } from '../core/client';
import type { Settings } from '../core/schemas';
import type { Model } from '../features/providers';
import { errorMessage, providerNames, providerOrigins, type BootData, type Notify, type ProviderId } from './types';
interface Props { boot: BootData; saveSettings: (settings: Settings) => Promise<void>; reload: () => Promise<void>; notify: Notify }
const terms = { gemini: 'https://ai.google.dev/gemini-api/terms', groq: 'https://console.groq.com/docs/your-data' };
export function SettingsView({ boot, saveSettings, reload, notify }: Props) {
  const [settings, setSettings] = useState(boot.settings);
  const [key, setKey] = useState('');
  const [persist, setPersist] = useState(false);
  const [busy, setBusy] = useState('');
  const [models, setModels] = useState<Partial<Record<ProviderId, Model[]>>>({});
  const [status, setStatus] = useState<Partial<Record<ProviderId, string>>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setSettings(boot.settings); }, [boot.settings]);
  const provider = settings.provider;
  const hasKey = boot.keys[provider];
  const patch = <K extends keyof Settings>(name: K, value: Settings[K]) => setSettings((s) => ({ ...s, [name]: value }));
  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name); setError('');
    try { await fn(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(''); }
  };
  const grantProvider = async () => {
    // This API call must be the first asynchronous operation of a direct user gesture.
    const allowed = await chrome.permissions.request({ origins: [providerOrigins[provider]] });
    if (!allowed) throw new Error('Provider access was not granted. No request was sent.');
  };
  const discover = (test: boolean) => {
    const permission = grantProvider();
    void run(test ? 'test' : 'discover', async () => {
      await permission;
      if (test) {
        const result = await rpc<{ message: string; models: Model[] }>('CONNECTION_TEST', { provider });
        setModels((m) => ({ ...m, [provider]: result.models })); setStatus((s) => ({ ...s, [provider]: result.message })); notify(result.message);
      } else {
        const result = await rpc<Model[]>('MODELS_LIST', { provider });
        setModels((m) => ({ ...m, [provider]: result })); setStatus((s) => ({ ...s, [provider]: `${result.length} models discovered. Choose one below.` }));
      }
    });
  };
  const saveKey = () => void run('key', async () => {
    if (!key.trim()) throw new Error('Enter your API key first.');
    await rpc('KEY_SET', { provider, key: key.trim(), persist }); setKey(''); setPersist(false); setStatus((s) => ({ ...s, [provider]: 'Key saved. Test the connection to verify it.' })); await reload(); notify('API key saved. Its value is never returned to the panel.');
  });
  const removeKey = () => void run('remove', async () => { await rpc('KEY_REMOVE', { provider }); await reload(); setStatus((s) => ({ ...s, [provider]: 'API key removed.' })); setModels((m) => ({ ...m, [provider]: [] })); notify('API key removed.'); });
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await saveSettings(settings); notify('Preferences saved.'); }
    catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  };
  const clearAll = () => {
    if (!window.confirm('Delete all local Vistara data, including conversations, settings, and API keys? This cannot be undone.')) return;
    void run('clear', async () => { await rpc('DATA_CLEAR'); await reload(); setKey(''); setModels({}); setStatus({}); notify('All local Vistara data cleared.'); });
  };
  return <section className="settings-view page-view"><div className="page-heading"><div className="eyebrow">YOUR WORKSPACE</div><h1>Make yourself at home.</h1><p>Your models, your preferences, your choice.</p></div>
    <form onSubmit={(e) => void save(e)}>
      <section className="settings-section"><div className="section-heading"><span className="section-icon"><KeyRound size={17}/></span><div><h2>AI provider</h2><p>Bring your own key. No Vistara subscription.</p></div></div>
        <div className="provider-tabs" role="group" aria-label="AI provider">{(['gemini', 'groq'] as const).map((id) => <button type="button" key={id} disabled={!!busy} aria-pressed={provider === id} className={provider === id ? 'selected' : ''} onClick={() => { patch('provider', id); setKey(''); setPersist(false); setError(''); }}><span className={`provider-symbol ${id}`}>{id === 'gemini' ? '✦' : 'g'}</span>{providerNames[id]}{provider === id && <Check size={14}/>}</button>)}</div>
        <div className="key-status"><span className={`status-dot ${hasKey ? 'ready' : ''}`}/>{hasKey ? 'API key saved' : 'No API key saved'}<span>{status[provider] || 'Connection not tested in this panel session'}</span></div>
        <label className="field-label" htmlFor="api-key">{hasKey ? 'Replace API key' : 'Your API key'}</label><div className="key-field"><LockKeyhole size={15}/><input id="api-key" name="api-key" type="password" autoComplete="off" spellCheck={false} placeholder="Paste your own API key" value={key} onChange={(e) => setKey(e.target.value)} maxLength={1024}/></div>
        <label className="check-label"><input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)}/> Remember key on this device</label>
        <p className="field-help">Default: session-only, cleared when Chrome closes. Remembering stores the key locally in your browser, which is not a secure server vault. Anyone with access to your browser profile may access it.</p>
        <div className="button-row"><button type="button" className="secondary" onClick={saveKey} disabled={!!busy || !key.trim()}>{busy === 'key' ? <LoaderCircle size={14} className="spin"/> : <KeyRound size={14}/>} {hasKey ? 'Replace key' : 'Save key'}</button>{hasKey && <button type="button" className="text-button danger-text" onClick={removeKey} disabled={!!busy}><Trash2 size={13}/>Remove</button>}</div>
        <div className="button-row provider-actions"><button type="button" className="secondary" disabled={!hasKey || !!busy} onClick={() => discover(true)}>{busy === 'test' && <LoaderCircle size={13} className="spin"/>} Test connection</button><button type="button" className="secondary" disabled={!hasKey || !!busy} onClick={() => discover(false)}>{busy === 'discover' && <LoaderCircle size={13} className="spin"/>} Discover models</button></div>
        <label className="field-label" htmlFor="model">Model</label><select id="model" value={settings.models[provider]} onChange={(e) => patch('models', { ...settings.models, [provider]: e.target.value })}><option value="">Choose a model</option>{settings.models[provider] && !(models[provider] ?? []).some((m) => m.id === settings.models[provider]) && <option value={settings.models[provider]}>{settings.models[provider]} · saved selection</option>}{(models[provider] ?? []).filter((m) => m.capabilities.text).map((model) => <option key={model.id} value={model.id}>{model.name || model.id}</option>)}</select>
        <p className="field-help">Models are discovered from the provider. No model is selected automatically. Free-tier eligibility and limits can change; confirm availability with your provider. Remaining quota is not available here.</p>
      </section>
      <section className="settings-section consent-section"><div className="section-heading"><span className="section-icon"><ShieldCheck size={17}/></span><div><h2>Know what you share</h2><p>Your choice, before any AI request.</p></div></div><p>Messages and any page content you enable are processed by <strong>{providerNames[provider]}</strong>, an external cloud provider. This is not local AI processing.</p><p>Free-tier prompts may be used by the provider to improve its products, according to its current terms. No unlimited free usage is promised.</p><a className="terms-link" href={terms[provider]} target="_blank" rel="noreferrer noopener">Review provider terms and data practices <ExternalLink size={12}/></a><label className="check-label consent-check"><input type="checkbox" checked={settings.consent[provider]} onChange={(e) => patch('consent', { ...settings.consent, [provider]: e.target.checked })}/> I understand and consent to sending content to {providerNames[provider]}.</label><p className="field-help">Consent is saved separately for each provider. Page context starts off for each conversation. Save preferences to apply this choice.</p></section>
      <section className="settings-section"><div className="section-heading"><span className="section-icon"><SettingsIcon/></span><div><h2>Response preferences</h2><p>Keep requests bounded and predictable.</p></div></div><div className="field-grid"><label>Temperature<input type="number" step="0.1" min="0" max="2" value={settings.temperature} onChange={(e) => patch('temperature', Number(e.target.value))} required/></label><label>Max output tokens<input type="number" min="128" max="8192" step="128" value={settings.maxOutputTokens} onChange={(e) => patch('maxOutputTokens', Number(e.target.value))} required/></label><label>Timeout (seconds)<input type="number" min="5" max="120" value={settings.timeoutMs / 1000} onChange={(e) => patch('timeoutMs', Number(e.target.value) * 1000)} required/></label><label>Transient retries<input type="number" min="0" max="2" value={settings.retries} onChange={(e) => patch('retries', Number(e.target.value))} required/></label><label className="full-field">Page context budget (characters)<input type="number" min="1000" max="24000" step="1000" value={settings.contextBudget} onChange={(e) => patch('contextBudget', Number(e.target.value))} required/></label></div><p className="field-help">Rate-limit and quota errors stop immediately. Retries apply only to eligible transient failures. Model-specific limits still apply.</p></section>
      <section className="settings-section"><div className="section-heading"><span className="section-icon"><Sun size={17}/></span><div><h2>A space that feels like you</h2><p>A little easier on the eyes.</p></div></div><div className="theme-options" role="group" aria-label="Appearance theme">{([{ id: 'light', icon: Sun, label: 'Light' }, { id: 'dark', icon: Moon, label: 'Dark' }, { id: 'system', icon: Monitor, label: 'System' }] as const).map(({ id, icon: Icon, label }) => <button type="button" className={settings.theme === id ? 'selected' : ''} key={id} onClick={() => patch('theme', id)} aria-pressed={settings.theme === id}><Icon size={18}/>{label}</button>)}</div><label className="check-label"><input type="checkbox" checked={settings.compact} onChange={(e) => patch('compact', e.target.checked)}/> Compact spacing</label><label className="field-label" htmlFor="font-size">Font size · {settings.fontSize}px</label><input id="font-size" type="range" min="12" max="20" value={settings.fontSize} onChange={(e) => patch('fontSize', Number(e.target.value))}/></section>
      {error && <div className="error-card" role="alert"><strong>Couldn’t complete that</strong><p>{error}</p></div>}
      <div className="save-bar"><button className="primary" type="submit" disabled={saving || !!busy}>{saving ? <LoaderCircle size={15} className="spin"/> : <Check size={15}/>}Save preferences</button></div>
    </form>
    <section className="settings-section"><div className="section-heading"><span className="section-icon"><ShieldCheck size={17}/></span><div><h2>Privacy & local data</h2><p>Nothing syncs. You stay in control.</p></div></div><p className="field-help">Conversations are stored in this browser. There is no Vistara account, background browsing collection, or hidden telemetry. Website access is temporary through Chrome’s active-tab permission.</p><button className="secondary danger-text" onClick={clearAll} disabled={!!busy}><Trash2 size={14}/>Clear all local data</button></section>
    <div className="about-card"><span className="assistant-mark">v</span><div><strong>Vistara AI · 0.1.0</strong><p>Personal browser assistant · Foundation & page reader</p><p>Browser actions, workflows, scheduling, voice, and visual reasoning are not built in this version.</p></div></div>
  </section>;
}
function SettingsIcon() { return <ChevronRight size={17}/>; }
