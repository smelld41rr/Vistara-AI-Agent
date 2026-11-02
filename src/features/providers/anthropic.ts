import { validateRequest } from './validation';
import { z,type ZodType } from 'zod';
import { ProviderBase } from './base';
import type { Profile } from '../provider-hub/profiles';
import type { GenerateRequest,GenerateResult,Model,ProviderMessage,StreamEvent,ToolCall } from './types';
import { ProviderError,normalizeProviderError } from './errors';
import { scope,request,readJSON,readSSE } from './transport';
const record=z.record(z.string(),z.unknown());
const responseSchema=z.object({content:z.array(z.object({type:z.string(),text:z.string().optional(),id:z.string().optional(),name:z.string().optional(),input:record.optional()}).passthrough()),stop_reason:z.string().nullable().optional(),usage:z.object({input_tokens:z.number().optional(),output_tokens:z.number().optional()}).optional()});
function parse<T>(schema:ZodType<T>,raw:unknown):T{const value=schema.safeParse(raw);if(!value.success)throw new ProviderError('invalid_request');return value.data;}
function messages(input:ProviderMessage[]){const result:{role:'user'|'assistant';content:any[]}[]=[];let previousTool=false;
 for(const message of input){if(message.role==='tool'){const block={type:'tool_result',tool_use_id:message.toolCallId,content:message.content};if(previousTool)result.at(-1)!.content.push(block);else result.push({role:'user',content:[block]});previousTool=true;continue;}
  previousTool=false;const content:any[]=[];if(message.content)content.push({type:'text',text:message.content});for(const call of message.toolCalls??[])content.push({type:'tool_use',id:call.id,name:call.name,input:call.arguments});result.push({role:message.role==='assistant'?'assistant':'user',content});
 }return result;
}
export class AnthropicProvider extends ProviderBase{
 readonly id:string;readonly displayName:string;
 constructor(profile:Profile,private key:string,private fetcher:typeof fetch){super(profile);this.id=profile.id;this.displayName=profile.name;}
 private headers(){return {'content-type':'application/json','x-api-key':this.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};}
 private body(input:GenerateRequest,stream:boolean){validateRequest(input);return {model:input.model,messages:messages(input.messages),system:input.system,max_tokens:input.maxOutputTokens,...(this.profile.temperatureEnabled?{temperature:input.temperature}:{}),stream,...(input.tools?.length?{tools:input.tools.map(tool=>({name:tool.name,description:tool.description,input_schema:tool.parameters}))}:{})};}
 async listModels(signal?:AbortSignal):Promise<Model[]>{
  if(!this.profile.discover)throw new ProviderError('incompatible_capabilities');const guard=scope(this.profile.timeoutMs,this.requestSignal(signal));
  try{const result:Model[]=[];let after='';for(let page=0;page<20;page++){
   const r=await request(this.fetcher,this.profile.baseUrl+'/models?limit=100'+(after?'&after_id='+encodeURIComponent(after):''),{headers:this.headers()},guard.signal);const data=parse(z.object({data:z.array(z.object({id:z.string(),display_name:z.string().optional()})),has_more:z.boolean().optional(),last_id:z.string().optional()}),await readJSON(r));
   result.push(...data.data.map(m=>({id:m.id,name:m.display_name??m.id,capabilities:{text:true,streaming:true,tools:'unknown' as const,structured:'unknown' as const,images:'unknown' as const},freeTier:'unknown' as const})));
   if(!data.has_more)return result;if(!data.last_id||data.last_id===after)throw new ProviderError('invalid_request');after=data.last_id;
  }throw new ProviderError('invalid_request');}catch(error){throw guard.error(error);}finally{guard.dispose();}
 }
 private result(raw:unknown):GenerateResult{const r=parse(responseSchema,raw);if(r.stop_reason==='refusal')throw new ProviderError('content_blocked');const calls:ToolCall[]=[];for(const c of r.content)if(c.type==='tool_use'){if(!c.id||!c.name||!c.input)throw new ProviderError('invalid_request');calls.push({id:c.id,name:c.name,arguments:c.input});}return {text:r.content.filter(c=>c.type==='text').map(c=>c.text??'').join(''),toolCalls:calls.length?calls:undefined,usage:r.usage?{inputTokens:r.usage.input_tokens,outputTokens:r.usage.output_tokens}:undefined,finishReason:r.stop_reason??undefined};}
 async generate(input:GenerateRequest){const guard=scope(input.timeoutMs,this.requestSignal(input.signal));try{const r=await request(this.fetcher,this.profile.baseUrl+'/messages',{method:'POST',headers:this.headers(),body:JSON.stringify(this.body(input,false))},guard.signal,input.retries);return this.result(await readJSON(r));}catch(error){throw guard.error(error);}finally{guard.dispose();}}
 async *stream(input:GenerateRequest):AsyncGenerator<StreamEvent>{
  if(!this.profile.streaming)throw new ProviderError('unsupported_streaming');const guard=scope(input.timeoutMs,this.requestSignal(input.signal));let text='',finishReason:string|undefined,ended=false;const usage:{inputTokens?:number;outputTokens?:number}={};const calls=new Map<number,{id:string;name:string;input:Record<string,unknown>;json:string}>();
  try{const r=await request(this.fetcher,this.profile.baseUrl+'/messages',{method:'POST',headers:this.headers(),body:JSON.stringify(this.body(input,true))},guard.signal,input.retries);
   for await(const raw of readSSE(r,guard.signal)){
    const e=parse(z.object({type:z.string()}).passthrough(),raw) as any;
    if(e.type==='error')throw normalizeProviderError(/overload/i.test(e.error?.type??'')?529:/rate_limit/.test(e.error?.type??'')?429:500,JSON.stringify(e.error??{}));
    if(e.type==='message_start'&&e.message?.usage)usage.inputTokens=z.number().parse(e.message.usage.input_tokens);
    if(e.type==='content_block_start'&&e.content_block?.type==='tool_use'){if(calls.size>=16)throw new ProviderError('stream_parser');calls.set(z.number().int().parse(e.index),{id:z.string().parse(e.content_block.id),name:z.string().parse(e.content_block.name),input:record.parse(e.content_block.input??{}),json:''});}
    if(e.type==='content_block_delta'){
     if(e.delta?.type==='text_delta'){const delta=z.string().parse(e.delta.text);text+=delta;if(text.length>500000)throw new ProviderError('stream_parser');yield {type:'delta',text:delta};}
     if(e.delta?.type==='input_json_delta'){const call=calls.get(e.index);if(!call)throw new ProviderError('stream_parser');call.json+=z.string().parse(e.delta.partial_json);if(call.json.length>100000)throw new ProviderError('stream_parser');}
    }
    if(e.type==='message_delta'){if(e.delta?.stop_reason)finishReason=z.string().parse(e.delta.stop_reason);if(e.usage?.output_tokens!==undefined)usage.outputTokens=z.number().parse(e.usage.output_tokens);}
    if(e.type==='message_stop')ended=true;
   }
   if(!ended||!finishReason)throw new ProviderError('stream_parser');if(finishReason==='refusal')throw new ProviderError('content_blocked');const toolCalls=[...calls.values()].map(c=>{let args:unknown=c.input;try{if(c.json)args=JSON.parse(c.json);}catch{throw new ProviderError('stream_parser');}return {id:c.id,name:c.name,arguments:record.parse(args)};});
   yield {type:'done',result:{text,toolCalls:toolCalls.length?toolCalls:undefined,usage,finishReason}};
  }catch(error){if(error instanceof z.ZodError)throw new ProviderError('stream_parser');throw guard.error(error);}finally{guard.dispose();}
 }
 async generateStructured<T>(input:GenerateRequest,schema:ZodType<T>){const result=await this.generate({...input,system:(input.system??'')+'\nReturn only valid JSON matching the requested structure.'});let raw:unknown;try{raw=JSON.parse(result.text);}catch{throw new ProviderError('invalid_request');}return {data:parse(schema,raw),result};}
}
