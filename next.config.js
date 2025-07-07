/** @type {import('next').NextConfig} */
const nextConfig = {
  // images configuration
  images: {
    domains: ['api.ordinalsbot.com', 'ordinalsbot.com'],
    unoptimized: true,
  },

  // CORS headers for your API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // Disable ESLint failures from blocking next build (especially for flat config)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack fallbacks for Node built-ins
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs:  false,
      net: false,
      tls: false,
    };
    return config;
  },

  reactStrictMode: true,

  // Remove console.* calls in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Transpile LaserEyes packages
  transpilePackages: ['@omnisat/lasereyes-react', '@omnisat/lasereyes-core'],
};

module.exports = nextConfig;
