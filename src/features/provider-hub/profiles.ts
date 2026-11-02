import { z } from 'zod';
export const ProfileIdSchema=z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/);
export const KindSchema=z.enum(['gemini','groq','openai','openrouter','deepseek','together','fireworks','cerebras','mistral','anthropic','custom']);
export type ProviderKind=z.infer<typeof KindSchema>;
export const ProtocolSchema=z.enum(['gemini','anthropic','openai']);
export const CheckSchema=z.object({status:z.enum(['pass','fail','unsupported','unverified']),message:z.string().max(800),code:z.string().optional(),at:z.number()}).strict();
export type Check=z.infer<typeof CheckSchema>;
export const DiagnosticsSchema=z.object({binding:z.string(),authentication:CheckSchema,models:CheckSchema,text:CheckSchema,stream:CheckSchema,tools:CheckSchema,usage:z.object({requests:z.number(),inputTokens:z.number().nullable(),outputTokens:z.number().nullable()})}).strict();
export type Diagnostics=z.infer<typeof DiagnosticsSchema>;
export const ProfileSchema=z.object({id:ProfileIdSchema,name:z.string().trim().min(1).max(80),kind:KindSchema,protocol:ProtocolSchema,baseUrl:z.string().max(2048),model:z.string().max(250),discover:z.boolean(),streaming:z.boolean(),tools:z.boolean(),temperatureEnabled:z.boolean(),temperature:z.number().min(0).max(2),timeoutMs:z.number().int().min(5000).max(120000),maxOutputTokens:z.number().int().min(128).max(8192),localHttp:z.boolean(),consent:z.boolean(),options:z.object({tokenParameter:z.enum(['max_tokens','max_completion_tokens']),streamUsage:z.boolean(),fallbackNonStreaming:z.boolean()}).strict(),diagnostics:DiagnosticsSchema.optional()}).strict();
export type Profile=z.infer<typeof ProfileSchema>;
export const HubSchema=z.object({version:z.literal(1),profiles:z.array(ProfileSchema).min(1).max(40),chatDefault:ProfileIdSchema,tasksDefault:ProfileIdSchema}).strict().superRefine((hub,ctx)=>{const ids=hub.profiles.map(p=>p.id);if(new Set(ids).size!==ids.length||!ids.includes(hub.chatDefault)||!ids.includes(hub.tasksDefault))ctx.addIssue({code:'custom',message:'Profiles require unique IDs and valid Chat/Tasks defaults.'});});
export type Hub=z.infer<typeof HubSchema>;
export interface CatalogEntry{kind:ProviderKind;name:string;protocol:Profile['protocol'];baseUrl:string;docs:string;tokenParameter:Profile['options']['tokenParameter']}
export const CATALOG:CatalogEntry[]=[
 {kind:'gemini',name:'Google Gemini',protocol:'gemini',baseUrl:'https://generativelanguage.googleapis.com/v1beta',docs:'https://ai.google.dev/api/generate-content',tokenParameter:'max_tokens'},
 {kind:'groq',name:'Groq',protocol:'openai',baseUrl:'https://api.groq.com/openai/v1',docs:'https://console.groq.com/docs/openai',tokenParameter:'max_completion_tokens'},
 {kind:'openai',name:'OpenAI',protocol:'openai',baseUrl:'https://api.openai.com/v1',docs:'https://developers.openai.com/api/reference/resources/chat',tokenParameter:'max_completion_tokens'},
 {kind:'openrouter',name:'OpenRouter',protocol:'openai',baseUrl:'https://openrouter.ai/api/v1',docs:'https://openrouter.ai/docs/api-reference/overview',tokenParameter:'max_tokens'},
 {kind:'deepseek',name:'DeepSeek',protocol:'openai',baseUrl:'https://api.deepseek.com',docs:'https://api-docs.deepseek.com/',tokenParameter:'max_tokens'},
 {kind:'together',name:'Together AI',protocol:'openai',baseUrl:'https://api.together.ai/v1',docs:'https://docs.together.ai/docs/openai-api-compatibility',tokenParameter:'max_tokens'},
 {kind:'fireworks',name:'Fireworks AI',protocol:'openai',baseUrl:'https://api.fireworks.ai/inference/v1',docs:'https://docs.fireworks.ai/tools-sdks/openai-compatibility',tokenParameter:'max_tokens'},
 {kind:'cerebras',name:'Cerebras',protocol:'openai',baseUrl:'https://api.cerebras.ai/v1',docs:'https://inference-docs.cerebras.ai/resources/openai',tokenParameter:'max_completion_tokens'},
 {kind:'mistral',name:'Mistral',protocol:'openai',baseUrl:'https://api.mistral.ai/v1',docs:'https://docs.mistral.ai/api',tokenParameter:'max_tokens'},
 {kind:'anthropic',name:'Anthropic Claude',protocol:'anthropic',baseUrl:'https://api.anthropic.com/v1',docs:'https://platform.claude.com/docs/en/api/messages/create',tokenParameter:'max_tokens'},
 {kind:'custom',name:'Custom OpenAI-Compatible',protocol:'openai',baseUrl:'https://api.example.com/v1',docs:'',tokenParameter:'max_tokens'}
];
export function validateEndpoint(raw:string,localHttp=false):string{
 if(raw!==raw.trim()||/[\\\s]/.test(raw))throw new Error('Endpoint must be a clean absolute API base URL.');
 let u:URL;try{u=new URL(raw);}catch{throw new Error('Enter a valid absolute API base URL.');}
 if(u.username||u.password||u.search||u.hash)throw new Error('Endpoint credentials, query parameters and fragments are not allowed.');
 const loopback=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
 if(u.protocol!=='https:'&&!(u.protocol==='http:'&&loopback&&localHttp))throw new Error('HTTPS required. HTTP is allowed only for explicitly approved loopback development.');
 if(/\/(?:chat\/completions|messages|models)\/?$|:(?:generateContent|streamGenerateContent)$/.test(u.pathname))throw new Error('Use the API base URL, not a model/chat/messages endpoint.');
 return u.href.replace(/\/+$/,'');
}
export function checkedProfile(raw:unknown):Profile{
 const p=ProfileSchema.parse(raw);const entry=CATALOG.find(x=>x.kind===p.kind)!;
 if(entry.protocol!==p.protocol)throw new Error('Provider kind does not match its native protocol.');
 p.baseUrl=validateEndpoint(p.baseUrl,p.localHttp);
 if(p.model&&!/^[a-zA-Z0-9._/:-]+$/.test(p.model))throw new Error('Model ID must be the exact provider identifier (no spaces or URLs).');
 return p;
}
export function newProfile(kind:ProviderKind,id:string):Profile{const c=CATALOG.find(x=>x.kind===kind)!;return {id,name:c.name,kind,protocol:c.protocol,baseUrl:c.baseUrl,model:'',discover:true,streaming:true,tools:true,temperatureEnabled:true,temperature:0.3,timeoutMs:45000,maxOutputTokens:2048,localHttp:false,consent:false,options:{tokenParameter:c.tokenParameter,streamUsage:kind==='groq'||kind==='openai',fallbackNonStreaming:false}};}
export interface LegacySettings{provider:string;models:Record<string,string>;consent:Record<string,boolean>;temperature:number;maxOutputTokens:number;timeoutMs:number;hub?:Hub}
export function resolveHub(settings:LegacySettings):Hub{
 if(settings.hub)return HubSchema.parse(settings.hub);
 const profiles=(['gemini','groq'] as const).map(kind=>({...newProfile(kind,kind),model:settings.models[kind]??'',consent:settings.consent[kind]??false,temperature:settings.temperature,maxOutputTokens:settings.maxOutputTokens,timeoutMs:settings.timeoutMs}));
 return {version:1,profiles,chatDefault:settings.provider==='groq'?'groq':'gemini',tasksDefault:'gemini'};
}
export function selectedProfile(settings:LegacySettings,target:'chat'|'tasks'):Profile{const hub=resolveHub(settings);const id=target==='chat'?hub.chatDefault:hub.tasksDefault;return checkedProfile(hub.profiles.find(p=>p.id===id)!);}
export function profileIdentity(p:Profile):string{const {diagnostics:_diagnostics,name:_name,consent:_consent,...config}=checkedProfile(p);return JSON.stringify(config);}
export function readiness(p:Profile):string{const d=p.diagnostics;if(d?.authentication.status==='fail'&&d.authentication.code==='auth_invalid')return 'Authentication Failed';const checks=d?[d.authentication,d.models,d.text,d.stream,d.tools]:[];if(checks.some(c=>c.code==='temporarily_unavailable'))return 'Temporarily Unavailable';if(checks.some(c=>c.code==='quota_exhausted'))return 'Quota Exhausted';if(d?.text.status==='pass'&&d.tools.status==='pass'&&p.tools)return 'Ready for Agent';if(d?.text.status==='pass')return !p.tools||['fail','unsupported'].includes(d.tools.status)?'Chat Only':'Ready for Chat';return 'Unverified';}
export function profileExport(p:Profile){const {diagnostics:_diagnostics,...clean}=p;return {...clean,consent:false};}

export function sameDestination(conversation:{provider:string;providerEndpoint?:string},profile:Profile):boolean{const legacy=['gemini','groq'].includes(conversation.provider)?CATALOG.find(c=>c.kind===conversation.provider)?.baseUrl:undefined;return conversation.provider===profile.id&&(conversation.providerEndpoint??legacy)===profile.baseUrl;}
