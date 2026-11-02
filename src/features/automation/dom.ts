import { parsedCall,ResultSchema,type Call,type Result,type Approval } from './contracts';
import { readPage,sanitizePageText } from '../browser/reader';
const SENSITIVE=/username|user.?id|\bcard\b|password|passcode|\botp\b|one.time|token|secret|api.?key|credit|card.?number|cvv|cvc|cc-number|cc-csc|cc-exp|iban|routing|bank.?account/i;
const HIGH=/\b(submit|send|post|publish|delete|remove|erase|buy|purchase|pay|checkout|book|confirm|save|update|settings|upload|subscribe|sign.?out|log.?out|approve|transfer|cancel)\b/i;
const SELECTOR='button,a[href],input,textarea,select,[role="button"],[role="link"],[role="textbox"],[role="combobox"],[role="checkbox"],[contenteditable="true"]';
function textLabel(el:Element):string{
 const parts:string[]=[];const stack:Node[]=[el];let count=0;
 while(stack.length&&count++<300){const node=stack.pop()!;if(node.nodeType===3){parts.push(node.textContent??'');continue;}if(node.nodeType===1){const e=node as Element;if(/^(INPUT|TEXTAREA|SELECT|OPTION|SCRIPT|STYLE)$/.test(e.tagName)||e.hasAttribute('contenteditable')||!visible(e))continue;}for(let i=node.childNodes.length-1;i>=0;i--)stack.push(node.childNodes.item(i));}
 return parts.join(' ');
}
function label(el:Element):string{
 const labelled=el.getAttribute('aria-labelledby')?.split(/\s+/).map(id=>{const source=el.ownerDocument.getElementById(id);return source?textLabel(source):'';}).join(' ');
 const own=(el as HTMLInputElement).labels?.[0];const ownLabel=own?textLabel(own):'';
 return sanitizePageText(labelled||el.getAttribute('aria-label')||ownLabel||el.getAttribute('placeholder')||textLabel(el)||el.getAttribute('name')||'').slice(0,160);
}

function role(el:Element){if(el.hasAttribute('role'))return el.getAttribute('role')!;return el.tagName==='A'?'link':(el.tagName==='BUTTON'||el.tagName==='INPUT'&&['button','submit','reset'].includes((el as HTMLInputElement).type))?'button':el.tagName==='SELECT'?'combobox':(el as HTMLInputElement).type==='checkbox'?'checkbox':'textbox';}
export function sensitive(el:Element):boolean{
 const form=el.closest('form');
 const attributes=[el.getAttribute('type'),el.getAttribute('name'),el.id,el.getAttribute('autocomplete'),label(el)].join(' ');
 return SENSITIVE.test(attributes)||(el as HTMLInputElement).type==='file'||Boolean(form&&/log.?in|sign.?in|authentication|verification/i.test([form.id,form.getAttribute('aria-label'),form.getAttribute('action')].join(' ')));
}
function visible(el:Element){
 for(let parent:Element|null=el;parent;parent=parent.parentElement??(parent.getRootNode() as ShadowRoot).host??null){const css=el.ownerDocument.defaultView!.getComputedStyle(parent);if(parent.hasAttribute('hidden')||parent.getAttribute('aria-hidden')==='true'||parent.hasAttribute('inert')||css.display==='none'||css.visibility==='hidden'||css.opacity==='0')return false;}
 const rect=el.getBoundingClientRect();return rect.width>0&&rect.height>0&&rect.right>=0&&rect.bottom>=0;
}
function controls(doc:Document){const result:Element[]=[];const stack:Node[]=[doc];let count=0;while(stack.length&&count++<12000&&result.length<500){const node=stack.pop()!;if(node.nodeType===1){const el=node as Element;if(el.matches(SELECTOR)&&visible(el))result.push(el);if(el.shadowRoot)stack.push(el.shadowRoot);}for(let i=node.childNodes.length-1;i>=0;i--)stack.push(node.childNodes.item(i));}return result;}

