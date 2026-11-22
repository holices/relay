import { HealthResponse } from "@relay/contracts";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

export function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.get("/health/live", { schema: { response: { 200: HealthResponse } } }, async () => ({
    status: "ok" as const,
  }));

  return app;
}
