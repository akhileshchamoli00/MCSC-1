/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["recharts", "date-fns"],
  images: {
    unoptimized: true,
  },
  // Allow hot module reloading (HMR) websocket from the production/test domain
  allowedDevOrigins: ["hrms.indotax.co.id", "localhost:3000"],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api-proxy',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api-proxy/api/:path*',
        destination: `${backendUrl}/api/:path*`
      },
      {
        source: '/api-proxy/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`
      }
    ];
  }
}

export default nextConfig
