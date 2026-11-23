import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Allow any HTTPS hostname — category/listing images come from arbitrary external URLs
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
