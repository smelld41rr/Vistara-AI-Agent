import { z } from 'zod';
import { ApprovalSchema,CallSchema,ResultSchema } from './contracts';
export const TaskStateSchema=z.enum(['running','paused','waiting_for_permission','waiting_for_approval','completed','stopped','failed','interrupted']);
export const TaskSchema=z.object({id:z.string(),goal:z.string().max(16000),state:TaskStateSchema,tabId:z.number(),site:z.string(),step:z.number(),maxSteps:z.number(),requests:z.number(),activeAction:z.string(),result:z.string(),error:z.string().optional(),pendingOrigin:z.string().optional(),pendingApproval:ApprovalSchema.optional(),navigationHistory:z.array(z.object({tabId:z.number(),urls:z.array(z.string().max(2048)).max(30)})).max(8).optional(),trace:z.array(z.object({step:z.number(),call:CallSchema,result:ResultSchema,time:z.number()})).max(100),startedAt:z.number(),updatedAt:z.number()}).strict();
export type AgentTask=z.infer<typeof TaskSchema>;
export const AgentStartSchema=z.object({goal:z.string().trim().min(1).max(16000),sharePage:z.literal(true)}).strict();
export const AgentControlSchema=z.object({id:z.string(),action:z.enum(['pause','resume','stop','approve','reject','grant'])}).strict();
export function terminal(state:AgentTask['state']){return ['completed','stopped','failed','interrupted'].includes(state);}
