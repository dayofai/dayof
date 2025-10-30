import * as z from 'zod';
import { MachineCodeSchema } from './primitives';

export const OrderRulesSchema = z
  .object({
    types: z.enum(['single', 'multiple']),
    typesPerOrder: z.enum(['single', 'multiple']),
    ticketsPerType: z.enum(['single', 'multiple']),
    minSelectedTypes: z.number().int().nonnegative(),
    minTicketsPerSelectedType: z.number().int().nonnegative(),
  })
  .strict();

export const GatingSummarySchema = z
  .object({
    hasHiddenGatedItems: z.boolean(),
    hasAccessCode: z.boolean().optional(),
  })
  .strict();

export const NoticeActionSchema = z
  .object({
    label: z.string().min(1),
    kind: z.enum(['link', 'drawer']),
    target: z.string().optional(),
  })
  .strict();

export const NoticeSchema = z
  .object({
    code: MachineCodeSchema,
    variant: z.enum(['neutral', 'info', 'warning', 'error']).default('neutral'),
    icon: z.string().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    description: z.string().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
    action: NoticeActionSchema.optional(),
    priority: z.number().default(0),
    expiresAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export const CopyTemplateSchema = z
  .object({
    key: MachineCodeSchema,
    template: z.string().min(1),
    locale: z.string().optional(),
  })
  .strict()
  .readonly();

export const ClientCopySchema = z
  .object({
    selection_min_reached: z.string().optional(),
    selection_max_types: z.string().optional(),
    quantity_min_reached: z.string().optional(),
    quantity_max_reached: z.string().optional(),
    addon_requires_parent: z.string().optional(),
    panel_action_button_cta: z.string().optional(),
    panel_action_button_cta_plural: z.string().optional(),
    welcome_default: z.string().optional(),
    welcome_waitlist: z.string().optional(),
    welcome_notify_me: z.string().optional(),
  })
  .strict();

export const TooltipSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
  })
  .strict()
  .readonly();

export const HoverCardSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().optional(),
    body: z.string().min(1),
    action: NoticeActionSchema.optional(),
  })
  .strict()
  .readonly();

export const EffectivePrefsSchema = z
  .object({
    showTypeListWhenSoldOut: z.boolean(),
    displayPaymentPlanAvailable: z.boolean(),
    displayRemainingThreshold: z.number().int().positive().optional(),
  })
  .strict();

export const PrimaryCTASchema = z
  .object({
    label: z.string().min(1),
    action: z.enum(['checkout', 'waitlist', 'notify_me', 'disabled']),
    enabled: z.boolean(),
  })
  .strict();

export const ContextSchema = z
  .object({
    orderRules: OrderRulesSchema,
    gatingSummary: GatingSummarySchema.optional(),
    panelNotices: z.array(NoticeSchema).default([]),
    effectivePrefs: EffectivePrefsSchema,
    welcomeText: z.string().optional(),
    primaryCTA: PrimaryCTASchema.optional(),
    copyTemplates: z.array(CopyTemplateSchema).optional(),
    clientCopy: ClientCopySchema.optional(),
    tooltips: z.array(TooltipSchema).optional(),
    hovercards: z.array(HoverCardSchema).optional(),
  })
  .strict();

export type OrderRules = z.infer<typeof OrderRulesSchema>;
export type GatingSummary = z.infer<typeof GatingSummarySchema>;
export type Notice = z.infer<typeof NoticeSchema>;
export type NoticeAction = z.infer<typeof NoticeActionSchema>;
export type CopyTemplate = z.infer<typeof CopyTemplateSchema>;
export type ClientCopy = z.infer<typeof ClientCopySchema>;
export type Tooltip = z.infer<typeof TooltipSchema>;
export type HoverCard = z.infer<typeof HoverCardSchema>;
export type EffectivePrefs = z.infer<typeof EffectivePrefsSchema>;
export type PrimaryCTA = z.infer<typeof PrimaryCTASchema>;
export type Context = z.infer<typeof ContextSchema>;
