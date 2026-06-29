let token = sessionStorage.getItem('adminToken');
let content = null;

const TAB_TITLES = {
  site: 'Site Labels',
  profile: 'Profile',
  stats: 'Stats',
  experience: 'Experience',
  projects: 'Projects',
  research: 'Research',
  tutorials: 'Tutorials',
  skills: 'Skills',
  blogs: 'Blogs',
  seo: 'SEO Settings',
  contact: 'Contact'
};

const SITE_FIELDS = [
  'pageTitleSuffix', 'navLogo', 'heroGreeting', 'statusAvailable', 'statusUnavailable',
  'heroBtnPrimary', 'heroBtnSecondary', 'experienceLabel', 'experienceTitle',
  'projectsLabel', 'projectsTitle', 'researchLabel', 'researchTitle', 'researchReadBtn',
  'tutorialsLabel', 'tutorialsTitle', 'tutorialWatchBtn',
  'blogLabel', 'blogTitle', 'blogDescription', 'blogReadBtn', 'blogViewAllBtn',
  'skillsLabel', 'skillsTitle',
  'projectStarsPrefix', 'projectForksSuffix', 'contactEmailBtn',
  'githubLabel', 'linkedinLabel', 'footerText', 'footerAdminLink'
];

const SEO_FIELDS = ['siteUrl', 'title', 'description', 'keywords', 'ogImage', 'googleSiteVerification'];

function apiHeaders() {
  return { 'Content-Type': 'application/json', 'X-Admin-Token': token };
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
}

function setSaveStatus(msg, type) {
  const el = document.getElementById('save-status');
  el.textContent = msg;
  el.className = 'save-status' + (type ? ` ${type}` : '');
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function login(username, password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Login failed');
  }
  const data = await res.json();
  token = data.token;
  sessionStorage.setItem('adminToken', token);
  return data;
}

async function fetchContent() {
  const res = await fetch('/api/admin/content', { headers: apiHeaders() });
  if (res.status === 401) {
    sessionStorage.removeItem('adminToken');
    token = null;
    showLogin();
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error('Failed to load content');
  return res.json();
}

async function saveContent(data) {
  const res = await fetch('/api/admin/content', {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify(data)
  });
  if (res.status === 401) {
    sessionStorage.removeItem('adminToken');
    token = null;
    showLogin();
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error('Failed to save');
  return res.json();
}

async function uploadPhoto(base64) {
  const res = await fetch('/api/admin/upload-photo', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ image: base64 })
  });
  if (!res.ok) throw new Error('Failed to upload photo');
  return res.json();
}

function populateSite() {
  const s = content.site || {};
  SITE_FIELDS.forEach(field => {
    const el = document.getElementById(`s-${field}`);
    if (el) el.value = s[field] || '';
  });
  renderNavLinksEditor();
}

function collectSite() {
  if (!content.site) content.site = {};
  SITE_FIELDS.forEach(field => {
    const el = document.getElementById(`s-${field}`);
    if (el) content.site[field] = el.value.trim();
  });
  collectNavLinks();
}

function renderNavLinksEditor() {
  const links = content.site?.navLinks || [];
  const container = document.getElementById('nav-links-editor');
  container.innerHTML = links.map((link, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-card-header">
        <h3>Nav link ${i + 1}</h3>
        <button type="button" class="btn btn-danger remove-nav">Remove</button>
      </div>
      <div class="form-grid">
        <label>Label<input type="text" class="nav-label" value="${esc(link.label)}" /></label>
        <label>Link (href)<input type="text" class="nav-href" value="${esc(link.href)}" /></label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.item-card').dataset.index, 10);
      content.site.navLinks.splice(idx, 1);
      renderNavLinksEditor();
    });
  });
}

function collectNavLinks() {
  const cards = document.querySelectorAll('#nav-links-editor .item-card');
  content.site.navLinks = Array.from(cards).map(card => ({
    label: card.querySelector('.nav-label').value.trim(),
    href: card.querySelector('.nav-href').value.trim()
  }));
}

