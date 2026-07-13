import type { Metadata } from 'next'
import { translations } from '@/lib/translations'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || "en";
  
  return {
    title: "Privacy Policy | MCS Consulting",
    description: "Privacy Policy and data protection terms for MCS Consulting.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/privacy-policy`,
      languages: {
        "en": "https://www.mcsc.co.id/en/privacy-policy",
        "id": "https://www.mcsc.co.id/id/privacy-policy",
        "zh": "https://www.mcsc.co.id/cn/privacy-policy",
        "x-default": "https://www.mcsc.co.id/en/privacy-policy"
      },
    },
  };
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;
  
  return (
    <main className="flex-grow pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground md:text-5xl font-sans">
          Privacy Policy
        </h1>
        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
          <p className="lead">
            This Privacy Policy document contains types of information that is collected and recorded by MCS Consulting and how we use it.
          </p>
          <p>
            If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
          </p>
          <h2>Log Files</h2>
          <p>
            MCS Consulting follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
          </p>
          <h2>Privacy Policies</h2>
          <p>
            You may consult this list to find the Privacy Policy for each of the advertising partners of MCS Consulting.
          </p>
          <h2>Consent</h2>
          <p>
            By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
          </p>
        </div>
      </div>
    </main>
  );
}
