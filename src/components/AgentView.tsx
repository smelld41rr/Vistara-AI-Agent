import { useEffect,useState } from 'react';
import { Play,Pause,Square,ShieldCheck,Globe2,LoaderCircle } from 'lucide-react';
import type { Settings } from '../core/schemas';
import { selectedProfile } from '../features/provider-hub/profiles';
import { rpc } from '../core/client';
import { TaskSchema,terminal,type AgentTask } from '../features/automation/task-types';
import { errorMessage } from './types';
export function AgentView({settings}:{settings:Settings}){
 const profile=selectedProfile(settings,'tasks');
 const [task,setTask]=useState<AgentTask|null>(null);const [goal,setGoal]=useState('');const [share,setShare]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const refresh=async()=>{try{const raw=await rpc('AGENT_GET');setTask(raw?TaskSchema.parse(raw):null);}catch(e){setError(errorMessage(e));}};
 useEffect(()=>{const port=chrome.runtime.connect?.({name:'vistara-agent'});void refresh();const timer=setInterval(()=>void refresh(),700);return ()=>{clearInterval(timer);port?.disconnect();};},[]);
 const control=async(action:'pause'|'resume'|'stop'|'approve'|'reject'|'grant')=>{if(!task)return;setBusy(true);setError('');try{setTask(TaskSchema.parse(await rpc('AGENT_CONTROL',{id:task.id,action})));}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 const grant=()=>{
  if(!task?.pendingOrigin)return;
  // Direct click gesture. Never ask for broad wildcard access from model output.
  let origin:string;try{const u=new URL(task.pendingOrigin);if(!['http:','https:'].includes(u.protocol)||u.origin!==task.pendingOrigin)throw new Error();origin=u.origin;}catch{setError('Invalid site permission request.');return;}
  const request=chrome.permissions.request({origins:[origin+'/*']});setBusy(true);
  void request.then(allowed=>{if(!allowed)throw new Error('Site access denied. Task remains paused.');return control('grant');}).catch(e=>setError(errorMessage(e))).finally(()=>setBusy(false));
 };
 const start=async()=>{setBusy(true);setError('');try{setTask(TaskSchema.parse(await rpc('AGENT_START',{goal,sharePage:share})));setShare(false);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 return <section className="page-view agent-view"><div className="page-heading"><div className="eyebrow">REAL BROWSER TOOLS · M2</div><h1>Give your browser a goal.</h1><p>Watch every action. Approve consequential steps. Stay in control.</p></div>
 <p className="field-help">Tasks provider: {profile.name} · {profile.model||'No model selected'}. A successful text and safe tool roundtrip is required.</p>
 <label className="field-label" htmlFor="agent-goal">Your goal</label><textarea id="agent-goal" className="agent-goal" rows={4} maxLength={16000} value={goal} onChange={e=>setGoal(e.target.value)} disabled={Boolean(task&&!terminal(task.state))} placeholder={'Find a search field and type "test query" without submitting.'}/>
 <label className="check-label"><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)} disabled={Boolean(task&&!terminal(task.state))}/>I authorize this task and sharing relevant page/control observations with the selected Tasks provider/model.</label>
 <p className="field-help">Separate from Chat page context. No passwords, OTPs, tokens or payment data. Enter exact text to type in your goal. Sites require per-task access; field edits and ambiguous/sensitive actions ask for fresh confirmation.</p>
 <button className="primary" disabled={busy||!share||!goal.trim()||Boolean(task&&!terminal(task.state))} onClick={()=>void start()}><Play size={15}/>Start task</button>
 {error&&<div className="error-card" role="alert">{error}</div>}
 {task&&<section className="task-detail" aria-label="Current browser task"><div className="section-heading"><ShieldCheck size={18}/><h2>{task.state.replaceAll('_',' ')}</h2></div><p><strong>Goal:</strong> {task.goal}</p><p className="task-site"><Globe2 size={14}/>{task.site} · tab {task.tabId}</p><p><strong>Current action:</strong> {task.activeAction||'None'}</p><p>{task.step} recorded actions · step limit {task.maxSteps} · {task.requests} AI requests</p>
 <div className="button-row"><button className="secondary" disabled={busy||task.state!=='running'} onClick={()=>void control('pause')}><Pause size={14}/>Pause</button><button className="secondary" disabled={busy||task.state!=='paused'} onClick={()=>void control('resume')}><Play size={14}/>Resume</button><button className="secondary danger-text" disabled={terminal(task.state)} onClick={()=>void control('stop')}><Square size={14}/>Stop now</button></div>
 {task.pendingOrigin&&<div className="approval-card" role="status"><h3>Website permission required</h3><p>{task.pendingOrigin}</p><p>Allow Vistara to read and act on this site for this task? Chrome's host grant may remain until revoked in extension settings. Other tabs stay outside this task.</p><button className="primary" disabled={busy} onClick={grant}>{busy?<LoaderCircle size={14} className="spin"/>:<ShieldCheck size={14}/>}Grant this site</button><button className="text-button" onClick={()=>void control('stop')}>Decline and stop</button></div>}
 {task.pendingApproval&&<div className="approval-card" role="alert"><h3>Review this exact action</h3><p>{task.pendingApproval.reason}</p><p><strong>Website:</strong> {task.pendingApproval.site}</p><p><strong>Target:</strong> {task.pendingApproval.target}</p><pre>{task.pendingApproval.data}</pre><div className="button-row"><button className="primary" disabled={busy} onClick={()=>void control('approve')}>Approve once</button><button className="secondary" disabled={busy} onClick={()=>void control('reject')}>Reject and stop</button></div></div>}
 {task.error&&<p role="alert" className="error-card">{task.error}</p>}{task.result&&<p className="task-result" role="status">{task.result}</p>}
 <h3>Execution history</h3>{!task.trace.length?<p className="muted">No browser action recorded yet.</p>:<ol className="task-trace">{task.trace.map((entry,index)=><li key={index}><strong>{entry.step}. {entry.call.name}</strong><span className="status-pill">{entry.result.status}</span><p>{entry.result.summary}</p>{entry.result.error&&<p className="danger-text">{entry.result.error}</p>}<details><summary>Arguments and observable evidence</summary><pre>{JSON.stringify(entry.call.arguments,null,2)}</pre><pre>{entry.result.evidence||'No additional evidence.'}</pre></details></li>)}</ol>}
 </section>}
 <p className="field-help">Stop prevents further tool dispatch; an operation already sent to a website cannot be undone. Restarted tasks are marked interrupted and never replay automatically. A model report is not proof of server-side completion.</p></section>;
}
