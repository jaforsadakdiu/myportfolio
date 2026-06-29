const express = require('express');
const fs = require('fs');
const path = require('path');
const { getSiteUrl, generateSitemap, generateRobots } = require('./lib/seo');
const { renderHome, renderBlogList, renderBlogPost } = require('./lib/render');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'portfolio2026';

const sessions = new Map();

function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readContent() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeContent(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use(express.json({ limit: '2mb' }));

// SEO routes (before static)
app.get('/', (_req, res) => {
  try {
    const content = readContent();
    res.type('html').send(renderHome(content));
  } catch {
    res.status(500).send('Error loading site');
  }
});

app.get('/blog', (_req, res) => {
  try {
    const content = readContent();
    res.type('html').send(renderBlogList(content));
  } catch {
    res.status(500).send('Error loading blog');
  }
});

app.get('/blog/:slug', (req, res) => {
  try {
    const content = readContent();
    const post = (content.blogs || []).find(
      b => b.slug === req.params.slug && b.published !== false
    );
    if (!post) return res.status(404).type('html').send('<h1>Post not found</h1><a href="/blog">Back to blog</a>');
    res.type('html').send(renderBlogPost(content, post));
  } catch {
    res.status(500).send('Error loading post');
  }
});

app.get('/sitemap.xml', (_req, res) => {
  try {
    const content = readContent();
    const siteUrl = getSiteUrl(content);
    res.type('application/xml').send(generateSitemap(content, siteUrl));
  } catch {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (_req, res) => {
  try {
    const content = readContent();
    res.type('text/plain').send(generateRobots(getSiteUrl(content)));
  } catch {
    res.type('text/plain').send('User-agent: *\nAllow: /\n');
  }
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('/api/content', (_req, res) => {
  try {
    res.json(readContent());
  } catch (err) {
    res.status(500).json({ error: 'Failed to read content' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken();
    sessions.set(token, { username, createdAt: Date.now() });
    return res.json({ token, username });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', requireAuth, (req, res) => {
  const token = req.headers['x-admin-token'];
  sessions.delete(token);
  res.json({ success: true });
});

app.get('/api/admin/content', requireAuth, (_req, res) => {
  try {
    res.json(readContent());
  } catch (err) {
    res.status(500).json({ error: 'Failed to read content' });
  }
});

app.put('/api/admin/content', requireAuth, (req, res) => {
  try {
    writeContent(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

app.post('/api/admin/upload-photo', requireAuth, (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }
    const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid image format' });

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const imagesDir = path.join(__dirname, 'public', 'images');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    const filename = `profile.${ext}`;
    fs.writeFileSync(path.join(imagesDir, filename), buffer);
    res.json({ path: `/images/${filename}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

app.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin.html`);
  console.log(`Sitemap at http://localhost:${PORT}/sitemap.xml`);
});
