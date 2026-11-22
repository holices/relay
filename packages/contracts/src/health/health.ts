import { z } from "zod";

/** Body returned by both health signals when the API is healthy (FR-010). */
export const HealthResponse = z.strictObject({
  status: z.literal("ok"),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
