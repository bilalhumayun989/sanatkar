import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ae01.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 's.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'www.har-tech.com',
      },
      {
        protocol: 'https',
        hostname: 'www.sewingpartsonline.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'ocjizhqjgaxutfhkzxud.supabase.co',
      },
    ],
  },
};

export default nextConfig;
