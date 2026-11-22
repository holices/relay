import type { NextConfig } from "next";

const config: NextConfig = {
  // Internal packages are consumed as TypeScript source (ADR-0004).
  transpilePackages: ["@relay/contracts"],
};

export default config;
