import { profileBinding } from '../features/provider-hub/capabilities';
import { HubManager } from '../features/provider-hub/manager';
import { resolveHub,selectedProfile,sameDestination } from '../features/provider-hub/profiles';
import { TaskManager } from '../features/automation/manager';
import { PayloadSchemas, type Request,type Conversation } from './schemas';
import { clearData,clearHistory,deleteConversation,getConversation,getKey,getSettings,listConversations,recoverInterrupted,getSecrets,removeKey,saveConversation,saveSettings,secureStorage,setKey } from './storage';
import { pageContext,permittedPage,publicError,redact,redactStream,safeUrl,SYSTEM_PROMPT } from './security';
import { createProvider,type GenerateRequest,type ProviderId } from '../features/providers';
import { PageSnapshotSchema,type PageSnapshot } from '../features/browser/types';
export const PROVIDER_ORIGINS={gemini:'https://generativelanguage.googleapis.com/*',groq:'https://api.groq.com/*'};
export class Controller {
 private hub=new HubManager();
 private profileBusy=false;
 private agent:TaskManager|undefined;
 agentPanelClosed(){this.agent?.panelClosed();}
 private tasks(){return this.agent??=new TaskManager();}
 private active=new Map<string,{abort:AbortController;conversationId:string}>();
 private ready:Promise<void>;
 private starting=false;
 private pendingStart:{id:string;abort:AbortController}|undefined;
 constructor(){this.ready=secureStorage().then(()=>recoverInterrupted());}
 private async provider(provider:ProviderId){
  const profile=resolveHub(await getSettings()).profiles.find(p=>p.id===provider);if(!profile)throw new Error('Provider profile not found.');
  if(!await chrome.permissions.contains({origins:[new URL(profile.baseUrl).origin+'/*']}))throw new Error('Grant access to this provider endpoint in Settings.');
  const key=await getKey(provider);if(!key)throw new Error('Add your API key in Settings.');return createProvider(provider,key,{profile});
 }
 async readPage():Promise<PageSnapshot>{
  const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
  if(!tab?.id||!tab.url||!permittedPage(tab.url))throw new Error('This page is restricted or unavailable. Open a normal HTTP/HTTPS page, then open Vistara from the toolbar. PDF viewers and Chrome pages are not supported.');
  const id=tab.id;
  await chrome.scripting.executeScript({target:{tabId:id},files:['reader.js']});
  const current=await chrome.tabs.get(id);if(current.url!==tab.url)throw new Error('The tab navigated. Read the page again.');
  const settings=await getSettings();
  let timer:ReturnType<typeof setTimeout>|undefined;
  let raw:any;
  try{raw=await Promise.race([chrome.tabs.sendMessage(id,{type:'READ_PAGE',budget:settings.contextBudget}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('The page reader timed out.')),10000);})]);}finally{if(timer)clearTimeout(timer);}
  if(!raw?.ok)throw new Error(raw?.error??'The page could not be read.');
  const snapshot=PageSnapshotSchema.parse(raw.snapshot);
  if(!permittedPage(snapshot.url))throw new Error('The page navigated to a restricted URL.');
  return snapshot;
 }
 async handle(request:Request):Promise<unknown>{
  await this.ready;
  if((this.profileBusy||this.hub.isBusy())&&!['PROFILE_CANCEL','PROFILE_EXPORT','BOOT','PING','AGENT_GET','PAGE_READ','AGENT_CONTROL','CHAT_STOP'].includes(request.type))throw new Error('Cancel or finish provider diagnostics before starting a task or changing settings/data.');
  if(!request.type.startsWith('AGENT_')&&['CHAT_START','SETTINGS_SAVE','KEY_SET','KEY_REMOVE','HISTORY_CLEAR','CONVERSATION_DELETE','DATA_CLEAR'].includes(request.type)&&this.agent?.isBusy())throw new Error('Stop the active browser task before changing chat/settings/history.');
  if(request.type.startsWith('PROFILE_')&&request.type!=='PROFILE_CANCEL'&&(this.active.size||this.starting||this.agent?.isBusy()))throw new Error('Stop the active response/task before changing or testing provider profiles.');
  if(['PROFILE_SAVE','PROFILE_DELETE','PROFILE_DEFAULT','PROFILE_DIAG'].includes(request.type)){
   this.profileBusy=true;
   try{switch(request.type){case 'PROFILE_SAVE':return await this.hub.save(request.payload);case 'PROFILE_DELETE':return await this.hub.delete(request.payload);case 'PROFILE_DEFAULT':return await this.hub.defaults(request.payload);case 'PROFILE_DIAG':return await this.hub.diagnose(request.payload);}}finally{this.profileBusy=false;}
  }
  switch(request.type){
   case 'PROFILE_CANCEL':return this.hub.cancel(request.payload);
   case 'PROFILE_EXPORT':return this.hub.export();
   case 'AGENT_GET':return this.tasks().get();
   case 'AGENT_START':if(this.active.size||this.starting)throw new Error('Stop the chat response before starting a browser task.');return this.tasks().start(request.payload);
   case 'AGENT_CONTROL':return this.tasks().control(request.payload);
   case 'PING':return {message:'Vistara is ready'};
   case 'BOOT':{const settings=await getSettings();return {settings,conversations:await listConversations(),keys:Object.fromEntries(await Promise.all(resolveHub(settings).profiles.map(async p=>[p.id,Boolean(await getKey(p.id))])))};}
   case 'SETTINGS_SAVE':{const {settings}=PayloadSchemas.SETTINGS_SAVE.parse(request.payload);if(this.active.size||this.starting)throw new Error('Stop the active response before changing settings.');settings.hub=(await getSettings()).hub;return saveSettings(settings);}
   case 'KEY_SET':{if(this.active.size||this.starting)throw new Error('Stop the active response before replacing a key.');const p=PayloadSchemas.KEY_SET.parse(request.payload);await setKey(p.provider,p.key,p.persist);await this.hub.invalidate(p.provider);return null;}
   case 'KEY_REMOVE':{const p=PayloadSchemas.KEY_REMOVE.parse(request.payload);this.pendingStart?.abort.abort();for(const a of this.active.values())a.abort.abort();await removeKey(p.provider);await this.hub.invalidate(p.provider);return null;}
   case 'MODELS_LIST':{const p=PayloadSchemas.MODELS_LIST.parse(request.payload);return (await this.provider(p.provider)).listModels();}
   case 'CONNECTION_TEST':{const p=PayloadSchemas.CONNECTION_TEST.parse(request.payload);const models=await (await this.provider(p.provider)).listModels();return {message:`Connected. ${models.length} text model(s) discovered. Generation and free-tier eligibility have not been verified.`,models};}
   case 'PAGE_READ':return this.readPage();
   case 'CHAT_START':{if(this.starting)throw new Error('A response is already starting.');this.starting=true;const abort=new AbortController();this.pendingStart={id:request.id,abort};try{return await this.start(request,abort);}finally{this.starting=false;this.pendingStart=undefined;}}
   case 'CHAT_STOP':{const p=PayloadSchemas.CHAT_STOP.parse(request.payload);this.active.get(p.requestId)?.abort.abort();if(this.pendingStart?.id===p.requestId)this.pendingStart.abort.abort();return null;}
   case 'CONVERSATION_DELETE':{const p=PayloadSchemas.CONVERSATION_DELETE.parse(request.payload);if(this.starting||[...this.active.values()].some(x=>x.conversationId===p.id))throw new Error('Stop this response before deleting its conversation.');await deleteConversation(p.id);return null;}
   case 'HISTORY_CLEAR':{if(this.active.size||this.starting)throw new Error('Stop the active response before clearing history.');await clearHistory();return null;}
   case 'DATA_CLEAR':{if(this.active.size||this.starting)throw new Error('Stop the active response before clearing data.');await clearData();this.agent?.clearLocalState();this.hub=new HubManager();return null;}
  }
 }
 private async emit(requestId:string,conversationId:string,event:unknown){try{await chrome.runtime.sendMessage({type:'CHAT_EVENT',requestId,conversationId,event});}catch{/* Panel may have closed. Durable history still records state. */}}
 private async start(request:Request,abort:AbortController){
  if(this.active.size)throw new Error('A response is already running. Stop it before starting another.');
  const check=()=>{if(abort.signal.aborted)throw new DOMException('Request stopped before generation.','AbortError');};
  check();const payload=PayloadSchemas.CHAT_START.parse(request.payload);const settings=await getSettings();check();const profile=selectedProfile(settings,'chat');const provider=profile.id;
  if(!profile.consent)throw new Error('Read the cloud-processing disclosure and consent to this provider in Settings first.');
  const model=profile.model;if(!model)throw new Error('Test the connection and choose a model in Settings first.');
  const adapter=await this.provider(provider);let snapshot:PageSnapshot|undefined;
  if(payload.includePage)snapshot=await this.readPage();check();
  const saved=payload.conversationId?await getConversation(payload.conversationId):undefined;
  if(saved&&!sameDestination(saved,profile))throw new Error('Start a new conversation to use another provider or endpoint. Existing content is not forwarded automatically.');
  const secrets=await getSecrets();
  check();const prompt=redact(payload.prompt,secrets);
  const conversation:Conversation=saved??{id:crypto.randomUUID(),title:prompt.slice(0,70),updatedAt:Date.now(),provider,model,messages:[],usage:{requests:0,inputTokens:null,outputTokens:null}};
  conversation.model=model;conversation.providerEndpoint=profile.baseUrl;
  const history=conversation.messages.filter(m=>m.status==='complete'||m.role==='user');
  let available=settings.contextBudget;const messages:GenerateRequest['messages']=[];
  for(const message of [...history].reverse()) {if(message.content.length>available)break;messages.unshift({role:message.role,content:message.content});available-=message.content.length;}
  // History is bounded independently; current page snapshot has a separate explicit character budget.
  messages.push({role:'user',content:prompt+(snapshot?pageContext(snapshot,settings.contextBudget):'')});
  const assistant={id:crypto.randomUUID(),role:'assistant' as const,content:'',sources:snapshot?[safeUrl(snapshot.url)]:[]};
  conversation.messages.push({id:crypto.randomUUID(),role:'user',content:prompt,status:'complete'},assistant);
  conversation.usage.requests+=1;conversation.updatedAt=Date.now();check();await saveConversation(conversation);check();
  this.active.set(request.id,{abort,conversationId:conversation.id});
  const input:GenerateRequest={model,messages,system:SYSTEM_PROMPT,temperature:profile.temperature,maxOutputTokens:profile.maxOutputTokens,timeoutMs:profile.timeoutMs,retries:settings.retries,signal:abort.signal};
  // Return the request ID before beginning asynchronous streamed messages.
  const verifiedFallback=Boolean(profile.options.fallbackNonStreaming&&profile.diagnostics?.text.status==='pass'&&profile.diagnostics.binding===await profileBinding(profile,await getKey(profile.id)));
  setTimeout(()=>{void this.runStream(adapter,input,conversation,assistant.id,request.id,secrets,profile.streaming,verifiedFallback);},25);
  return {requestId:request.id,conversationId:conversation.id};
 }
 private async runStream(adapter:ReturnType<typeof createProvider>,input:GenerateRequest,conversation:Conversation,assistantId:string,requestId:string,secrets:string[],streaming=true,fallback=false){
  const assistant=conversation.messages.find(m=>m.id===assistantId)!;let lastSave=0;let rawDraft='';
  try {
   const response=async function*(){if(!streaming){yield {type:'done' as const,result:await adapter.generate(input)};return;}let emitted=false;try{for await(const event of adapter.stream(input)){if(event.type==='delta')emitted=true;yield event;}}catch(error){const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';if(!emitted&&fallback&&['stream_parser','unsupported_streaming','incompatible_capabilities'].includes(code))yield {type:'done' as const,result:await adapter.generate(input)};else throw error;}};
   for await(const event of response()){
    if(input.signal?.aborted)throw new DOMException('Stopped','AbortError');
    if(event.type==='delta'){
     rawDraft+=event.text;assistant.content=redactStream(rawDraft,secrets);
     // Send a full sanitized draft so a credential split across deltas cannot leak.
     await this.emit(requestId,conversation.id,{type:'draft',text:assistant.content});
     if(Date.now()-lastSave>1000){await saveConversation(conversation);lastSave=Date.now();}
    }else{
     if(event.result.toolCalls?.length)throw new Error('The model requested an action. Browser actions are not built in this read-only milestone. Nothing was executed.');
     assistant.content=redactStream(event.result.text,secrets,true)||'The provider returned no text. Try a different request or model.';
     assistant.status='complete';
     const usage=event.result.usage;
     conversation.usage.inputTokens=usage?.inputTokens===undefined?null:conversation.usage.requests===1?usage.inputTokens:conversation.usage.inputTokens===null?null:conversation.usage.inputTokens+usage.inputTokens;
     conversation.usage.outputTokens=usage?.outputTokens===undefined?null:conversation.usage.requests===1?usage.outputTokens:conversation.usage.outputTokens===null?null:conversation.usage.outputTokens+usage.outputTokens;
     if(/MAX_TOKENS|length/i.test(event.result.finishReason??''))assistant.content+='\n\n[Response stopped at the model output limit; it may be incomplete.]';
    }
   }
   if(!assistant.status)assistant.status='interrupted';
   conversation.updatedAt=Date.now();await saveConversation(conversation);await this.emit(requestId,conversation.id,{type:'done',conversation});
  }catch(error){
   assistant.status=input.signal?.aborted?'cancelled':'interrupted';conversation.updatedAt=Date.now();
   const failure=publicError(error);
   try{await saveConversation(conversation);}catch{failure.message='The response could not be saved to local history.';failure.hint='Free browser storage or export existing history, then try a new request. The response was interrupted.';}
   await this.emit(requestId,conversation.id,{type:'error',...failure});
   await this.emit(requestId,conversation.id,{type:'done',conversation});
  }finally{this.active.delete(requestId);}
 }
}
