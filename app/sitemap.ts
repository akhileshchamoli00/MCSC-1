import type { MetadataRoute } from 'next'
import { translations } from '@/lib/translations'

export default function sitemap(): MetadataRoute.Sitemap {
    const base = 'https://www.mcsc.co.id'
    const locales = ['en', 'id', 'cn'] as const

    const routes = [
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
        '/privacy-policy',
    ]

    const dynamicAnnouncements = translations.en.announcement.items.map(
        (item) => `/announcement/${item.id}`
    )
    const allRoutes = [...routes, ...dynamicAnnouncements]

    return allRoutes.flatMap((route) => {
        // Shared alternates block — identical on all three entries for this route
        const languages = {
            'en': `${base}/en${route}`,
            'id': `${base}/id${route}`,
            'zh': `${base}/cn${route}`,
            'x-default': `${base}/en${route}`,
        }

        return locales.map((lang) => ({
            url: `${base}/${lang}${route}`,
            lastModified: new Date(),
            changeFrequency: (route.startsWith('/announcement') ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
            priority: route === '' ? 1.0 : route.startsWith('/announcement/') ? 0.6 : 0.8,
            alternates: { languages },
        }))
    })
}