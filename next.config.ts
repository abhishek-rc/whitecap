import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
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
      {
        protocol: 'https',
        hostname: 'agilityassets.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assetportal.syndigo.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.syndigo.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

