import { z } from 'zod';
import { createProvider,ProviderError,type GenerateRequest,type Provider,type Model } from '../providers';
import { scope } from '../providers/transport';
import { checkedProfile,ProfileSchema,ProfileIdSchema,HubSchema,resolveHub,profileExport,type Profile,type Diagnostics,type Check } from './profiles';
import { getSettings,saveSettings,getKey,setKey,removeKey } from '../../core/storage';
import { publicError,redact } from '../../core/security';
const Input=ProfileSchema.omit({diagnostics:true});
const Key=z.string().trim().min(1).max(1024).optional();
import { profileBinding } from './capabilities';
import { keyRecord,restoreKeyRecord } from '../../core/storage';
export { profileBinding,agentProfileReady } from './capabilities';
import { agentProfileReady } from './capabilities';
const unknown=():Check=>({status:'unverified',message:'Not tested.',at:0});
export function emptyDiagnostics(binding:string):Diagnostics{return {binding,authentication:unknown(),models:unknown(),text:unknown(),stream:unknown(),tools:unknown(),usage:{requests:0,inputTokens:null,outputTokens:null}};}
export function requestOptions(profile:Profile){return {temperature:profile.temperature,maxOutputTokens:profile.maxOutputTokens,timeoutMs:profile.timeoutMs};}
export class HubManager{
 isBusy(){return this.running.size>0;}
 private diagnostics=new Map<string,Diagnostics>();private running=new Map<string,{abort:AbortController;provider:Provider}>();
 private async key(profile:Profile,draft?:string){const key=draft??await getKey(profile.id);if(!key)throw new ProviderError('auth_invalid');return key;}
 private async authorize(profile:Profile){if(!profile.consent)throw new Error('Read and accept the selected endpoint disclosure first. Your API key/prompts go to this configured provider.');if(!await chrome.permissions.contains({origins:[new URL(profile.baseUrl).origin+'/*']}))throw new ProviderError('permission_missing');}
 private async persist(hub:ReturnType<typeof resolveHub>){const settings=await getSettings();settings.hub=HubSchema.parse(hub);settings.provider=hub.chatDefault;for(const p of hub.profiles){settings.models[p.id]=p.model;settings.consent[p.id]=p.consent;}return saveSettings(settings);}
 async save(raw:unknown){
  const value=z.object({profile:Input,key:Key,persist:z.boolean().default(false),create:z.boolean().default(false)}).strict().parse(raw);const profile=checkedProfile(value.profile);const settings=await getSettings();const hub=resolveHub(settings);const existing=hub.profiles.find(p=>p.id===profile.id);if(value.create&&existing)throw new Error('That local profile ID already exists. Choose a unique ID.');
  const key=await this.key(profile,value.key);const binding=await profileBinding(profile,key);const cached=this.diagnostics.get(profile.id);const previous=existing?.diagnostics;
  profile.diagnostics=cached?.binding===binding?cached:previous?.binding===binding?previous:undefined;
  if(existing&&(existing.baseUrl!==profile.baseUrl||existing.protocol!==profile.protocol)){
   // A freshly checked draft's consent was explicit for its new endpoint; otherwise require fresh consent.
   if(cached?.binding!==binding)profile.consent=false;
  }
  if(existing)hub.profiles=hub.profiles.map(p=>p.id===profile.id?profile:p);else{if(hub.profiles.length>=40)throw new Error('Profile limit reached.');hub.profiles.push(profile);}
  HubSchema.parse(hub);const record=value.key!==undefined?await keyRecord(profile.id):undefined;
  try{if(value.key!==undefined)await setKey(profile.id,key,value.persist);await this.persist(hub);}catch(error){if(record)await restoreKeyRecord(profile.id,record);await saveSettings(settings);throw error;}return profile;
 }
 async delete(raw:unknown){const {id}=z.object({id:ProfileIdSchema}).strict().parse(raw);const settings=await getSettings();const hub=resolveHub(settings);if(id===hub.chatDefault||id===hub.tasksDefault)throw new Error('Choose another Chat and Tasks default before deleting this profile.');if(!hub.profiles.some(p=>p.id===id))throw new Error('Profile not found.');hub.profiles=hub.profiles.filter(p=>p.id!==id);await this.persist(hub);await removeKey(id);this.diagnostics.delete(id);return null;}
 async defaults(raw:unknown){const {id,target}=z.object({id:ProfileIdSchema,target:z.enum(['chat','tasks'])}).strict().parse(raw);const settings=await getSettings();const hub=resolveHub(settings);const profile=hub.profiles.find(p=>p.id===id);if(!profile)throw new Error('Profile not found.');if(target==='tasks'&&!await agentProfileReady(profile,await getKey(id)))throw new Error('Run successful text and no-op tool roundtrip diagnostics for this exact endpoint/model/key before choosing Tasks.');if(target==='chat')hub.chatDefault=id;else hub.tasksDefault=id;await this.persist(hub);return hub;}
 async invalidate(id:string){this.diagnostics.delete(id);const hub=resolveHub(await getSettings());const profile=hub.profiles.find(p=>p.id===id);if(profile){delete profile.diagnostics;await this.persist(hub);}}
 async export(){return {version:1,profiles:resolveHub(await getSettings()).profiles.map(profileExport)};}
 cancel(raw:unknown){const {id}=z.object({id:ProfileIdSchema}).strict().parse(raw);const active=this.running.get(id);active?.abort.abort();active?.provider.cancel();return null;}
 async diagnose(raw:unknown):Promise<{report:Diagnostics;models?:Model[]}>{
  const value=z.object({profile:Input,key:Key,stage:z.enum(['models','text','stream','tools'])}).strict().parse(raw);const profile=checkedProfile(value.profile);if(this.running.has(profile.id))throw new Error('A diagnostic is already running for this profile.');await this.authorize(profile);const key=await this.key(profile,value.key);const binding=await profileBinding(profile,key);
  const settings=await getSettings();const persisted=resolveHub(settings).profiles.find(p=>p.id===profile.id)?.diagnostics;
  const prior=this.diagnostics.get(profile.id)??persisted;const report=prior?.binding===binding?structuredClone(prior):emptyDiagnostics(binding);const provider=createProvider(profile.id,key,{profile});const abort=new AbortController();this.running.set(profile.id,{abort,provider});const guard=scope(profile.timeoutMs,abort.signal);
  let models:Model[]|undefined;
  const mark=(status:Check['status'],message:string,code?:string):Check=>({status,message,code,at:Date.now()});
  const usage=(result:{usage?:{inputTokens?:number;outputTokens?:number}})=>{report.usage.inputTokens=result.usage?.inputTokens??null;report.usage.outputTokens=result.usage?.outputTokens??null;};
  const input=(messages:GenerateRequest['messages']):GenerateRequest=>({model:profile.model,messages,temperature:profile.temperature,maxOutputTokens:128,timeoutMs:profile.timeoutMs,retries:0,signal:guard.signal});
  try{
   if(value.stage==='models')models=await provider.listModels(guard.signal);
   else{
    if(!profile.model)throw new ProviderError('model_unavailable');
    if(value.stage==='text'){report.usage.requests++;const result=await provider.testConnection(input([{role:'user',content:'Reply with a short plain-text greeting. This is a connection diagnostic; no browser data is supplied.'}]));if(!result.text.trim()||result.toolCalls?.length)throw new ProviderError('incompatible_capabilities');usage(result);}
    if(value.stage==='stream'){if(!profile.streaming)throw new ProviderError('unsupported_streaming');report.usage.requests++;let done=false,text='';for await(const event of provider.stream(input([{role:'user',content:'Reply briefly with a plain-text greeting. This tests streaming; no browser data is supplied.'}]))){if(event.type==='delta')text+=event.text;else{done=true;usage(event.result);if(event.result.toolCalls?.length)throw new ProviderError('incompatible_capabilities');}}if(!done||!text.trim())throw new ProviderError('stream_parser');}
    if(value.stage==='tools'){
     if(!profile.tools)throw new ProviderError('incompatible_capabilities');const nonce=crypto.randomUUID();const tool={name:'vistara_compatibility_probe',description:'A diagnostic-only no-op echo function. It never accesses a browser or website.',parameters:{type:'object',properties:{nonce:{type:'string'},value:{type:'string'}},required:['nonce','value'],additionalProperties:false}};
     const conversation:GenerateRequest['messages']=[{role:'user',content:`Call vistara_compatibility_probe exactly once with nonce ${nonce} and value ping. After receiving its result, answer with that nonce. No browser action or user data is involved.`}];
     report.usage.requests++;const first=await provider.generateWithTools({...input(conversation),tools:[tool]});
     const calls=first.toolCalls;if(calls?.length!==1||calls[0]?.name!==tool.name)throw new ProviderError('incompatible_capabilities');const call=calls[0];z.object({nonce:z.literal(nonce),value:z.literal('ping')}).strict().parse(call.arguments);
     conversation.push({role:'assistant',content:first.text,toolCalls:calls},{role:'tool',toolName:tool.name,toolCallId:call.id,content:JSON.stringify({ok:true,nonce,value:'ping'})});
     report.usage.requests++;const second=await provider.generateWithTools({...input(conversation),tools:[tool]});if(second.toolCalls?.length||!second.text.includes(nonce))throw new ProviderError('incompatible_capabilities');usage(second);
    }
   }
   report[value.stage]=mark('pass',value.stage==='models'?`Model listing succeeded (${models?.length??0}). Generation has not been inferred.`:value.stage==='tools'?'No-op function call and tool-result roundtrip passed. No browser action executed.':value.stage==='stream'?'Streaming text and terminal event passed.':'Minimal non-streaming text generation passed.');
   report.authentication=mark('pass','Authentication accepted for the tested request only.');
  }catch(error){const normalized=error instanceof z.ZodError?new ProviderError('incompatible_capabilities'):guard.error(error);const detail=publicError(normalized);report[value.stage]=mark(['incompatible_capabilities','unsupported_streaming'].includes(normalized.code)?'unsupported':'fail',redact(detail.message+' '+(detail.hint??''),[key]),normalized.code);if(['auth_invalid','forbidden','permission_missing'].includes(normalized.code))report.authentication=mark('fail',detail.message,normalized.code);}
  finally{guard.dispose();this.running.delete(profile.id);}
  this.diagnostics.set(profile.id,report);
  // Save diagnostics only for an already saved identical profile/key; never save draft endpoint/key implicitly.
  const latest=await getSettings();const hub=resolveHub(latest);const saved=hub.profiles.find(p=>p.id===profile.id);if(saved&&await profileBinding(saved,await getKey(saved.id))===binding){saved.diagnostics=report;await this.persist(hub);}
  return {report,models:models?JSON.parse(redact(JSON.stringify(models),[key])):undefined};
 }
}
