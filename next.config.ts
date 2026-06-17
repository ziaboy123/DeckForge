import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/deckforge',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/deckforge',
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ygoprodeck.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
