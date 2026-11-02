import type { ZodType } from 'zod';
import type { Profile } from '../provider-hub/profiles';
import type { GenerateRequest,GenerateResult,Model,Provider,StreamEvent } from './types';
import { ProviderError } from './errors';
export abstract class ProviderBase implements Provider{
 abstract readonly id:string;abstract readonly displayName:string;
 private root=new AbortController();
 constructor(protected profile:Profile){}
 protected requestSignal(parent?:AbortSignal){return parent?AbortSignal.any([parent,this.root.signal]):this.root.signal;}
 abstract listModels(signal?:AbortSignal):Promise<Model[]>;
 abstract generate(input:GenerateRequest):Promise<GenerateResult>;
 abstract stream(input:GenerateRequest):AsyncGenerator<StreamEvent>;
 abstract generateStructured<T>(input:GenerateRequest,schema:ZodType<T>):Promise<{data:T;result:GenerateResult}>;
 async testConnection(input:GenerateRequest){return this.generate(input);}
 async generateWithTools(input:GenerateRequest){if(!this.profile.tools||!input.tools?.length)throw new ProviderError('incompatible_capabilities');return this.generate(input);}
 cancel(){this.root.abort();this.root=new AbortController();}
 getCapabilities():Model['capabilities']{return {text:true,streaming:this.profile.streaming,tools:this.profile.tools?(this.profile.diagnostics?.tools.status==='pass'?true:'unknown'):false,structured:'unknown',images:'unknown'};}
}
