import { NextSeoProps } from 'next-seo';

export const defaultSEO: NextSeoProps = {
  title: 'Plan2Fund - Find Funding & Build Business Plans | Austria & EU',
  description: 'Find funding you didn\'t know existed. Draft a comprehensive business plan in under 30 minutes. Built for Austrian and EU funding programs.',
  canonical: 'https://plan2fund.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://plan2fund.com',
    siteName: 'Plan2Fund',
    title: 'Plan2Fund - Find Funding & Build Business Plans',
    description: 'Find funding you didn\'t know existed. Draft a comprehensive business plan in under 30 minutes.',
    images: [
      {
        url: 'https://plan2fund.com/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Plan2Fund - Business Planning Platform',
      },
    ],
  },
  twitter: {
    handle: '@plan2fund',
    site: '@plan2fund',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'theme-color',
      content: '#2563eb',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'author',
      content: 'Plan2Fund',
    },
    {
      name: 'keywords',
      content: 'business plan, funding, Austria, EU grants, startup funding, business planning, funding programs, grants, loans',
    },
  ],
};

// Enhanced SEO with hreflang support
export const createPageSEO = (pageKey: string, locale: string = 'en') => {
  const baseUrl = 'https://plan2fund.com';
  const localizedUrl = locale === 'en' ? baseUrl : `${baseUrl}/${locale}`;
  
  const seoData = pageSEO[pageKey as keyof typeof pageSEO] || pageSEO.home;
  
  return {
    ...seoData,
    canonical: seoData.canonical || localizedUrl,
    openGraph: {
      ...seoData.openGraph,
      locale: locale === 'en' ? 'en_US' : 'de_DE',
      url: seoData.canonical || localizedUrl,
    },
    additionalMetaTags: [
      ...(seoData.additionalMetaTags || []),
      // Hreflang tags
      {
        rel: 'alternate',
        hrefLang: 'en',
        href: `${baseUrl}${pageKey === 'home' ? '' : `/${pageKey}`}`,
      },
      {
        rel: 'alternate',
        hrefLang: 'de',
        href: `${baseUrl}/de${pageKey === 'home' ? '' : `/${pageKey}`}`,
      },
      {
        rel: 'alternate',
        hrefLang: 'x-default',
        href: `${baseUrl}${pageKey === 'home' ? '' : `/${pageKey}`}`,
      },
    ],
  };
};

export const pageSEO = {
  home: {
    ...defaultSEO,
    title: 'Plan2Fund - Find Funding & Build Business Plans | Austria & EU',
    description: 'Find funding you didn\'t know existed. Draft a comprehensive business plan in under 30 minutes. Built for Austrian and EU funding programs.',
  },
  features: {
    ...defaultSEO,
    title: 'Features - Plan2Fund | Comprehensive Business Planning Tools',
    description: 'Discover our powerful features: program-aware editor, traceable eligibility, counterfactuals, and more. Built for Austrian and EU funding standards.',
    canonical: 'https://plan2fund.com/features',
  },
  pricing: {
    ...defaultSEO,
    title: 'Pricing - Plan2Fund | Affordable Business Planning Solutions',
    description: 'Choose the perfect plan for your business. Start free or upgrade for advanced features. Transparent pricing for all business sizes.',
    canonical: 'https://plan2fund.com/pricing',
  },
  resources: {
    ...defaultSEO,
    title: 'Resources - Plan2Fund | Guides, Templates & Funding Tips',
    description: 'Access our comprehensive resource library: funding guides, business plan templates, success stories, and expert insights.',
    canonical: 'https://plan2fund.com/resources',
  },
  about: {
    ...defaultSEO,
    title: 'About Plan2Fund - Our Mission & Story',
    description: 'Learn about Plan2Fund\'s mission to democratize access to funding through professional business planning tools and AI-powered recommendations.',
    canonical: 'https://plan2fund.com/about',
  },
  sme: {
    ...defaultSEO,
    title: 'SMEs & Established Businesses - Plan2Fund',
    description: 'Scale your existing business with strategic funding and expansion plans. Find growth funding, market expansion, and technology upgrade opportunities.',
    canonical: 'https://plan2fund.com/for/sme',
  },
  startups: {
    ...defaultSEO,
    title: 'Startups & Entrepreneurs - Plan2Fund',
    description: 'Turn your innovative ideas into reality with comprehensive business planning. Access pre-seed funding, MVP development, and market validation programs.',
    canonical: 'https://plan2fund.com/for/startups',
  },
  universities: {
    ...defaultSEO,
    title: 'Universities & Researchers - Plan2Fund',
    description: 'Access research grants and academic funding opportunities. Find funding for innovation projects, research, and student entrepreneurship programs.',
    canonical: 'https://plan2fund.com/for/innovation-hubs',
  },
  banks: {
    ...defaultSEO,
    title: 'Banks & Financial Institutions - Plan2Fund',
    description: 'Access institutional funding and partnership programs. Find large-scale funding opportunities for banks and financial institutions.',
    canonical: 'https://plan2fund.com/for/banks',
  },
  contact: {
    ...defaultSEO,
    title: 'Contact Us - Plan2Fund | Get Help & Support',
    description: 'Get in touch with Plan2Fund for support, questions about funding opportunities, or help with your business plan. We\'re here to help you succeed.',
    canonical: 'https://plan2fund.com/contact',
  },
  terms: {
    ...defaultSEO,
    title: 'Terms of Service - Plan2Fund | Legal Terms & Conditions',
    description: 'Read Plan2Fund\'s Terms of Service, including user responsibilities, payment terms, intellectual property rights, and legal obligations.',
    canonical: 'https://plan2fund.com/terms',
  },
  privacy: {
    ...defaultSEO,
    title: 'Privacy Policy - Plan2Fund | Data Protection & GDPR Compliance',
    description: 'Learn about Plan2Fund\'s privacy policy, data protection practices, and GDPR compliance. Understand how we collect, use, and protect your personal information.',
    canonical: 'https://plan2fund.com/privacy',
  },
  legal: {
    ...defaultSEO,
    title: 'Legal Information - Plan2Fund | Company Details & Compliance',
    description: 'Legal information for Plan2Fund including company details, legal notice, privacy policy, and terms of service in compliance with Austrian and EU law.',
    canonical: 'https://plan2fund.com/legal',
  },
};

