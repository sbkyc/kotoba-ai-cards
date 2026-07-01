import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  ...(basePath ? { assetPrefix: basePath, basePath } : {}),
};

export default nextConfig;