function populateProfile() {
  const p = content.profile;
  document.getElementById('f-name').value = p.name || '';
  document.getElementById('f-title').value = p.title || '';
  document.getElementById('f-tagline').value = p.tagline || '';
  document.getElementById('f-bio').value = p.bio || '';
  document.getElementById('f-location').value = p.location || '';
  document.getElementById('f-remote').value = p.remote || '';
  document.getElementById('f-email').value = p.email || '';
  document.getElementById('f-github').value = p.github || '';
  document.getElementById('f-linkedin').value = p.linkedin || '';
  document.getElementById('f-photo').value = p.photo || '';
  document.getElementById('f-available').checked = !!p.available;
  document.getElementById('photo-preview').src = p.photo || '/images/profile.png';
}

function collectProfile() {
  content.profile = {
    name: document.getElementById('f-name').value.trim(),
    title: document.getElementById('f-title').value.trim(),
    tagline: document.getElementById('f-tagline').value.trim(),
    bio: document.getElementById('f-bio').value.trim(),
    location: document.getElementById('f-location').value.trim(),
    remote: document.getElementById('f-remote').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    github: document.getElementById('f-github').value.trim(),
    linkedin: document.getElementById('f-linkedin').value.trim(),
    photo: document.getElementById('f-photo').value.trim(),
    available: document.getElementById('f-available').checked
  };
}

function renderStatsEditor() {
  const container = document.getElementById('stats-editor');
  container.innerHTML = content.stats.map((stat, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-card-header">
        <h3>Stat ${i + 1}</h3>
        <button type="button" class="btn btn-danger remove-stat">Remove</button>
      </div>
      <div class="form-grid">
        <label>Label<input type="text" class="stat-label" value="${esc(stat.label)}" /></label>
        <label>Value<input type="text" class="stat-value" value="${esc(stat.value)}" /></label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-stat').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.item-card').dataset.index, 10);
      content.stats.splice(idx, 1);
      renderStatsEditor();
    });
  });
}

function collectStats() {
  const cards = document.querySelectorAll('#stats-editor .item-card');
  content.stats = Array.from(cards).map(card => ({
    label: card.querySelector('.stat-label').value.trim(),
    value: card.querySelector('.stat-value').value.trim()
  }));
}

function renderExperienceEditor() {
  const container = document.getElementById('experience-editor');
  container.innerHTML = content.experience.map((exp, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-card-header">
        <h3>${esc(exp.company || 'New entry')}</h3>
        <button type="button" class="btn btn-danger remove-exp">Remove</button>
      </div>
      <div class="form-grid">
        <label>Period<input type="text" class="exp-period" value="${esc(exp.period)}" /></label>
        <label>Location<input type="text" class="exp-location" value="${esc(exp.location)}" /></label>
        <label>Company<input type="text" class="exp-company" value="${esc(exp.company)}" /></label>
        <label>Role<input type="text" class="exp-role" value="${esc(exp.role)}" /></label>
        <div class="array-field">
          <label>Highlights (one per line)<textarea class="exp-highlights">${esc(exp.highlights.join('\n'))}</textarea></label>
        </div>
        <label>Tech stack (comma-separated)<input type="text" class="exp-tech" value="${esc(exp.tech.join(', '))}" /></label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-exp').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.item-card').dataset.index, 10);
      content.experience.splice(idx, 1);
      renderExperienceEditor();
    });
  });
}

function collectExperience() {
  const cards = document.querySelectorAll('#experience-editor .item-card');
  content.experience = Array.from(cards).map((card, i) => {
    const existing = content.experience[i];
    return {
      id: existing?.id || uid('exp'),
      period: card.querySelector('.exp-period').value.trim(),
      location: card.querySelector('.exp-location').value.trim(),
      company: card.querySelector('.exp-company').value.trim(),
      role: card.querySelector('.exp-role').value.trim(),
      highlights: card.querySelector('.exp-highlights').value.split('\n').map(s => s.trim()).filter(Boolean),
      tech: card.querySelector('.exp-tech').value.split(',').map(s => s.trim()).filter(Boolean)
    };
  });
}