export const jsonLd = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Plan2Fund',
    url: 'https://plan2fund.com',
    logo: 'https://plan2fund.com/logo.png',
    description: 'Helping founders find funding and build comprehensive business plans that meet Austrian and EU program standards.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Vienna',
      addressCountry: 'AT',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+43-1-234-5678',
      contactType: 'customer service',
      email: 'hello@plan2fund.com',
    },
    sameAs: [
      'https://twitter.com/plan2fund',
      'https://linkedin.com/company/plan2fund',
    ],
  },
  product: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Plan2Fund',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description: 'Comprehensive business planning platform for finding funding and creating professional business plans.',
    url: 'https://plan2fund.com',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '500',
    },
  },
  faq: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How long does it take to create a business plan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can draft a comprehensive business plan in under 30 minutes using our program-aware editor and pre-built templates.',
        },
      },
      {
        '@type': 'Question',
        name: 'What funding programs are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support over 214 Austrian and EU funding programs including AWS PreSeed, FFG, EU startup calls, bank loans, and more.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Plan2Fund free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we offer a free tier with basic features. Premium plans are available for advanced functionality and priority support.',
        },
      },
    ],
  },
  article: {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How to Create a Business Plan for Austrian and EU Funding',
    description: 'Comprehensive guide on creating business plans that meet Austrian and EU funding program requirements.',
    author: {
      '@type': 'Organization',
      name: 'Plan2Fund',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Plan2Fund',
      logo: {
        '@type': 'ImageObject',
        url: 'https://plan2fund.com/logo.png',
      },
    },
    datePublished: '2024-01-01',
    dateModified: '2024-01-01',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://plan2fund.com/resources',
    },
  },
  breadcrumbList: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://plan2fund.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Resources',
        item: 'https://plan2fund.com/resources',
      },
    ],
  },
  localBusiness: {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Plan2Fund',
    description: 'Business planning and funding platform for Austrian and EU entrepreneurs',
    url: 'https://plan2fund.com',
    telephone: '+43-1-234-5678',
    email: 'hello@plan2fund.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Mariahilfer Straße 123',
      addressLocality: 'Vienna',
      postalCode: '1060',
      addressCountry: 'AT',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '48.2082',
      longitude: '16.3738',
    },
    openingHours: 'Mo-Fr 09:00-18:00',
    sameAs: [
      'https://twitter.com/plan2fund',
      'https://linkedin.com/company/plan2fund',
    ],
  },
};
