import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(process.env.GITHUB_PAGES === "true" ? { basePath: "/resume_studio" } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.GITHUB_PAGES === "true" ? "/resume_studio" : "",
  },
  experimental: {
    agentFeedback: true,
  },
};

export default nextConfig;