function renderProjectsEditor() {
  const container = document.getElementById('projects-editor');
  container.innerHTML = content.projects.map((proj, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-card-header">
        <h3>${esc(proj.name || 'New project')}</h3>
        <button type="button" class="btn btn-danger remove-proj">Remove</button>
      </div>
      <div class="form-grid">
        <label>Name<input type="text" class="proj-name" value="${esc(proj.name)}" /></label>
        <label>URL<input type="url" class="proj-url" value="${esc(proj.url)}" /></label>
        <label>Stars<input type="number" class="proj-stars" value="${proj.stars || 0}" min="0" /></label>
        <label>Forks<input type="number" class="proj-forks" value="${proj.forks || 0}" min="0" /></label>
        <label class="full">Description<textarea class="proj-desc" rows="2">${esc(proj.description)}</textarea></label>
        <label>Tags (comma-separated)<input type="text" class="proj-tags" value="${esc(proj.tags.join(', '))}" /></label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-proj').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.item-card').dataset.index, 10);
      content.projects.splice(idx, 1);
      renderProjectsEditor();
    });
  });
}

function collectProjects() {
  const cards = document.querySelectorAll('#projects-editor .item-card');
  content.projects = Array.from(cards).map((card, i) => {
    const existing = content.projects[i];
    return {
      id: existing?.id || uid('proj'),
      name: card.querySelector('.proj-name').value.trim(),
      url: card.querySelector('.proj-url').value.trim(),
      stars: parseInt(card.querySelector('.proj-stars').value, 10) || 0,
      forks: parseInt(card.querySelector('.proj-forks').value, 10) || 0,
      description: card.querySelector('.proj-desc').value.trim(),
      tags: card.querySelector('.proj-tags').value.split(',').map(s => s.trim()).filter(Boolean)
    };
  });
}

function renderResearchEditor() {
  if (!content.research) content.research = [];
  const container = document.getElementById('research-editor');
  container.innerHTML = content.research.map((item, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-card-header">
        <h3>${esc(item.title || 'New research')}</h3>
        <button type="button" class="btn btn-danger remove-research">Remove</button>
      </div>
      <div class="form-grid">
        <label class="full">Title<input type="text" class="res-title" value="${esc(item.title)}" /></label>
        <label>Authors<input type="text" class="res-authors" value="${esc(item.authors)}" /></label>
        <label>Year<input type="text" class="res-year" value="${esc(item.year)}" /></label>
        <label>Status<input type="text" class="res-status" value="${esc(item.status)}" placeholder="In Progress, Completed, Published" /></label>
        <label class="full">Paper / project URL<input type="url" class="res-url" value="${esc(item.url)}" /></label>
        <label class="full">Description<textarea class="res-desc" rows="2">${esc(item.description)}</textarea></label>
        <label>Tags (comma-separated)<input type="text" class="res-tags" value="${esc(item.tags.join(', '))}" /></label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-research').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.item-card').dataset.index, 10);
      content.research.splice(idx, 1);
      renderResearchEditor();
    });
  });
}

function collectResearch() {
  const cards = document.querySelectorAll('#research-editor .item-card');
  content.research = Array.from(cards).map((card, i) => {
    const existing = content.research[i];
    return {
      id: existing?.id || uid('res'),
      title: card.querySelector('.res-title').value.trim(),
      authors: card.querySelector('.res-authors').value.trim(),
      year: card.querySelector('.res-year').value.trim(),
      status: card.querySelector('.res-status').value.trim(),
      url: card.querySelector('.res-url').value.trim(),
      description: card.querySelector('.res-desc').value.trim(),
      tags: card.querySelector('.res-tags').value.split(',').map(s => s.trim()).filter(Boolean)
    };
  });
}

