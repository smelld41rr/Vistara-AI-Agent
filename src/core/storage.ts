import { ConversationSchema,SettingsSchema,type Conversation,type ProviderId,type Settings } from './schemas';
import { resolveHub } from '../features/provider-hub/profiles';
import { redact } from './security';
export async function secureStorage(){
 await Promise.all([chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'}),chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'})]);
}
export async function getSettings():Promise<Settings>{
 const raw=(await chrome.storage.local.get('settings')).settings;
 const parsed=SettingsSchema.safeParse(raw??{});if(!parsed.success)throw new Error('Saved settings could not be validated. Existing data was preserved; do not reset it silently.');
 const settings=parsed.data;if(!settings.hub){settings.hub=resolveHub(settings);await chrome.storage.local.set({settings});}return settings;
}
export async function saveSettings(settings:Settings){const valid=SettingsSchema.parse(settings);await chrome.storage.local.set({settings:valid});return valid;}
export async function keyRecord(provider:ProviderId){const name='key:'+provider;return {session:(await chrome.storage.session.get(name))[name],local:(await chrome.storage.local.get(name))[name]};}
export async function restoreKeyRecord(provider:ProviderId,record:{session:unknown;local:unknown}){const name='key:'+provider;await Promise.all([record.session===undefined?chrome.storage.session.remove(name):chrome.storage.session.set({[name]:record.session}),record.local===undefined?chrome.storage.local.remove(name):chrome.storage.local.set({[name]:record.local})]);}
export async function setKey(provider:ProviderId,key:string,persist=false){
 const name='key:'+provider;const before=await keyRecord(provider);
 try{await (persist?chrome.storage.local:chrome.storage.session).set({[name]:key});await (persist?chrome.storage.session:chrome.storage.local).remove(name);}
 catch{await restoreKeyRecord(provider,before);throw new Error('Could not update the key. Previous storage was restored.');}
}
export async function getSecrets():Promise<string[]>{const areas=await Promise.all([chrome.storage.local.get(null),chrome.storage.session.get(null)]);return areas.flatMap(area=>Object.entries(area).filter(([name,value])=>name.startsWith('key:')&&typeof value==='string').map(([,value])=>String(value))).filter(Boolean);}
export async function getKey(provider:ProviderId):Promise<string>{const name='key:'+provider;const session=(await chrome.storage.session.get(name))[name];const local=(await chrome.storage.local.get(name))[name];return typeof session==='string'?session:typeof local==='string'?local:'';}
export async function removeKey(provider:ProviderId){await Promise.all([chrome.storage.local.remove('key:'+provider),chrome.storage.session.remove('key:'+provider)]);}
let dbPromise:Promise<IDBDatabase>|undefined;
function db(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('vistara-ai',1);req.onupgradeneeded=()=>req.result.createObjectStore('conversations',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>{dbPromise=undefined;reject(new Error('Local history storage could not be opened.'));};});
 return dbPromise;
}
async function transaction<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction('conversations',mode);const req=action(tx.objectStore('conversations'));let result:T;req.onsuccess=()=>{result=req.result;};req.onerror=()=>reject(new Error('Local history operation failed.'));tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(new Error('Local history could not be saved.'));tx.onabort=()=>reject(new Error('Local history write was interrupted.'));});
}
export async function saveConversation(conversation:Conversation){
 const secrets=await getSecrets();
 const valid=ConversationSchema.parse(JSON.parse(redact(JSON.stringify(conversation),secrets)));
 await transaction('readwrite',s=>s.put(valid));return valid;
}
export async function listConversations():Promise<Conversation[]>{
 const raw=await transaction('readonly',s=>s.getAll());return raw.map(x=>ConversationSchema.safeParse(x)).filter(x=>x.success).map(x=>x.data as Conversation).sort((a,b)=>b.updatedAt-a.updatedAt);
}
export async function getConversation(id:string):Promise<Conversation|undefined>{const raw=await transaction('readonly',s=>s.get(id));return raw?ConversationSchema.parse(raw):undefined;}
export async function deleteConversation(id:string){await transaction('readwrite',s=>s.delete(id));}
export async function clearHistory(){await transaction('readwrite',s=>s.clear());}
export async function clearData(){await clearHistory();await Promise.all([chrome.storage.local.clear(),chrome.storage.session.clear()]);}
export async function recoverInterrupted(){for(const c of await listConversations())if(c.messages.some(m=>m.role==='assistant'&&!m.status)){c.messages=c.messages.map(m=>m.role==='assistant'&&!m.status?{...m,status:'interrupted',content:m.content||'Interrupted when the background worker stopped. Send a new message to continue.'}:m);await saveConversation(c);}}
