import { describe, expect, it } from "vitest";
import { HealthResponse } from "./health.ts";

describe("HealthResponse", () => {
  it("accepts the healthy body", () => {
    expect(HealthResponse.parse({ status: "ok" })).toEqual({ status: "ok" });
  });

  it("rejects unknown fields", () => {
    expect(HealthResponse.safeParse({ status: "ok", extra: 1 }).success).toBe(false);
  });
});
