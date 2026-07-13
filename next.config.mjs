/** @type {import('next').NextConfig} */
const nextConfig = {
  
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
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' }],
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
      {
        source: '/announcements',
        destination: '/en/announcements',
        permanent: true,
      },
      {
        source: '/announcement/:path*',
        destination: '/en/announcement/:path*',
        permanent: true,
      },
      // SEO Redirects
      {
        source: '/en/announcement/PERATURAN-PEMERINTAH-REPUBLIK-INDONESIA-NOMOR-20-TAHUN-2026',
        destination: '/en/announcement/pp-20-2026',
        permanent: true,
      },
      {
        source: '/id/announcement/PERATURAN-PEMERINTAH-REPUBLIK-INDONESIA-NOMOR-20-TAHUN-2026',
        destination: '/id/announcement/pp-20-2026',
        permanent: true,
      },
      {
        source: '/cn/announcement/PERATURAN-PEMERINTAH-REPUBLIK-INDONESIA-NOMOR-20-TAHUN-2026',
        destination: '/cn/announcement/pp-20-2026',
        permanent: true,
      },
      // Mapped Legacy URL Redirects
      { source: '/pendirianperusahaan', destination: '/id/services/establishment', permanent: true },
      { source: '/perubahan-dokumenstruktur-perusahaan', destination: '/id/services/company-changes', permanent: true },
      { source: '/en/perubahan-dokumenstruktur-perusahaan', destination: '/en/services/company-changes', permanent: true },
      { source: '/sbu-standar-badan-usaha-sijuk', destination: '/id/services/business-license', permanent: true },
      { source: '/en/sbu-standar-badan-usaha-sijuk', destination: '/en/services/business-license', permanent: true },
      { source: '/pemberitahuan', destination: '/id/announcements', permanent: true },
      { source: '/en/pemberitahuan', destination: '/en/announcements', permanent: true },
      { source: '/tentang-kami', destination: '/id/about', permanent: true },
      { source: '/en/tentang-kami', destination: '/en/about', permanent: true },
      { source: '/pengurusan-perizinan-badan-usaha', destination: '/id/services/business-license', permanent: true },
      { source: '/en/pengurusan-perizinan-badan-usaha', destination: '/en/services/business-license', permanent: true },
      { source: '/privacy-policy', destination: '/en/privacy-policy', permanent: true },
      
      // Keep these as homepage dumps since they don't have exact matches
      { source: '/blog/:path*', destination: '/en', permanent: true },
      { source: '/en/blog/:path*', destination: '/en', permanent: true },
      { source: '/id/blog/:path*', destination: '/id', permanent: true },
      { source: '/cn/blog/:path*', destination: '/cn', permanent: true },
      { source: '/category/:path*', destination: '/en', permanent: true },
      { source: '/en/category/:path*', destination: '/en', permanent: true },
      { source: '/categoryblog/:path*', destination: '/en', permanent: true },
      { source: '/en/categoryblog/:path*', destination: '/en', permanent: true },
      { source: '/product/:path*', destination: '/en', permanent: true },
      { source: '/en/product/:path*', destination: '/en', permanent: true },
      { source: '/id/product/:path*', destination: '/id', permanent: true },
      { source: '/cn/product/:path*', destination: '/cn', permanent: true },
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
