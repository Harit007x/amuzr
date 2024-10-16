/** @type {import('next').NextConfig} */
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }

    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
    ],
  },
  transpilePackages: ['@repo/db', '@prisma/client', '@repo/recoil'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,  // Ensure Prisma's env() can access this
  },
};

export default nextConfig;
