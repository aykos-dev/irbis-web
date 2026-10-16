import { z } from "zod";

const publicEnvSchema = z.object({
  apiUrl: z.url(),
  env: z.enum(["dev", "staging", "production"]),
});

export type PublicConfig = z.infer<typeof publicEnvSchema>;
export type AppEnv = PublicConfig["env"];

/**
 * Typed read of the only two variables exposed to the browser. Each must be referenced
 * literally (process.env.NEXT_PUBLIC_…) so Next.js can inline it at build time.
 */
export const config: PublicConfig = publicEnvSchema.parse({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  env: process.env.NEXT_PUBLIC_ENV,
});