function renderTutorialsEditor() {
  if (!content.tutorials) content.tutorials = [];
  const container = document.getElementById('tutorials-editor');
  container.innerHTML = content.tutorials.map((item, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-card-header">
        <h3>${esc(item.title || 'New tutorial')}</h3>
        <button type="button" class="btn btn-danger remove-tutorial">Remove</button>
      </div>
      <div class="form-grid">
        <label class="full">Title<input type="text" class="tut-title" value="${esc(item.title)}" /></label>
        <label class="full">YouTube URL<input type="url" class="tut-url" value="${esc(item.youtubeUrl)}" placeholder="https://www.youtube.com/watch?v=..." /></label>
        <label>Duration<input type="text" class="tut-duration" value="${esc(item.duration)}" placeholder="15:30, Series, Playlist" /></label>
        <label>Date<input type="text" class="tut-date" value="${esc(item.date)}" /></label>
        <label class="full">Description<textarea class="tut-desc" rows="2">${esc(item.description)}</textarea></label>
        <label>Tags (comma-separated)<input type="text" class="tut-tags" value="${esc(item.tags.join(', '))}" /></label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-tutorial').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.item-card').dataset.index, 10);
      content.tutorials.splice(idx, 1);
      renderTutorialsEditor();
    });
  });
}

function collectTutorials() {
  const cards = document.querySelectorAll('#tutorials-editor .item-card');
  content.tutorials = Array.from(cards).map((card, i) => {
    const existing = content.tutorials[i];
    return {
      id: existing?.id || uid('tut'),
      title: card.querySelector('.tut-title').value.trim(),
      youtubeUrl: card.querySelector('.tut-url').value.trim(),
      duration: card.querySelector('.tut-duration').value.trim(),
      date: card.querySelector('.tut-date').value.trim(),
      description: card.querySelector('.tut-desc').value.trim(),
      tags: card.querySelector('.tut-tags').value.split(',').map(s => s.trim()).filter(Boolean)
    };
  });
}

function renderBlogsEditor() {
  if (!content.blogs) content.blogs = [];
  const container = document.getElementById('blogs-editor');
  container.innerHTML = content.blogs.map((blog, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-card-header">
        <h3>${esc(blog.title || 'New post')}</h3>
        <button type="button" class="btn btn-danger remove-blog">Remove</button>
      </div>
      <div class="form-grid">
        <label>Title<input type="text" class="blog-title" value="${esc(blog.title)}" /></label>
        <label>URL slug<input type="text" class="blog-slug" value="${esc(blog.slug)}" placeholder="my-post-title" /></label>
        <label>Author<input type="text" class="blog-author" value="${esc(blog.author)}" /></label>
        <label>Published date<input type="date" class="blog-published" value="${esc(blog.publishedAt)}" /></label>
        <label>Updated date<input type="date" class="blog-updated" value="${esc(blog.updatedAt || blog.publishedAt)}" /></label>
        <label class="checkbox-label"><input type="checkbox" class="blog-published-flag" ${blog.published !== false ? 'checked' : ''} /> Published</label>
        <label class="full">Excerpt<textarea class="blog-excerpt" rows="2">${esc(blog.excerpt)}</textarea></label>
        <label class="full">Content (paragraphs separated by blank lines)<textarea class="blog-content" rows="6">${esc(blog.content)}</textarea></label>
        <label>Tags (comma-separated)<input type="text" class="blog-tags" value="${esc((blog.tags || []).join(', '))}" /></label>
        <label class="full">SEO title<input type="text" class="blog-seo-title" value="${esc(blog.seo?.title || '')}" /></label>
        <label class="full">SEO description<textarea class="blog-seo-desc" rows="2">${esc(blog.seo?.description || '')}</textarea></label>
        <label class="full">SEO keywords<textarea class="blog-seo-keywords" rows="2">${esc(blog.seo?.keywords || '')}</textarea></label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-blog').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.item-card').dataset.index, 10);
      content.blogs.splice(idx, 1);
      renderBlogsEditor();
    });
  });
}

