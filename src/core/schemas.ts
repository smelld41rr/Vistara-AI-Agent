import { z } from 'zod';
import { HubSchema,ProfileIdSchema } from '../features/provider-hub/profiles';
export const ProviderIdSchema=ProfileIdSchema;
export type ProviderId=z.infer<typeof ProviderIdSchema>;
export const SettingsSchema=z.object({
 provider:ProviderIdSchema.default('gemini'),models:z.record(ProfileIdSchema,z.string().max(250)).default({gemini:'',groq:''}),
 consent:z.record(ProfileIdSchema,z.boolean()).default({gemini:false,groq:false}),
 theme:z.enum(['light','dark','system']).default('system'),compact:z.boolean().default(false),fontSize:z.number().int().min(12).max(20).default(14),
 temperature:z.number().min(0).max(2).default(0.3),maxOutputTokens:z.number().int().min(128).max(8192).default(2048),
 timeoutMs:z.number().int().min(5000).max(120000).default(45000),retries:z.number().int().min(0).max(2).default(0),
 contextBudget:z.number().int().min(1000).max(24000).default(12000),maxSteps:z.number().int().min(1).max(30).default(12),hub:HubSchema.optional()
}).strict();
export type Settings=z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS:Settings=SettingsSchema.parse({});
export const MessageSchema=z.object({id:z.string(),role:z.enum(['user','assistant']),content:z.string().max(200000),status:z.enum(['complete','interrupted','cancelled']).optional(),sources:z.array(z.string()).optional()});
export type Message=z.infer<typeof MessageSchema>;
export const ConversationSchema=z.object({id:z.string(),title:z.string(),updatedAt:z.number(),messages:z.array(MessageSchema),usage:z.object({requests:z.number(),inputTokens:z.number().nullable(),outputTokens:z.number().nullable()}),provider:ProviderIdSchema,providerEndpoint:z.string().optional(),model:z.string()});
export type Conversation=z.infer<typeof ConversationSchema>;
export const RequestSchema=z.object({id:z.string().min(1).max(100),type:z.enum(['PING','BOOT','SETTINGS_SAVE','KEY_SET','KEY_REMOVE','MODELS_LIST','CONNECTION_TEST','PAGE_READ','CHAT_START','CHAT_STOP','CONVERSATION_DELETE','HISTORY_CLEAR','DATA_CLEAR','AGENT_GET','AGENT_START','AGENT_CONTROL','PROFILE_SAVE','PROFILE_DELETE','PROFILE_DEFAULT','PROFILE_DIAG','PROFILE_EXPORT','PROFILE_CANCEL']),payload:z.unknown().optional()}).strict();
export type Request=z.infer<typeof RequestSchema>;
export const PayloadSchemas={
 SETTINGS_SAVE:z.object({settings:SettingsSchema}).strict(),
 KEY_SET:z.object({provider:ProviderIdSchema,key:z.string().trim().min(8).max(1024),persist:z.boolean()}).strict(),
 KEY_REMOVE:z.object({provider:ProviderIdSchema}).strict(),
 MODELS_LIST:z.object({provider:ProviderIdSchema}).strict(),
 CONNECTION_TEST:z.object({provider:ProviderIdSchema}).strict(),
 CHAT_START:z.object({conversationId:z.string().max(100).optional(),prompt:z.string().trim().min(1).max(16000),includePage:z.boolean()}).strict(),
 CHAT_STOP:z.object({requestId:z.string().max(100)}).strict(),
 CONVERSATION_DELETE:z.object({id:z.string().max(100)}).strict()
};
export const ResponseSchema=z.discriminatedUnion('ok',[
 z.object({id:z.string(),ok:z.literal(true),data:z.unknown()}),
 z.object({id:z.string(),ok:z.literal(false),error:z.object({code:z.string(),message:z.string(),hint:z.string().optional()})})
]);
