import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/deckforge',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/deckforge',
  },
  images: {
    // card pictures are Millennium Arena's copies under /millenniumarena/img, outside this app's basePath, which
    // next/image can't optimise; nothing is loaded from YGOPRODeck's image server (see src/lib/cardImages.ts)
    unoptimized: true,
  },
};

export default nextConfig;