function collectBlogs() {
  const cards = document.querySelectorAll('#blogs-editor .item-card');
  content.blogs = Array.from(cards).map((card, i) => {
    const existing = content.blogs[i];
    return {
      id: existing?.id || uid('blog'),
      slug: card.querySelector('.blog-slug').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      title: card.querySelector('.blog-title').value.trim(),
      author: card.querySelector('.blog-author').value.trim(),
      publishedAt: card.querySelector('.blog-published').value.trim(),
      updatedAt: card.querySelector('.blog-updated').value.trim(),
      published: card.querySelector('.blog-published-flag').checked,
      excerpt: card.querySelector('.blog-excerpt').value.trim(),
      content: card.querySelector('.blog-content').value.trim(),
      tags: card.querySelector('.blog-tags').value.split(',').map(s => s.trim()).filter(Boolean),
      seo: {
        title: card.querySelector('.blog-seo-title').value.trim(),
        description: card.querySelector('.blog-seo-desc').value.trim(),
        keywords: card.querySelector('.blog-seo-keywords').value.trim()
      }
    };
  });
}

function populateSeo() {
  if (!content.seo) content.seo = {};
  SEO_FIELDS.forEach(field => {
    const el = document.getElementById(`seo-${field}`);
    if (el) el.value = content.seo[field] || '';
  });
}

function collectSeo() {
  if (!content.seo) content.seo = {};
  SEO_FIELDS.forEach(field => {
    const el = document.getElementById(`seo-${field}`);
    if (el) content.seo[field] = el.value.trim();
  });
}

function renderSkillsEditor() {
  const container = document.getElementById('skills-editor');
  container.innerHTML = content.skills.map((skill, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-card-header">
        <h3>${esc(skill.label || 'Category')}</h3>
        <button type="button" class="btn btn-danger remove-skill">Remove</button>
      </div>
      <div class="form-grid">
        <label>Category label<input type="text" class="skill-label" value="${esc(skill.label)}" /></label>
        <label class="full">Skills<textarea class="skill-value" rows="2">${esc(skill.value)}</textarea></label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-skill').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.item-card').dataset.index, 10);
      content.skills.splice(idx, 1);
      renderSkillsEditor();
    });
  });
}

function collectSkills() {
  const cards = document.querySelectorAll('#skills-editor .item-card');
  content.skills = Array.from(cards).map((card, i) => {
    const existing = content.skills[i];
    return {
      id: existing?.id || uid('skill'),
      label: card.querySelector('.skill-label').value.trim(),
      value: card.querySelector('.skill-value').value.trim()
    };
  });
}

function populateContact() {
  const c = content.contact;
  document.getElementById('f-contact-headline').value = c.headline || '';
  document.getElementById('f-contact-subtext').value = c.subtext || '';
  document.getElementById('f-contact-response').value = c.responseTime || '';
}

function collectContact() {
  content.contact = {
    headline: document.getElementById('f-contact-headline').value.trim(),
    subtext: document.getElementById('f-contact-subtext').value.trim(),
    responseTime: document.getElementById('f-contact-response').value.trim()
  };
}

function populateAll() {
  populateSite();
  populateProfile();
  renderStatsEditor();
  renderExperienceEditor();
  renderProjectsEditor();
  renderResearchEditor();
  renderTutorialsEditor();
  renderSkillsEditor();
  renderBlogsEditor();
  populateSeo();
  populateContact();
}

