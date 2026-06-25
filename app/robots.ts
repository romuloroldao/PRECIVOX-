import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/gestor/', '/cliente/', '/dashboard/'],
    },
    sitemap: 'https://precivox.com.br/sitemap.xml',
  };
}
