function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getSiteUrl(content) {
  return (process.env.SITE_URL || content.seo?.siteUrl || 'http://localhost:3000').replace(/\/$/, '');
}

function absoluteUrl(siteUrl, path) {
  if (!path) return siteUrl;
  if (path.startsWith('http')) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildMetaTags({ title, description, keywords, canonical, ogImage, siteUrl, type = 'website', author, publishedTime, modifiedTime }) {
  const desc = escapeHtml(description);
  const kw = escapeHtml(keywords);
  const canon = escapeHtml(canonical);
  const img = escapeHtml(absoluteUrl(siteUrl, ogImage || '/images/profile.jpg'));
  const ttl = escapeHtml(title);

  let tags = `
  <title>${ttl}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="${kw}" />
  <meta name="author" content="${escapeHtml(author)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${canon}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${ttl}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canon}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:site_name" content="${escapeHtml(author)} Portfolio" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ttl}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${img}" />`;

  if (publishedTime) {
    tags += `\n  <meta property="article:published_time" content="${escapeHtml(publishedTime)}" />`;
  }
  if (modifiedTime) {
    tags += `\n  <meta property="article:modified_time" content="${escapeHtml(modifiedTime)}" />`;
  }

  return tags;
}

function buildPersonJsonLd(content, siteUrl) {
  const { profile, seo } = content;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    alternateName: ['jaforsadak', 'jaforsadakdiu', 'Jafor Sadak'],
    url: siteUrl,
    image: absoluteUrl(siteUrl, profile.photo),
    jobTitle: profile.title,
    description: seo?.description || profile.bio,
    email: profile.email,
    address: { '@type': 'PostalAddress', addressCountry: 'BD' },
    sameAs: [profile.github, profile.linkedin].filter(Boolean)
  });
}

function buildWebsiteJsonLd(content, siteUrl) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${content.profile.name} — ${content.profile.title}`,
    alternateName: 'Jafor Sadak Portfolio',
    url: siteUrl,
    description: content.seo?.description,
    author: { '@type': 'Person', name: content.profile.name }
  });
}

function buildBlogPostingJsonLd(post, content, siteUrl) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo?.description || post.excerpt,
    image: absoluteUrl(siteUrl, content.seo?.ogImage || content.profile.photo),
    author: { '@type': 'Person', name: post.author || content.profile.name },
    publisher: { '@type': 'Person', name: content.profile.name },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    keywords: post.seo?.keywords || post.tags?.join(', ')
  });
}

function renderBlogContent(content) {
  return content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p)}</p>`)
    .join('\n');
}

function generateSitemap(content, siteUrl) {
  const urls = [
    { loc: siteUrl, priority: '1.0', changefreq: 'weekly' },
    { loc: `${siteUrl}/blog`, priority: '0.9', changefreq: 'weekly' }
  ];

  (content.blogs || [])
    .filter(b => b.published !== false)
    .forEach(b => {
      urls.push({
        loc: `${siteUrl}/blog/${b.slug}`,
        lastmod: b.updatedAt || b.publishedAt,
        priority: '0.8',
        changefreq: 'monthly'
      });
    });

  const body = urls.map(u => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function generateRobots(siteUrl) {
  return `User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;
}

module.exports = {
  escapeHtml,
  getSiteUrl,
  absoluteUrl,
  buildMetaTags,
  buildPersonJsonLd,
  buildWebsiteJsonLd,
  buildBlogPostingJsonLd,
  renderBlogContent,
  generateSitemap,
  generateRobots
};
