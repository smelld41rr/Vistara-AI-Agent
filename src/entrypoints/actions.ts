import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { DOMTools } from '../features/automation/dom';
import { DOMRequestSchema } from '../features/automation/contracts';
declare global { var __vistaraActions:DOMTools|undefined; }
export default defineUnlistedScript(()=>{
 if(globalThis.__vistaraActions)return;
 const tools=new DOMTools(document);globalThis.__vistaraActions=tools;
 chrome.runtime.onMessage.addListener((raw,sender,reply)=>{
  if(sender.id!==chrome.runtime.id||!sender.url?.startsWith(chrome.runtime.getURL('')))return false;
  const parsed=DOMRequestSchema.safeParse(raw);if(!parsed.success)return false;
  if(parsed.data.type==='AUTOMATION_CANCEL'){tools.cancel();reply({ok:true});return false;}
  if(parsed.data.type==='AUTOMATION_OBSERVE'){try{reply({ok:true,observation:tools.observe()});}catch{reply({ok:false,error:'Page observation failed.'});}return false;}
  const message=parsed.data;
  try{
   if(message.call.name==='click_element'){const url=tools.link(String(message.call.arguments.elementId));if(url){reply({ok:true,link:url});return false;}}
  }catch{reply({ok:true,result:{status:'failed',summary:'Element expired.',error:'stale_element'}});return false;}
  void tools.perform(message.call,message.approval).then(result=>reply({ok:true,result})).catch(()=>reply({ok:false,error:'Action failed.'}));
  return true;
 });
});
