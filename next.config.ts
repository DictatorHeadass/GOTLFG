import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Discord avatar CDN
    remotePatterns: [{ protocol: "https", hostname: "cdn.discordapp.com" }],
  },
};

export default nextConfig;
