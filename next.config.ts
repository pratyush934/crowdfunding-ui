import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
    ],
  },
  // Enable JSON imports
  webpack: (config, { dev, isServer }) => {
    // Fallback for Node.js modules that don't work in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Allow importing JSON files
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });

    return config;
  },

  // Experimental features that might help with JSON imports
  experimental: {
    esmExternals: true,
  },

  // Transpile packages if needed
  transpilePackages: [
    '@coral-xyz/anchor',
    '@solana/web3.js',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
  ],

  // Environment variables (if you need them)
  env: {
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'localhost',
    NEXT_PUBLIC_RPC_ENDPOINT: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'http://127.0.0.1:8899',
  },
};

export default nextConfig;