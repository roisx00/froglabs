import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['discord.js', 'firebase-admin'],
  typescript: {
    ignoreBuildErrors: true,
  },

  async rewrites() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'ribbitroyale.fun' }],
        destination: '/coming-soon',
      },
    ];
  },
};

export default nextConfig;
