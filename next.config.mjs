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
  allowedDevOrigins: ["www.mcsc.co.id", "localhost:3000"],
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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/services',
        destination: '/en/services',
        permanent: true,
      },
      {
        source: '/services/:path*',
        destination: '/en/services/:path*',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/en/about',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/en/contact',
        permanent: true,
      },
      {
        source: '/resources',
        destination: '/en/resources',
        permanent: true,
      },
      {
        source: '/resources/:path*',
        destination: '/en/resources/:path*',
        permanent: true,
      },
      // Legacy URL Redirects to Homepage
      { source: '/blog/:path*', destination: '/en', permanent: true },
      { source: '/en/blog/:path*', destination: '/en', permanent: true },
      { source: '/id/blog/:path*', destination: '/id', permanent: true },
      { source: '/cn/blog/:path*', destination: '/cn', permanent: true },
      { source: '/category/:path*', destination: '/en', permanent: true },
      { source: '/en/category/:path*', destination: '/en', permanent: true },
      { source: '/categoryblog/:path*', destination: '/en', permanent: true },
      { source: '/en/categoryblog/:path*', destination: '/en', permanent: true },
      { source: '/pendirianperusahaan', destination: '/id', permanent: true },
      { source: '/perubahan-dokumenstruktur-perusahaan', destination: '/id', permanent: true },
      { source: '/en/perubahan-dokumenstruktur-perusahaan', destination: '/en', permanent: true },
      { source: '/sbu-standar-badan-usaha-sijuk', destination: '/id', permanent: true },
      { source: '/en/sbu-standar-badan-usaha-sijuk', destination: '/en', permanent: true },
      { source: '/pemberitahuan', destination: '/id', permanent: true },
      { source: '/en/pemberitahuan', destination: '/en', permanent: true },
      { source: '/tentang-kami', destination: '/id', permanent: true },
      { source: '/en/tentang-kami', destination: '/en', permanent: true },
      { source: '/product/:path*', destination: '/en', permanent: true },
      { source: '/en/product/:path*', destination: '/en', permanent: true },
      { source: '/id/product/:path*', destination: '/id', permanent: true },
      { source: '/cn/product/:path*', destination: '/cn', permanent: true },
      { source: '/pengurusan-perizinan-badan-usaha', destination: '/id', permanent: true },
      { source: '/en/pengurusan-perizinan-badan-usaha', destination: '/en', permanent: true },
      { source: '/privacy-policy', destination: '/en', permanent: true },
      { source: '/en/privacy-policy', destination: '/en', permanent: true },
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
