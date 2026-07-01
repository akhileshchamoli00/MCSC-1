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
  async rewrites() {
    return [
      {
        source: '/api-proxy/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*'
      },
      {
        source: '/api-proxy/uploads/:path*',
        destination: 'http://127.0.0.1:8000/uploads/:path*'
      }
    ];
  }
}

export default nextConfig
