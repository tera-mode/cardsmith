import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/.playwright-mcp/**', '**/docs/playtest_reports/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
