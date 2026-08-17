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
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://*.google.com; frame-src 'self' https://calendar.google.com https://*.google.com https://*.google.co.id; connect-src 'self' https://*.supabase.co wss://*.supabase.co http://127.0.0.1:8000 http://localhost:8000 https://*; frame-ancestors 'self'; object-src 'none'; base-uri 'self';" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Legacy HRMS redirects
      { source: '/access-control/:path*', destination: '/hrms/access-control/:path*', permanent: true },
      { source: '/apply-leave/:path*', destination: '/hrms/apply-leave/:path*', permanent: true },
      { source: '/assets/:path*', destination: '/hrms/assets/:path*', permanent: true },
      { source: '/attendance-management/:path*', destination: '/hrms/attendance-management/:path*', permanent: true },
      { source: '/attendance/:path*', destination: '/hrms/attendance/:path*', permanent: true },
      { source: '/calendar/:path*', destination: '/hrms/calendar/:path*', permanent: true },
      { source: '/dashboard/:path*', destination: '/hrms/dashboard/:path*', permanent: true },
      { source: '/employees/:path*', destination: '/hrms/employees/:path*', permanent: true },
      { source: '/leave-approval/:path*', destination: '/hrms/leave-approval/:path*', permanent: true },
      { source: '/leave/:path*', destination: '/hrms/leave/:path*', permanent: true },
      { source: '/my-assets/:path*', destination: '/hrms/my-assets/:path*', permanent: true },
      { source: '/my-payroll/:path*', destination: '/hrms/my-payroll/:path*', permanent: true },
      { source: '/notifications/:path*', destination: '/shared/notifications/:path*', permanent: true },
      { source: '/payroll/:path*', destination: '/hrms/payroll/:path*', permanent: true },
      { source: '/performance/:path*', destination: '/hrms/performance/:path*', permanent: true },
      { source: '/profile/:path*', destination: '/hrms/profile/:path*', permanent: true },
      { source: '/public-holidays/:path*', destination: '/hrms/public-holidays/:path*', permanent: true },
      { source: '/roles/:path*', destination: '/hrms/roles/:path*', permanent: true },
      { source: '/settings/:path*', destination: '/hrms/settings/:path*', permanent: true },
      { source: '/timesheet-management/:path*', destination: '/hrms/timesheet-management/:path*', permanent: true },
      { source: '/timesheets/:path*', destination: '/hrms/timesheets/:path*', permanent: true },
      
      // Legacy Business redirects
      { source: '/chat-center/:path*', destination: '/business/chat-center/:path*', permanent: true },
      { source: '/chat/:path*', destination: '/business/chat/:path*', permanent: true },
      { source: '/clients/:path*', destination: '/business/clients/:path*', permanent: true },
      { source: '/my-clients/:path*', destination: '/business/my-clients/:path*', permanent: true },
      { source: '/assigned-orders/:path*', destination: '/business/assigned-orders/:path*', permanent: true },
      { source: '/teams/:path*', destination: '/business/teams/:path*', permanent: true },
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
