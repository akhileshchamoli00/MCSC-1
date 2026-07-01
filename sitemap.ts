import type { MetadataRoute } from 'next'

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

    return pages.map((path) => ({
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: path === '' ? 1 : 0.8,
    }))
}