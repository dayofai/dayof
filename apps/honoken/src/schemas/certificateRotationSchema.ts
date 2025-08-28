import { z } from "zod/v4";

export const CertBundleDataSchema = z.object({
  wwdr: z.string().min(1, { error: "WWDR PEM string is required" }),
  signerCert: z.string().min(1, { error: "Signer certificate PEM string is required" }),
  signerKey: z.string().min(1, { error: "Signer key PEM string is required" }),
  signerKeyPassphrase: z.string().optional().default("") // Optional passphrase, default to empty string
});

export const CertificateRotationBodySchema = z.object({
  bundleData: CertBundleDataSchema,
  isEnhanced: z.boolean(),
  teamId: z.string().min(1, { error: "Team ID is required" }),
  description: z.string().nullable().optional()
});

export type CertificateRotationPayload = z.infer<typeof CertificateRotationBodySchema>;