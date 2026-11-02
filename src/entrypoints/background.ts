import { defineBackground } from 'wxt/utils/define-background';
import { RequestSchema } from '../core/schemas';
import { publicError } from '../core/security';
import { Controller } from '../core/controller';
import { isTrustedUI } from '../core/messaging';
export default defineBackground(()=>{
 const controller=new Controller();
 chrome.runtime.onMessage.addListener((raw,sender,respond)=>{
  // Only packaged extension UIs may call privileged RPC, never web content scripts.
  if(!isTrustedUI(sender,chrome.runtime.id,chrome.runtime.getURL(''))) return;
  const parsed=RequestSchema.safeParse(raw);if(!parsed.success)return;
  const request=parsed.data;
  void controller.handle(request).then(data=>respond({id:request.id,ok:true,data})).catch(error=>respond({id:request.id,ok:false,error:publicError(error)}));
  return true;
 });
});
