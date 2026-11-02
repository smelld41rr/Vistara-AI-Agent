import { RequestSchema,ResponseSchema } from './schemas';
export async function rpc<T=unknown>(type:string,payload?:unknown):Promise<T>{
 if(typeof chrome==='undefined'||!chrome.runtime?.id) throw new Error('Open Vistara from the Chrome extension toolbar.');
 const request=RequestSchema.parse({id:crypto.randomUUID(),type,payload});
 let timer:ReturnType<typeof setTimeout>|undefined;
 try {
 const raw=await Promise.race([chrome.runtime.sendMessage(request),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('The extension did not respond. Try reloading it.')),125000);})]);
 const response=ResponseSchema.parse(raw);
 if(response.id!==request.id)throw new Error('Response ID mismatch.');
 if(!response.ok)throw Object.assign(new Error(response.error.message),response.error);
 return response.data as T;
 }finally{if(timer)clearTimeout(timer);}
}
