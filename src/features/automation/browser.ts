import { z } from 'zod';
import { parsedCall,ResultSchema,ElementInfoSchema,type Call,type Result } from './contracts';
import { PageSnapshotSchema } from '../browser/types';
import { permittedPage,redact,safeUrl } from '../../core/security';
export const ObservationSchema=z.object({page:PageSnapshotSchema,elements:z.array(ElementInfoSchema).max(50),last:ResultSchema}).strict();
export type Observation=z.infer<typeof ObservationSchema>;
export function originPattern(url:string){if(!permittedPage(url))throw new Error('restricted_url: Only ordinary HTTP/HTTPS websites are allowed.');return new URL(url).origin+'/*';}
export class SitePermissionNeeded extends Error{constructor(readonly origin:string){super('Site access needs approval: '+origin);}}
export class BrowserEngine {
 actionAttempted=false;
 private history=new Map<number,string[]>();
 readonly tabs=new Set<number>();readonly origins=new Set<string>();private last:Result={status:'unverified',summary:'No browser action yet.'};
 constructor(public tabId:number,private signal:AbortSignal,private goal:string,history:{tabId:number;urls:string[]}[]=[]){this.tabs.add(tabId);for(const item of history)if(item.tabId===tabId)this.history.set(tabId,item.urls.slice(-30));}
 historyEntries(){return [...this.history].filter(([id])=>this.tabs.has(id)).map(([tabId,urls])=>({tabId,urls:urls.slice(-30)}));}
 async allow(origin:string){const pattern=originPattern(origin);if(!await chrome.permissions.contains({origins:[pattern]}))throw new Error('permission_denied');this.origins.add(new URL(origin).origin);}
 private cancelled(){if(this.signal.aborted)throw new DOMException('Task stopped.','AbortError');}
 private async permit(url:string){this.cancelled();const pattern=originPattern(url);const origin=new URL(url).origin;if(!this.origins.has(origin)||!await chrome.permissions.contains({origins:[pattern]}))throw new SitePermissionNeeded(origin);}
 async current(){this.cancelled();if(!this.tabs.has(this.tabId))throw new Error('tab_out_of_scope');const tab=await chrome.tabs.get(this.tabId);if(!tab.url)throw new Error('tab_unavailable');await this.permit(tab.url);if(this.history.get(this.tabId)?.at(-1)!==tab.url)this.history.set(this.tabId,[tab.url]);return tab;}
 private async send(message:unknown):Promise<any>{
  const tab=await this.current();
  await chrome.scripting.executeScript({target:{tabId:this.tabId},files:['actions.js']});this.cancelled();
  const check=await chrome.tabs.get(this.tabId);if(check.url!==tab.url)throw new Error('stale_page: Navigation occurred. Observe again.');
  let timer:ReturnType<typeof setTimeout>|undefined;let rejectAbort:()=>void=()=>{};const aborted=()=>{void chrome.tabs.sendMessage(this.tabId,{type:'AUTOMATION_CANCEL',id:'stop'}).catch(()=>{});};
  this.signal.addEventListener('abort',aborted,{once:true});
  try{return await Promise.race([chrome.tabs.sendMessage(this.tabId,message),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{aborted();reject(new Error('tool_timeout: Inspect the page before retrying.'));},12000);rejectAbort=()=>reject(new DOMException('Stopped','AbortError'));this.signal.addEventListener('abort',rejectAbort,{once:true});})]);}
  finally{if(timer)clearTimeout(timer);this.signal.removeEventListener('abort',aborted);this.signal.removeEventListener('abort',rejectAbort);}
 }
 async observe():Promise<Observation>{const result=await this.send({type:'AUTOMATION_OBSERVE'});if(!result?.ok)throw new Error('observation_failed');return ObservationSchema.parse(result.observation);}
 async stop(){await Promise.allSettled([...this.tabs].map(tabId=>chrome.tabs.sendMessage(tabId,{type:'AUTOMATION_CANCEL',id:'stop'})));}
 private navigationCard(call:Call,url:string){return {fingerprint:JSON.stringify({call,url,tabId:this.tabId}),site:new URL(url).origin,target:url,data:'Navigate to '+redact(url),reason:/delete|remove|pay|purchase|checkout|logout|settings/i.test(url)?'Potentially consequential destination. Confirm this exact action; it may change or delete account data.':'Confirm the exact destination. Approval does not grant unrelated website access.'};}
 private async navigate(call:Call,url:string,approval?:string):Promise<Result>{
  url=new URL(url).href;if(redact(url)!==url)throw new Error('credential_refused: Sensitive values in navigation URLs are not allowed.');await this.permit(url);const card=this.navigationCard(call,url);if(approval!==card.fingerprint)return {status:'approval_required',summary:'Review destination before navigation.',approval:card};
  this.cancelled();this.actionAttempted=true;
  if(call.name==='open_tab'){
   if(this.tabs.size>=8)throw new Error('tab_limit: Maximum 8 task tabs.');
   const tab=await chrome.tabs.create({url,active:true});if(!tab.id)throw new Error('tab_open_failed');this.tabs.add(tab.id);this.tabId=tab.id;
  }else await chrome.tabs.update(this.tabId,{url});
  return this.waitURL(url);
 }
 private async waitURL(expected:string,record=true):Promise<Result>{
  const until=Date.now()+10000;
  while(Date.now()<until){this.cancelled();const tab=await chrome.tabs.get(this.tabId);if(tab.url)await this.permit(tab.url);if(tab.status==='complete'&&tab.url){if(record){const h=this.history.get(this.tabId)??[];if(h.at(-1)!==tab.url)h.push(tab.url);this.history.set(this.tabId,h);}return {status:tab.url===expected?'verified':'unverified',summary:tab.url===expected?'Navigation URL and load state verified.':'Page redirected. Destination differs; observe before continuing.',evidence:JSON.stringify({expected:safeUrl(expected),actual:safeUrl(tab.url)})};}await new Promise(r=>setTimeout(r,100));}
  return {status:'unverified',summary:'Navigation dispatched but did not finish within timeout. No automatic retry.'};
 }
 async execute(raw:unknown,approval?:string):Promise<Result>{
  this.actionAttempted=false;const call=parsedCall(raw);const args=call.arguments as Record<string,any>;
  await this.current();this.cancelled();
  if(call.name==='open_url'||call.name==='open_tab')this.last=await this.navigate(call,args.url,approval);
  else if(call.name==='switch_tab'){
   if(!this.tabs.has(args.tabId))throw new Error('tab_out_of_scope: Only tabs opened/enrolled for this task are allowed.');
   const target=await chrome.tabs.get(args.tabId);if(!target.url)throw new Error('tab_unavailable');await this.permit(target.url);await chrome.tabs.update(args.tabId,{active:true});this.tabId=args.tabId;
   this.last={status:(await chrome.tabs.get(this.tabId)).active?'verified':'unverified',summary:'Task tab activation checked.',evidence:'Tab '+this.tabId};
  }else if(call.name==='go_back'){
   const tab=await this.current();const history=this.history.get(this.tabId)??[];const target=history.at(-2);if(!target)throw new Error('history_out_of_scope: No previous navigation recorded in this task.');await this.permit(target);
   const card={fingerprint:JSON.stringify({call,tabId:this.tabId,url:tab.url,target}),site:new URL(target).origin,target,data:'Go back to '+target,reason:'Confirm backward navigation to the previous task-recorded URL.'};
   if(approval!==card.fingerprint)return {status:'approval_required',summary:'Confirm history navigation.',approval:card};
   this.actionAttempted=true;await chrome.tabs.goBack(this.tabId);this.last=await this.waitURL(target,false);if(this.last.status==='verified')history.pop();

  }else if(call.name==='verify_action'){
   const observation=await this.observe();this.last={status:'unverified',summary:'Current page observed with historical action evidence. Independent final-goal completion is not established.',evidence:JSON.stringify({last:this.last,page:observation.page,elements:observation.elements}).slice(0,12000)};
  }else{
   if(call.name==='type_text'&&(/^(?:\d[ -]?){4,8}$/.test(args.text)||/\b(?:\d[ -]?){13,19}\b/.test(args.text)||redact(args.text)!==args.text))throw new Error('credential_refused: Sensitive-looking text must be handled manually.');
   if(call.name==='type_text'&&args.text&&!this.goal.includes(args.text))throw new Error('scope_violation: Field text must be supplied verbatim in the user goal.');
   this.actionAttempted=true;const response=await this.send({type:'AUTOMATION_CALL',call,...(approval?{approval}:{})});this.cancelled();
   if(response?.link){const url=z.string().url().parse(response.link);this.last=await this.navigate(call,url,approval);}
   else {if(!response?.ok)throw new Error('content_action_failed');this.last=ResultSchema.parse(response.result);if(this.last.status==='approval_required'||/stale_element|credential_refused|unsupported_|option_not_found|read_only_field|element_disabled|element_not_visible/.test(this.last.error??''))this.actionAttempted=false;}
   // A script may have navigated synchronously after a click/edit. Recheck scope; do not inspect a new unapproved site.
   const after=await chrome.tabs.get(this.tabId);if(after.url){await this.permit(after.url);const h=this.history.get(this.tabId)??[];if(h.at(-1)!==after.url)h.push(after.url);this.history.set(this.tabId,h);}
   await this.current();
  }
  return ResultSchema.parse(this.last);
 }
}
