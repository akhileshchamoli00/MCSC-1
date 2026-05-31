import { MetadataRoute } from 'next'
import { translations } from '@/lib/translations'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mcsc.co.id'
  
  // Base static routes
  const routes = [
    '',
    '/about',
    '/services',
    '/announcements',
    '/resources',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic announcement routes
  // Using English as the source of truth for the available IDs
  const announcementIds = translations['en'].announcement.items.map((item: any) => item.id)
  
  const announcementRoutes = announcementIds.map((id: string) => ({
    url: `${baseUrl}/announcement/${id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...routes, ...announcementRoutes]
}
