import * as z from 'zod';

/** Machine code (snake_case reason/message/notice identifiers) */
export const MachineCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, 'Machine codes must be snake_case')
  .brand('MachineCode');

/** Product ID (unique per panel payload) */
export const ProductIdSchema = z.string();

/** Section ID (references sections[]) */
export const SectionIdSchema = z.string();

export type MachineCode = z.infer<typeof MachineCodeSchema>;
export type ProductId = z.infer<typeof ProductIdSchema>;
export type SectionId = z.infer<typeof SectionIdSchema>;
