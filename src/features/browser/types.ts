import { z } from 'zod';

export const PageSnapshotSchema = z.object({
  url: z.string().max(2048),
  title: z.string().max(300),
  text: z.string().max(24000),
  headings: z.array(z.object({ level: z.number().int().min(1).max(6), text: z.string().max(200) }).strict()).max(60),
  links: z.array(z.object({ text: z.string().max(160), url: z.string().max(2048) }).strict()).max(80),
  forms: z.array(z.object({
    name: z.string().max(100),
    fields: z.array(z.object({ label: z.string().max(100), type: z.string().max(30), required: z.boolean() }).strict()).max(30),
  }).strict()).max(10),
  selectedText: z.string().max(4000),
  truncated: z.boolean(),
  warnings: z.array(z.string().max(300)).max(12),
}).strict();

export type PageSnapshot = z.infer<typeof PageSnapshotSchema>;
export const ReadPageMessageSchema = z.object({ type: z.literal('READ_PAGE'), budget: z.number().int().min(256).max(24000).optional() }).strict();
