const fs = require('fs');
const path = require('path');
const {
  escapeHtml,
  getSiteUrl,
  absoluteUrl,
  buildMetaTags,
  buildPersonJsonLd,
  buildWebsiteJsonLd,
  buildBlogPostingJsonLd,
  renderBlogContent
} = require('./seo');

const PUBLIC = path.join(__dirname, '..', 'public');

function injectSeo(html, seoBlock) {
  return html.replace('<!--SEO_HEAD-->', seoBlock);
}

function homeSeoBlock(content, siteUrl) {
  const { profile, seo } = content;
  const title = seo?.title || `${profile.name} | ${profile.title}`;
  const description = seo?.description || profile.bio;
  const keywords = seo?.keywords || `${profile.name}, jaforsadak, software developer`;
  const meta = buildMetaTags({
    title,
    description,
    keywords,
    canonical: siteUrl,
    ogImage: seo?.ogImage || profile.photo,
    siteUrl,
    author: profile.name
  });
  const verification = seo?.googleSiteVerification
    ? `\n  <meta name="google-site-verification" content="${escapeHtml(seo.googleSiteVerification)}" />`
    : '';
  const jsonLd = `
  <script type="application/ld+json">${buildPersonJsonLd(content, siteUrl)}</script>
  <script type="application/ld+json">${buildWebsiteJsonLd(content, siteUrl)}</script>`;
  return meta + verification + jsonLd;
}

function renderHome(content) {
  const siteUrl = getSiteUrl(content);
  let html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  return injectSeo(html, homeSeoBlock(content, siteUrl));
}

function renderBlogList(content) {
  const siteUrl = getSiteUrl(content);
  const { profile, site, seo } = content;
  const blogs = (content.blogs || []).filter(b => b.published !== false);
  const title = `${site.blogLabel || 'Blog'} | ${profile.name}`;
  const description = site.blogDescription || seo?.description;

  const cards = blogs.map(b => `
    <article class="blog-card">
      <time class="blog-date" datetime="${escapeHtml(b.publishedAt)}">${escapeHtml(b.publishedAt)}</time>
      <h2 class="blog-card-title"><a href="/blog/${escapeHtml(b.slug)}">${escapeHtml(b.title)}</a></h2>
      <p class="blog-excerpt">${escapeHtml(b.excerpt)}</p>
      <div class="blog-tags">${(b.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      <a href="/blog/${escapeHtml(b.slug)}" class="blog-read">${escapeHtml(site.blogReadBtn || 'Read article')} →</a>
    </article>
  `).join('');

  const meta = buildMetaTags({
    title,
    description,
    keywords: `Jafor Sadak blog, ${profile.name}, programming blog, ${seo?.keywords || ''}`,
    canonical: `${siteUrl}/blog`,
    ogImage: seo?.ogImage || profile.photo,
    siteUrl,
    author: profile.name
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${meta}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/style.css" />
  <link rel="stylesheet" href="/css/blog.css" />
</head>
<body class="blog-page">
  <nav class="nav"><div class="nav-inner">
    <a href="/" class="nav-logo">~/${escapeHtml(profile.name.split(' ')[0])}</a>
    <a href="/" class="btn btn-ghost">← Home</a>
  </div></nav>
  <main class="blog-list-page">
    <header class="blog-list-header">
      <span class="section-label">${escapeHtml(site.blogLabel || 'Blog')}</span>
      <h1>${escapeHtml(site.blogTitle || 'Articles & notes')}</h1>
      <p>${escapeHtml(site.blogDescription || '')}</p>
    </header>
    <div class="blog-list">${cards || '<p class="blog-empty">No posts yet.</p>'}</div>
  </main>
  <footer class="footer"><p>${escapeHtml(site.footerText || '')}</p></footer>
</body>
</html>`;
}

function renderBlogPost(content, post) {
  const siteUrl = getSiteUrl(content);
  const { profile, site } = content;
  const title = post.seo?.title || `${post.title} | ${profile.name}`;
  const description = post.seo?.description || post.excerpt;
  const keywords = post.seo?.keywords || `${post.title}, Jafor Sadak, ${(post.tags || []).join(', ')}`;
  const canonical = `${siteUrl}/blog/${post.slug}`;

  const meta = buildMetaTags({
    title,
    description,
    keywords,
    canonical,
    ogImage: post.image || content.seo?.ogImage || profile.photo,
    siteUrl,
    type: 'article',
    author: post.author || profile.name,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt
  });

  const jsonLd = `<script type="application/ld+json">${buildBlogPostingJsonLd(post, content, siteUrl)}</script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${meta}
  ${jsonLd}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/style.css" />
  <link rel="stylesheet" href="/css/blog.css" />
</head>
<body class="blog-page">
  <nav class="nav"><div class="nav-inner">
    <a href="/" class="nav-logo">~/${escapeHtml(profile.name.split(' ')[0])}</a>
    <a href="/blog" class="btn btn-ghost">← All posts</a>
  </div></nav>
  <main class="blog-post-page">
    <article itemscope itemtype="https://schema.org/BlogPosting">
      <header class="blog-post-header">
        <time itemprop="datePublished" datetime="${escapeHtml(post.publishedAt)}">${escapeHtml(post.publishedAt)}</time>
        <h1 itemprop="headline">${escapeHtml(post.title)}</h1>
        <p class="blog-post-author">By <span itemprop="author">${escapeHtml(post.author || profile.name)}</span></p>
        <div class="blog-tags">${(post.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      </header>
      <div class="blog-post-body" itemprop="articleBody">
        ${renderBlogContent(post.content)}
      </div>
    </article>
  </main>
  <footer class="footer"><p>${escapeHtml(site.footerText || '')}</p></footer>
</body>
</html>`;
}

module.exports = { renderHome, renderBlogList, renderBlogPost };
