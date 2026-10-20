/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@aayeshol/types'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.BACKEND_API_INTERNAL_URL || 'http://localhost:3001'}/api/:path*`,
  //     },
  //   ];
  // },
};

export default nextConfig;
