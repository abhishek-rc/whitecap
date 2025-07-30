import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sfostoragelive.blob.core.windows.net',
        port: '',
        pathname: '/assets/products/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.servicefoodsonline.kiwi',
        port: '',
        pathname: '/assets/products/**',
      },
    ],
  },
};

export default nextConfig;

