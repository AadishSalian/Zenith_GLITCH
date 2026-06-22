import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable minification to bypass SWC hang on Vercel
  productionBrowserSourceMaps: true,
  swcMinify: false, // In Next.js 15+, SWC is default, we can try to disable it or change settings
  experimental: {
    // try to force webpack if possible, but turbo might be default
  }
};

export default nextConfig;
