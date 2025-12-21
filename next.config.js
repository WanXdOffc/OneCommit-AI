/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize optional dependencies for Discord.js
      config.externals.push({
        'zlib-sync': 'commonjs zlib-sync',
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
      });
    }
    return config;
  },
  // Disable static optimization for API routes
  experimental: {
    serverComponentsExternalPackages: ['discord.js'],
  },
};

module.exports = nextConfig;