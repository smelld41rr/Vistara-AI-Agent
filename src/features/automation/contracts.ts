import { z } from 'zod';
const empty=z.object({}).strict();
const element=z.object({elementId:z.string().min(1).max(100)}).strict();
export const inputs={
 open_url:z.object({url:z.string().url().max(2048)}).strict(),
 open_tab:z.object({url:z.string().url().max(2048)}).strict(),
 switch_tab:z.object({tabId:z.number().int().positive()}).strict(),
 find_element:z.object({query:z.string().trim().min(1).max(160),role:z.enum(['button','link','textbox','combobox','checkbox','any']).default('any')}).strict(),
 click_element:element,
 type_text:element.extend({text:z.string().max(4000)}).strict(),
 scroll_page:z.object({x:z.number().int().min(-3000).max(3000).default(0),y:z.number().int().min(-3000).max(3000).default(0)}).strict(),
 select_option:element.extend({value:z.string().max(200)}).strict(),
 go_back:empty,
 wait_for_element:z.object({query:z.string().trim().min(1).max(160),timeoutMs:z.number().int().min(100).max(10000).default(5000)}).strict(),
 verify_action:z.object({}).strict()
};
export type ToolName=keyof typeof inputs;
export const ToolNameSchema=z.enum(Object.keys(inputs) as [ToolName,...ToolName[]]);
export const CallSchema=z.object({name:ToolNameSchema,arguments:z.record(z.string(),z.unknown())}).strict().superRefine((v,ctx)=>{if(!inputs[v.name].safeParse(v.arguments).success)ctx.addIssue({code:'custom',message:'Invalid tool arguments'});});
export type Call=z.infer<typeof CallSchema>;
export const ElementInfoSchema=z.object({id:z.string(),role:z.string(),label:z.string(),tag:z.string(),sensitive:z.boolean()}).strict();
export const ApprovalSchema=z.object({fingerprint:z.string().max(20000),site:z.string(),target:z.string(),data:z.string().max(8000),reason:z.string()}).strict();
export type Approval=z.infer<typeof ApprovalSchema>;
export const ResultSchema=z.object({status:z.enum(['verified','unverified','failed','approval_required']),summary:z.string().max(1000),error:z.string().optional(),elements:z.array(ElementInfoSchema).max(50).optional(),approval:ApprovalSchema.optional(),evidence:z.string().max(12000).optional()}).strict();
export type Result=z.infer<typeof ResultSchema>;
export const DOMRequestSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('AUTOMATION_OBSERVE')}).strict(),
 z.object({type:z.literal('AUTOMATION_CALL'),call:CallSchema,approval:z.string().max(20000).optional()}).strict(),
 z.object({type:z.literal('AUTOMATION_CANCEL'),id:z.string()}).strict()
]);
export const descriptions:Record<ToolName,string>={open_url:'Navigate the current task tab to a user-approved URL. New sites require UI permission.',open_tab:'Open an approved URL in a new task-owned tab.',switch_tab:'Switch only to an already task-scoped tab ID.',find_element:'Find visible semantic controls by accessible name/text. Returns temporary IDs; never invent IDs.',click_element:'Click a freshly observed element ID. Sensitive or ambiguous actions require explicit UI approval.',type_text:'Replace editable input text. Credentials/payment/OTP are refused. Use user-supplied text only.',scroll_page:'Scroll the page by bounded x/y pixels; reports actual change.',select_option:'Select an exact value in a native HTML select element.',go_back:'Go back in current task tab after scoped destination validation.',wait_for_element:'Wait bounded time for a visible semantic name; no arbitrary CSS or code.',verify_action:'Read current page/control state and the last observable action evidence. Does not claim server-side completion.'};
export function definitions(){return (Object.keys(inputs) as ToolName[]).map(name=>{const schema=z.toJSONSchema(inputs[name]) as Record<string,unknown>;delete schema.$schema;return {name,description:descriptions[name],parameters:schema};});}
export function parsedCall(raw:unknown):Call {const call=CallSchema.parse(raw);return {name:call.name,arguments:inputs[call.name].parse(call.arguments)};}