function collectAll() {
  collectSite();
  collectProfile();
  collectStats();
  collectExperience();
  collectProjects();
  collectResearch();
  collectTutorials();
  collectSkills();
  collectBlogs();
  collectSeo();
  collectContact();
}

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tab}`);
  });
  document.getElementById('tab-title').textContent = TAB_TITLES[tab] || tab;
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';
  try {
    await login(
      document.getElementById('login-username').value,
      document.getElementById('login-password').value
    );
    content = await fetchContent();
    populateAll();
    showDashboard();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  if (token) {
    await fetch('/api/admin/logout', { method: 'POST', headers: apiHeaders() }).catch(() => {});
  }
  sessionStorage.removeItem('adminToken');
  token = null;
  showLogin();
});

document.getElementById('save-btn').addEventListener('click', async () => {
  setSaveStatus('Saving...');
  try {
    collectAll();
    await saveContent(content);
    setSaveStatus('Saved successfully!', 'success');
    setTimeout(() => setSaveStatus(''), 3000);
  } catch (err) {
    setSaveStatus(err.message, 'error');
  }
});

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('add-nav-link').addEventListener('click', () => {
  if (!content.site.navLinks) content.site.navLinks = [];
  content.site.navLinks.push({ label: 'New link', href: '#' });
  renderNavLinksEditor();
});

document.getElementById('add-stat').addEventListener('click', () => {
  content.stats.push({ label: 'New stat', value: '0' });
  renderStatsEditor();
});

document.getElementById('add-experience').addEventListener('click', () => {
  content.experience.unshift({
    id: uid('exp'),
    period: 'Month Year — Present',
    location: 'Remote',
    company: 'Company Name',
    role: 'Role Title',
    highlights: ['Describe your impact here'],
    tech: ['Tech']
  });
  renderExperienceEditor();
});

document.getElementById('add-project').addEventListener('click', () => {
  content.projects.unshift({
    id: uid('proj'),
    name: 'Project Name',
    description: 'Project description',
    stars: 0,
    forks: 0,
    url: 'https://github.com',
    tags: ['Tag']
  });
  renderProjectsEditor();
});

document.getElementById('add-research').addEventListener('click', () => {
  if (!content.research) content.research = [];
  content.research.unshift({
    id: uid('res'),
    title: 'Research Title',
    authors: 'Jafor Sadak',
    year: '2025',
    status: 'In Progress',
    description: 'Research description',
    url: '',
    tags: ['Tag']
  });
  renderResearchEditor();
});

document.getElementById('add-tutorial').addEventListener('click', () => {
  if (!content.tutorials) content.tutorials = [];
  content.tutorials.unshift({
    id: uid('tut'),
    title: 'Tutorial Title',
    description: 'Tutorial description',
    youtubeUrl: 'https://www.youtube.com/watch?v=',
    duration: '10:00',
    date: '2025',
    tags: ['Tag']
  });
  renderTutorialsEditor();
});

document.getElementById('add-skill').addEventListener('click', () => {
  content.skills.push({ id: uid('skill'), label: 'New category', value: 'Skill list' });
  renderSkillsEditor();
});

document.getElementById('add-blog').addEventListener('click', () => {
  if (!content.blogs) content.blogs = [];
  const today = new Date().toISOString().slice(0, 10);
  content.blogs.unshift({
    id: uid('blog'),
    slug: 'new-blog-post',
    title: 'New Blog Post',
    excerpt: 'Short summary for search engines and blog listing.',
    content: 'Write your article here.\n\nSeparate paragraphs with a blank line.',
    author: 'Jafor Sadak',
    publishedAt: today,
    updatedAt: today,
    tags: ['Programming'],
    published: true,
    seo: {
      title: 'New Blog Post | Jafor Sadak',
      description: 'Article by Jafor Sadak about programming and software development.',
      keywords: 'Jafor Sadak, jaforsadak, programming blog'
    }
  });
  renderBlogsEditor();
});

document.getElementById('photo-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      setSaveStatus('Uploading photo...');
      const result = await uploadPhoto(reader.result);
      document.getElementById('f-photo').value = result.path;
      document.getElementById('photo-preview').src = result.path + '?t=' + Date.now();
      content.profile.photo = result.path;
      setSaveStatus('Photo uploaded! Save to persist.', 'success');
    } catch (err) {
      setSaveStatus(err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
});

async function init() {
  if (token) {
    try {
      content = await fetchContent();
      populateAll();
      showDashboard();
    } catch {
      showLogin();
    }
  } else {
    showLogin();
  }
}

init();