function signature(el:Element){return JSON.stringify([el.tagName,role(el),label(el),el.getAttribute('href'),el.getAttribute('type'),el.getAttribute('name'),el.getAttribute('autocomplete'),el.getAttribute('formaction'),el.getAttribute('aria-disabled'),el.hasAttribute('disabled')]);}
function formData(el:Element):{data:string;blocked:boolean}{
 const form=el.closest('form');if(!form)return {data:'No enclosing form. Target: '+label(el),blocked:false};
 const rows:string[]=[];for(const node of form.querySelectorAll('input,textarea,select')){if((node as HTMLInputElement).type==='hidden'||!visible(node))continue;if(sensitive(node)){if((node as HTMLInputElement).value)return {data:'Sensitive form values require manual handling.',blocked:true};continue;}rows.push(label(node)+': '+sanitizePageText((node as HTMLInputElement).value??'').slice(0,500));if(rows.join('\n').length>6000)break;}
 return {data:rows.join('\n').slice(0,7000)||'Empty form',blocked:false};
}
export class DOMTools{
 private entries=new Map<string,{el:Element;signature:string;url:string}>();
 private last:Result={status:'unverified',summary:'No action has been observed yet.'};
 private cancellation=0;
 constructor(private doc:Document){}
 cancel(){this.cancellation++;}
 observe(){
  if(this.entries.size>1000)this.entries.clear();const nonce=crypto.randomUUID();
  const elements=controls(this.doc).slice(0,50).map((el,index)=>{const id=nonce+':'+index;this.entries.set(id,{el,signature:signature(el),url:this.doc.URL});return {id,role:role(el),label:label(el),tag:el.tagName.toLowerCase(),sensitive:sensitive(el)};});
  return {page:readPage(this.doc,6000),elements,last:this.last};
 }
 private find(query:string,filter='any'){
  const q=query.toLocaleLowerCase();const matches=controls(this.doc).filter(el=>(filter==='any'||role(el)===filter)&&label(el).toLocaleLowerCase().includes(q)).slice(0,50);
  return matches.map(el=>{const id=crypto.randomUUID();this.entries.set(id,{el,signature:signature(el),url:this.doc.URL});return {id,role:role(el),label:label(el),tag:el.tagName.toLowerCase(),sensitive:sensitive(el)};});
 }
 private resolve(id:string){const entry=this.entries.get(id);if(!entry||!entry.el.isConnected||entry.el.ownerDocument!==this.doc||entry.url!==this.doc.URL||signature(entry.el)!==entry.signature)throw new Error('stale_element: Observe the page and find the element again.');if(!visible(entry.el))throw new Error('element_not_visible');if((entry.el as HTMLInputElement).disabled||entry.el.getAttribute('aria-disabled')==='true')throw new Error('element_disabled');return entry.el;}
 private approval(el:Element,call:Call):Approval|undefined{
  if(sensitive(el))throw new Error('credential_refused: Credentials, payment, OTP, token and upload fields must be handled manually.');
  if(call.name==='type_text'||call.name==='select_option'){
   if(HIGH.test(label(el))||el.hasAttribute('onchange')||el.hasAttribute('oninput'))return this.card(el,call,'This field may trigger a consequential action.');
   // Client-side handlers can submit on input; approve edits as well rather than assuming they are inert.
   return this.card(el,call,'Review the exact field edit; web applications may act on input events.');
  }
  if(call.name==='click_element'){
   const type=(el.getAttribute('type')??(el.tagName==='BUTTON'&&el.closest('form')?'submit':'')).toLowerCase();
   if(type==='submit'||el.closest('form')||HIGH.test(label(el)+' '+el.getAttribute('href'))||el.tagName!=='A')return this.card(el,call,'Potentially sensitive or ambiguous click. Explicit confirmation required.');
  }
 }
 private card(el:Element,call:Call,reason:string):Approval{
  const data=formData(el);if(data.blocked)throw new Error('credential_refused: This form contains sensitive values. Complete it manually.');
  return {fingerprint:JSON.stringify([this.doc.URL,signature(el),call,data.data]),site:new URL(this.doc.URL).origin,target:label(el)||el.tagName,data:JSON.stringify(call.arguments)+'\n'+data.data,reason};
 }
 async perform(raw:unknown,approved?:string):Promise<Result>{
  try{
   const call=parsedCall(raw);const args=call.arguments as Record<string,any>;const generation=this.cancellation;
   if(call.name==='verify_action')return ResultSchema.parse({status:'unverified',summary:'Current page observed. Historical evidence is not proof of current goal completion.',evidence:JSON.stringify(this.observe()).slice(0,12000)});
   if(call.name==='find_element'){const elements=this.find(args.query,args.role);return ResultSchema.parse({status:elements.length?'verified':'failed',summary:`Found ${elements.length} matching element(s).`,elements,error:elements.length?undefined:'element_not_found'});}
   if(call.name==='wait_for_element'){
    const until=Date.now()+args.timeoutMs;
    while(Date.now()<until){if(generation!==this.cancellation)throw new Error('cancelled');const elements=this.find(args.query);if(elements.length)return ResultSchema.parse({status:'verified',summary:'Matching element appeared.',elements});await new Promise(r=>setTimeout(r,80));}
    throw new Error('timeout: Element did not appear before the wait limit.');
   }
   if(call.name==='scroll_page'){
    const win=this.doc.defaultView!;const before=[win.scrollX,win.scrollY];win.scrollBy({left:args.x,top:args.y,behavior:'instant'});await new Promise(r=>setTimeout(r,50));
    return this.record({status:before[0]!==win.scrollX||before[1]!==win.scrollY?'verified':'unverified',summary:'Scroll observed.',evidence:JSON.stringify({before,after:[win.scrollX,win.scrollY]})});
   }
   if(!['click_element','type_text','select_option'].includes(call.name))throw new Error('unsupported_dom_tool');
   const el=this.resolve(args.elementId);const approval=this.approval(el,call);
   if(approval&&approved!==approval.fingerprint)return ResultSchema.parse({status:'approval_required',summary:'Waiting for fresh user confirmation.',approval});
   if(generation!==this.cancellation)throw new Error('cancelled');
   const beforeURL=this.doc.URL;let changed=false;
   const reduced=this.doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   const feedback=!reduced?(el as HTMLElement).animate?.([{outline:'2px solid #157465'},{outline:'2px solid #157465'}],{duration:350}):undefined;
   const observer=new MutationObserver(()=>{changed=true;});observer.observe(this.doc.body,{subtree:true,childList:true,attributes:true,characterData:true});
   try{
    if(call.name==='click_element'){
     // All anchor navigation is intercepted by the scoped background URL tool, never delegated here.
     if(el.tagName==='A')throw new Error('navigation_required: Use the scoped URL tool for links.');
     (el as HTMLElement).click();
    }else if(call.name==='type_text'){
     if(!['INPUT','TEXTAREA'].includes(el.tagName)||!['text','search','email','url','tel','textarea',''].includes((el as HTMLInputElement).type))throw new Error('unsupported_editable: Only ordinary input/textarea fields supported.');
     const input=el as HTMLInputElement;if(input.readOnly)throw new Error('read_only_field');
     const proto=el.tagName==='TEXTAREA'?this.doc.defaultView!.HTMLTextAreaElement.prototype:this.doc.defaultView!.HTMLInputElement.prototype;
     Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(el,args.text);
     input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
    }else{
     if(el.tagName!=='SELECT')throw new Error('unsupported_dropdown: Only native HTML select controls supported.');
     const select=el as HTMLSelectElement;if(![...select.options].some(x=>x.value===args.value&&!x.disabled))throw new Error('option_not_found');
     select.value=args.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    await new Promise(r=>setTimeout(r,150));
   }finally{observer.disconnect();feedback?.cancel();}
   if(generation!==this.cancellation)return this.record({status:'unverified',summary:'Stop requested during action; inspect manually. Never retry automatically.'});
   if(call.name==='type_text')return this.record({status:(el as HTMLInputElement).value===args.text?'verified':'unverified',summary:'Field edit read back.',evidence:(el as HTMLInputElement).value===args.text?'Value matches requested text.':'Value did not match.'});
   if(call.name==='select_option')return this.record({status:(el as HTMLSelectElement).value===args.value?'verified':'unverified',summary:'Selected option read back.',evidence:'Selected value: '+sanitizePageText((el as HTMLSelectElement).value)});
   return this.record({status:changed||this.doc.URL!==beforeURL?'verified':'unverified',summary:'Click dispatched; observable page change checked. This does not prove server-side completion.',evidence:this.doc.URL!==beforeURL?'URL changed.':changed?'DOM mutation observed.':'No observable effect.'});
  }catch(error){return ResultSchema.parse({status:'failed',summary:'Action was not verified.',error:error instanceof Error?error.message:'Unknown browser action error.'});}
 }
 private record(result:Result){this.last=ResultSchema.parse(result);return this.last;}
 /** Resolve an anchor destination without clicking; background must recheck full URL and task scope. */
 link(id:string):string|undefined{const el=this.resolve(id);return el.tagName==='A'?(el as HTMLAnchorElement).href:undefined;}
}
