import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { TOOLS_DATA } from '../data/tools';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://calculadoradeganhos.com.br';

  // Páginas estáticas principais
  const staticPages = [
    '',
    '/financas/',
    '/trabalhista/',
    '/matematica/',
    '/conversores/',
    '/ferramentas/',
    '/guias/',
    '/sobre/',
    '/contato/',
    '/privacidade/',
    '/termos/',
    '/cookies/',
    '/acessibilidade/',
    '/editorial/'
  ];

  // Ferramentas ativas
  const activeTools = TOOLS_DATA.filter(t => t.status === 'active').map(t => t.route);

  // Guias educativos
  const guides = await getCollection('guides');
  const guideUrls = guides.map(g => `/guias/${g.id}/`);

  const allUrls = [...new Set([...staticPages, ...activeTools, ...guideUrls])];

  const sitemap = `<?xmlversion="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
    .map(
      url => `
    <url>
      <loc>${baseUrl}${url}</loc>
      <changefreq>weekly</changefreq>
      <priority>${url === '' ? '1.0' : url.includes('/guias/') ? '0.7' : '0.8'}</priority>
    </url>
  `
    )
    .join('')}
</urlset>`;

  return new Response(sitemap.trim(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};