import Head from 'next/head';
import { useRouter } from 'next/router';
import { useI18n } from '@/shared/contexts/I18nContext';
import { jsonLd } from '@/shared/lib/services/seo';

interface SEOHeadProps {
  pageKey: string;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  noindex?: boolean;
  schema?: keyof typeof jsonLd;
}

export default function SEOHead({
  pageKey,
  title,
  description,
  keywords,
  image = 'https://plan2fund.com/og-image.svg',
  noindex = false,
  schema,
}: SEOHeadProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  
  // Get localized content
  const seoTitle = title || t(`seo.${pageKey}.title` as any);
  const seoDescription = description || t(`seo.${pageKey}.description` as any);
  const seoKeywords = keywords || t(`hero.keywords` as any);
  
  const baseUrl = 'https://plan2fund.com';
  const currentPath = router.asPath.split('?')[0]; // Remove query params
  const currentUrl = `${baseUrl}${currentPath}`;

  return (
    <Head>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={seoTitle} />
      <meta property="og:locale" content={locale === 'en' ? 'en_US' : 'de_DE'} />
      <meta property="og:site_name" content="Plan2Fund" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@plan2fund" />
      <meta name="twitter:creator" content="@plan2fund" />
      
      {/* Canonical */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Hreflang - Enhanced for better SEO */}
      <link rel="alternate" hrefLang="en" href={`${baseUrl}${currentPath}`} />
      <link rel="alternate" hrefLang="de" href={`${baseUrl}/de${currentPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${currentPath}`} />
      
      {/* Additional SEO meta tags */}
      <meta name="language" content={locale === 'en' ? 'English' : 'German'} />
      <meta name="geo.region" content="AT" />
      <meta name="geo.country" content="Austria" />
      
      {/* Robots */}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Theme */}
      <meta name="theme-color" content="#2563eb" />
      
      {/* JSON-LD Schema */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd[schema]) }}
        />
      )}
    </Head>
  );
}
