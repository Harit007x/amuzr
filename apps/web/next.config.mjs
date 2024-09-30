/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['lh3.googleusercontent.com'], // Add the domain here
    },
    transpilePackages: ['@repo/db', '@prisma/client'],
  };
  
export default nextConfig;
  