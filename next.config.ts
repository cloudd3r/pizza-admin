import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // next/image needs each external host whitelisted explicitly. We
    // host product/ingredient artwork on Cloudinary, plus the seed
    // data references the Dodo Pizza CDN.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dodostatic.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
