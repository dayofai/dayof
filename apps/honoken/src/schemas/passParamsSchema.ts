import { z } from "zod/v4";

// Regex for typical passTypeIdentifier format (e.g., pass.com.example.ticket)
// Allows: pass. + (letters, numbers, hyphen, dot) + . + (letters, numbers, hyphen, dot)
// This is a simplified regex; a stricter one might be needed depending on exact rules.
const passTypeIdentifierRegex = /^pass\.[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$/;

export const PassPathParamsSchema = z.object({
  deviceLibraryIdentifier: z.string().min(1, { error: "Device library identifier cannot be empty." }),
  passTypeIdentifier: z.string()
    .min(1, { error: "Pass type identifier cannot be empty." })
    .regex(passTypeIdentifierRegex, { error: "Invalid pass type identifier format (e.g., pass.com.example.event)." }),
  serialNumber: z.string().min(1, { error: "Serial number cannot be empty." })
});

export const PassIdParamsSchema = z.object({
  passTypeIdentifier: z.string()
    .min(1, { error: "Pass type identifier cannot be empty." })
    .regex(passTypeIdentifierRegex, { error: "Invalid pass type identifier format (e.g., pass.com.example.event)." }),
  serialNumber: z.string().min(1, { error: "Serial number cannot be empty." })
});

export const DevicePassRegistrationsParamsSchema = z.object({
  deviceLibraryIdentifier: z.string().min(1, { error: "Device library identifier cannot be empty." }),
  passTypeIdentifier: z.string()
    .min(1, { error: "Pass type identifier cannot be empty." })
    .regex(passTypeIdentifierRegex, { error: "Invalid pass type identifier format (e.g., pass.com.example.event)." })
});

export type PassPathParams = z.infer<typeof PassPathParamsSchema>;
export type PassIdParams = z.infer<typeof PassIdParamsSchema>;
export type DevicePassRegistrationsParams = z.infer<typeof DevicePassRegistrationsParamsSchema>;