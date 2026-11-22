import { HealthResponse } from "@relay/contracts";

// Spike page (T006): proves the web app consumes @relay/contracts as source.
export default function Page() {
  const result = HealthResponse.safeParse({ status: "ok" });
  return (
    <main>
      <h1>Relay</h1>
      <p>Contract check: {result.success ? result.data.status : "invalid"}</p>
    </main>
  );
}
