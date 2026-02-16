/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/v2', destination: '/app/v2', permanent: true },
      { source: '/plan', destination: '/app/plan', permanent: true },
      { source: '/settings', destination: '/app/settings', permanent: true },
      { source: '/timeline', destination: '/app/plan', permanent: true },
      { source: '/rsu', destination: '/app/plan', permanent: true },
    ];
  },
}

export default nextConfig
