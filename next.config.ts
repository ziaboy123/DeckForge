import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
