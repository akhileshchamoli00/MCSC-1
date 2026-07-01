import type { MetadataRoute } from 'next'
import { translations } from '@/lib/translations'

export default function sitemap(): MetadataRoute.Sitemap {
    const base = 'https://www.mcsc.co.id'
    const pages = [
        '',
        '/about',
        '/services',
        '/services/establishment',
        '/services/business-license',
        '/services/company-changes',
        '/services/agreements',
        '/services/virtual-office',
        '/services/work-permit',
        '/services/intellectual-property',
        '/resources',
        '/resources/brand-classification',
        '/resources/check-application-status',
        '/resources/kbli',
        '/resources/faq',
        '/announcements',
        '/contact',
    ]

    // Dynamically append all individual regulatory announcement paths
    const dynamicAnnouncements = translations.en.announcement.items.map(
        (item) => `/announcement/${item.id}`
    )
    const allPages = [...pages, ...dynamicAnnouncements]

    return allPages.map((path) => ({
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: path.startsWith('/announcement/') ? 'weekly' : 'monthly',
        priority: path === '' ? 1.0 : path.startsWith('/announcement/') ? 0.6 : 0.8,
    }))
}