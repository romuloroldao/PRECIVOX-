import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://precivox.com.br';
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/para-mercados`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/funcionalidades`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/integracoes`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/cases`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/consumidor`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/planos`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/demo`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contato`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/privacidade`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/termos`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
