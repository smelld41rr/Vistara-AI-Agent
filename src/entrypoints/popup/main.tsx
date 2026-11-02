import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Brand } from '../../components/ui/Brand';
import '../../styles/app.css';
function Popup() {
  const [error, setError] = useState('');
  const [windowId, setWindowId] = useState<number>();
  useEffect(() => { void chrome.windows.getCurrent().then((win) => setWindowId(win.id)).catch(() => setError('Could not identify the browser window.')); }, []);
  const open = () => {
    // Call synchronously during the button gesture; the window was resolved on mount.
    if (windowId === undefined) return;
    void chrome.sidePanel.open({ windowId }).then(() => window.close()).catch(() => setError('Chrome could not open the panel. Right-click the Vistara toolbar icon and choose Open side panel, or try again.'));
  };
  return <main className="popup"><Brand/><div className="eyebrow">YOUR BROWSER, WITH CLARITY</div><h1>A thoughtful assistant,<br/>right beside your work.</h1><p>Read a page, untangle an idea, or start a conversation with your chosen AI.</p><button className="primary" disabled={windowId === undefined} onClick={open}>Open Vistara AI <ArrowUpRight size={17}/></button>{error && <p role="alert" className="error-text">{error}</p>}<div className="popup-foot"><ShieldCheck size={14}/> Your key. Your choice. No subscription.</div></main>;
}
const root = document.getElementById('root'); if (root) createRoot(root).render(<Popup/>);
