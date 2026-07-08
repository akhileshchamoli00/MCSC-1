import type { MetadataRoute } from 'next'
import { translations } from '@/lib/translations'

export default function sitemap(): MetadataRoute.Sitemap {
    const base = 'https://www.mcsc.co.id'
    
    // Core localized routes (without lang prefix)
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

    // Append dynamic announcement routes
    const dynamicAnnouncements = translations.en.announcement.items.map(
        (item) => `/announcement/${item.id}`
    )
    const allRoutes = [...routes, ...dynamicAnnouncements]

    return allRoutes.map((route) => {
        // Build the primary EN url
        const enUrl = `${base}/en${route === '' ? '' : route}`
        const idUrl = `${base}/id${route === '' ? '' : route}`
        const cnUrl = `${base}/cn${route === '' ? '' : route}`

        return {
            url: enUrl,
            lastModified: new Date(),
            changeFrequency: route.startsWith('/announcement') ? 'weekly' : 'monthly',
            priority: route === '' ? 1.0 : route.startsWith('/announcement/') ? 0.6 : 0.8,
            alternates: {
                languages: {
                    'en': enUrl,
                    'id': idUrl,
                    'zh-CN': cnUrl,
                    'x-default': enUrl
                }
            }
        }
    })
}