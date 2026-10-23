/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@aayeshol/types'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/settings/connections',
        destination: '/dashboard/integrations',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
