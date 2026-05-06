import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
import path from 'path';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sqnbdruwudkmvspfayoh.supabase.co',
        pathname: '/storage/v1/object/public/building-photos/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
