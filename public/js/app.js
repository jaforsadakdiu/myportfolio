async function loadContent() {
  const res = await fetch('/api/content');
  if (!res.ok) throw new Error('Failed to load content');
  return res.json();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderSite(data) {
  const { site, profile } = data;
  document.title = data.seo?.title || `${profile.name} — ${site.pageTitleSuffix || profile.title}`;

  document.getElementById('nav-logo').textContent = site.navLogo || profile.name.split(' ')[0];

  const navLinks = document.getElementById('nav-links');
  navLinks.innerHTML = (site.navLinks || []).map(link =>
    `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
  ).join('');

  const statusEl = document.getElementById('nav-status');
  const statusText = profile.available ? site.statusAvailable : site.statusUnavailable;
  statusEl.innerHTML = `<span class="status-dot"></span>${escapeHtml(statusText)}`;
  statusEl.classList.toggle('unavailable', !profile.available);

  document.getElementById('hero-greeting').textContent = site.heroGreeting || '';
  document.getElementById('hero-name').textContent = profile.name;
  document.getElementById('hero-title').textContent = profile.title;
  document.getElementById('hero-tagline').textContent = profile.tagline;
  document.getElementById('hero-bio').textContent = profile.bio;
  document.getElementById('hero-location').textContent = `${profile.location} · ${profile.remote}`;

  document.getElementById('hero-btn-primary').textContent = site.heroBtnPrimary;
  document.getElementById('hero-btn-secondary').textContent = site.heroBtnSecondary;

  const photo = document.getElementById('hero-photo');
  photo.src = profile.photo || '/images/profile.jpg';
  photo.alt = profile.name;

  document.getElementById('exp-label').textContent = site.experienceLabel;
  document.getElementById('exp-title').textContent = site.experienceTitle;
  document.getElementById('proj-label').textContent = site.projectsLabel;
  document.getElementById('proj-title').textContent = site.projectsTitle;
  document.getElementById('research-label').textContent = site.researchLabel;
  document.getElementById('research-title').textContent = site.researchTitle;
  document.getElementById('tutorials-label').textContent = site.tutorialsLabel;
  document.getElementById('tutorials-title').textContent = site.tutorialsTitle;
  document.getElementById('skills-label').textContent = site.skillsLabel;
  document.getElementById('skills-title').textContent = site.skillsTitle;

  const galleryLabel = document.getElementById('gallery-label');
  if (galleryLabel) galleryLabel.textContent = site.galleryLabel || 'Gallery';
  const galleryTitle = document.getElementById('gallery-title');
  if (galleryTitle) galleryTitle.textContent = site.galleryTitle || 'Moments & Life Beyond Code';

  const blogLabel = document.getElementById('blog-label');
  if (blogLabel) blogLabel.textContent = site.blogLabel || 'Blog';
  const blogTitle = document.getElementById('blog-title');
  if (blogTitle) blogTitle.textContent = site.blogTitle || 'Articles';
  const blogDesc = document.getElementById('blog-desc');
  if (blogDesc) blogDesc.textContent = site.blogDescription || '';
  const blogViewAll = document.getElementById('blog-view-all');
  if (blogViewAll) blogViewAll.textContent = site.blogViewAllBtn || 'View all posts';

  document.getElementById('footer-text').textContent = site.footerText;
  document.getElementById('footer-admin').textContent = site.footerAdminLink;
}

function renderStats(stats) {
  document.getElementById('stats-grid').innerHTML = stats.map(s => `
    <div class="stat-card">
      <span class="stat-label">${escapeHtml(s.label)}</span>
      <div class="stat-value" data-value="${escapeHtml(s.value)}">0</div>
    </div>
  `).join('');
  initStatCounter();
}

function initStatCounter() {
  const panel = document.querySelector('.stats-panel');
  if (!panel) return;

  const animateValue = (el) => {
    const raw = el.dataset.value;
    const match = raw.match(/^([\d.]+)(.*)$/);
    if (!match) {
      el.textContent = raw;
      return;
    }
    const target = parseFloat(match[1]);
    const suffix = match[2] || '';
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = (Number.isInteger(target)
        ? Math.round(current)
        : current.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          panel.querySelectorAll('.stat-value').forEach(animateValue);
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(panel);
}

function renderExperience(experience) {
  document.getElementById('experience-list').innerHTML = experience.map(exp => `
    <article class="exp-card">
      <div class="exp-meta">
        <span>${escapeHtml(exp.period)}</span>
        <span>${escapeHtml(exp.location)}</span>
      </div>
      <h3 class="exp-role">${escapeHtml(exp.role)}</h3>
      <p class="exp-company">${escapeHtml(exp.company)}</p>
      <ul class="exp-highlights">
        ${exp.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
      </ul>
      <div class="exp-tech">
        ${exp.tech.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    </article>
  `).join('');
}

function renderProjects(projects, site) {
  const starsPrefix = site.projectStarsPrefix || '★';
  const forksSuffix = site.projectForksSuffix || 'forks';
  document.getElementById('projects-grid').innerHTML = projects.map(p => `
    <article class="project-card">
      <div class="project-card-header">
        <span class="project-icon">◈ repo</span>
        <span>${starsPrefix} ${p.stars}</span>
      </div>
      <div class="project-card-body">
        <h3 class="project-name">
          <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.name)}</a>
        </h3>
        <p class="project-stats">${p.forks} ${forksSuffix}</p>
        <p class="project-desc">${escapeHtml(p.description)}</p>
        <div class="project-tags">
          ${p.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function renderResearch(research, site) {
  const readBtn = site.researchReadBtn || 'Read paper';
  document.getElementById('research-grid').innerHTML = research.map(r => {
    const linkHtml = r.url
      ? `<a href="${escapeHtml(r.url)}" class="research-link" target="_blank" rel="noopener">${escapeHtml(readBtn)} →</a>`
      : '';
    return `
      <article class="research-card">
        <div class="research-header">
          <span class="research-status">${escapeHtml(r.status)}</span>
          <span class="research-year">${escapeHtml(r.year)}</span>
        </div>
        <h3 class="research-title">${escapeHtml(r.title)}</h3>
        <p class="research-authors">${escapeHtml(r.authors)}</p>
        <p class="research-desc">${escapeHtml(r.description)}</p>
        <div class="research-footer">
          <div class="research-tags">
            ${r.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          ${linkHtml}
        </div>
      </article>
    `;
  }).join('');
}

function renderTutorials(tutorials, site) {
  const watchBtn = site.tutorialWatchBtn || 'Watch on YouTube';
  document.getElementById('tutorials-grid').innerHTML = tutorials.map(t => {
    const videoId = getYoutubeId(t.youtubeUrl);
    const thumb = videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : '';
    const thumbHtml = thumb
      ? `<div class="tutorial-thumb">
           <img src="${thumb}" alt="" loading="lazy" />
           <div class="tutorial-play">
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
           </div>
         </div>`
      : `<div class="tutorial-thumb tutorial-thumb-placeholder">
           <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
         </div>`;
    return `
      <article class="tutorial-card">
        <a href="${escapeHtml(t.youtubeUrl)}" target="_blank" rel="noopener" class="tutorial-thumb-link">
          ${thumbHtml}
        </a>
        <div class="tutorial-body">
          <div class="tutorial-meta">
            <span>${escapeHtml(t.date)}</span>
            <span>${escapeHtml(t.duration)}</span>
          </div>
          <h3 class="tutorial-title">
            <a href="${escapeHtml(t.youtubeUrl)}" target="_blank" rel="noopener">${escapeHtml(t.title)}</a>
          </h3>
          <p class="tutorial-desc">${escapeHtml(t.description)}</p>
          <div class="tutorial-tags">
            ${t.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
          <a href="${escapeHtml(t.youtubeUrl)}" class="tutorial-watch btn btn-ghost" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M23.5 6.2c-.3-.3-.8-.5-1.3-.5-1.1 0-19.3 0-20.1 0-.5 0-1 .2-1.3.5-.4.4-.5 1-.5 1.6v8.4c0 .6.1 1.2.5 1.6.3.3.8.5 1.3.5.8 0 19 0 20.1 0 .5 0 1-.2 1.3-.5.4-.4.5-1 .5-1.6V7.8c0-.6-.1-1.2-.5-1.6zM9.7 15.5V8.5l6.5 3.5-6.5 3.5z"/></svg>
            ${escapeHtml(watchBtn)}
          </a>
        </div>
      </article>
    `;
  }).join('');
}

function renderBlogPreview(blogs, site) {
  const grid = document.getElementById('blog-preview-grid');
  if (!grid) return;
  const published = (blogs || []).filter(b => b.published !== false).slice(0, 3);
  const readBtn = site.blogReadBtn || 'Read article';
  grid.innerHTML = published.map(b => `
    <article class="blog-preview-card">
      <time datetime="${escapeHtml(b.publishedAt)}">${escapeHtml(b.publishedAt)}</time>
      <h3><a href="/blog/${escapeHtml(b.slug)}">${escapeHtml(b.title)}</a></h3>
      <p>${escapeHtml(b.excerpt)}</p>
      <a href="/blog/${escapeHtml(b.slug)}" class="blog-read">${escapeHtml(readBtn)} →</a>
    </article>
  `).join('');
}

function renderSkills(skills) {
  document.getElementById('skills-grid').innerHTML = skills.map(s => `
    <div class="skill-block">
      <h3>${escapeHtml(s.label)}</h3>
      <p>${escapeHtml(s.value)}</p>
    </div>
  `).join('');
}

function renderContact(data) {
  const { profile, contact, site } = data;
  document.getElementById('contact-headline').textContent = contact.headline;
  document.getElementById('contact-subtext').textContent = contact.subtext;
  document.getElementById('contact-response').textContent = contact.responseTime;

  const emailBtn = document.getElementById('contact-email');
  emailBtn.href = `mailto:${profile.email}`;
  emailBtn.textContent = site.contactEmailBtn || profile.email;

  const links = document.getElementById('contact-links');
  const linkItems = [];
  if (profile.github) {
    linkItems.push(`<a href="${escapeHtml(profile.github)}" target="_blank" rel="noopener">${escapeHtml(site.githubLabel || 'GitHub')}</a>`);
  }
  if (profile.linkedin) {
    linkItems.push(`<a href="${escapeHtml(profile.linkedin)}" target="_blank" rel="noopener">${escapeHtml(site.linkedinLabel || 'LinkedIn')}</a>`);
  }
  links.innerHTML = linkItems.join('');
}

let currentGallery = [];
let currentLightboxIndex = 0;

function renderHeroThumbs(gallery, currentPhoto) {
  const container = document.getElementById('hero-photo-thumbs');
  if (!container || !gallery || !gallery.length) return;

  container.innerHTML = gallery.map((item) => `
    <button type="button" class="hero-thumb-btn ${item.src === currentPhoto ? 'active' : ''}" data-src="${escapeHtml(item.src)}" title="${escapeHtml(item.title)}">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" />
    </button>
  `).join('');

  container.querySelectorAll('.hero-thumb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src;
      const photo = document.getElementById('hero-photo');
      if (photo) {
        photo.style.opacity = '0';
        setTimeout(() => {
          photo.src = src;
          photo.style.opacity = '1';
        }, 150);
      }
      container.querySelectorAll('.hero-thumb-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function renderGallery(gallery, site) {
  currentGallery = gallery || [];
  const filtersEl = document.getElementById('gallery-filters');
  const gridEl = document.getElementById('gallery-grid');
  if (!gridEl) return;

  const categories = ['All', ...new Set(currentGallery.map(g => g.category).filter(Boolean))];
  let activeCategory = 'All';

  function updateDisplay() {
    if (filtersEl) {
      filtersEl.innerHTML = categories.map(cat => `
        <button type="button" class="gallery-filter-btn ${cat === activeCategory ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `).join('');

      filtersEl.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activeCategory = btn.dataset.cat;
          updateDisplay();
        });
      });
    }

    const filtered = activeCategory === 'All'
      ? currentGallery
      : currentGallery.filter(g => g.category === activeCategory);

    gridEl.innerHTML = filtered.map((item) => {
      const realIndex = currentGallery.findIndex(g => g.id === item.id);
      return `
        <article class="gallery-card" data-index="${realIndex}">
          <div class="gallery-img-wrapper">
            <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy" />
            <div class="gallery-overlay">
              <span class="gallery-category">${escapeHtml(item.category)}</span>
              <h3 class="gallery-item-title">${escapeHtml(item.title)}</h3>
              <p class="gallery-item-caption">${escapeHtml(item.caption || '')}</p>
              <button type="button" class="gallery-zoom-btn" aria-label="Expand image">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    gridEl.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.index, 10);
        openLightbox(idx);
      });
    });
  }

  updateDisplay();
  initLightbox();
}

function openLightbox(index) {
  if (!currentGallery || !currentGallery.length) return;
  currentLightboxIndex = (index + currentGallery.length) % currentGallery.length;
  const item = currentGallery[currentLightboxIndex];

  const modal = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const category = document.getElementById('lightbox-category');
  const title = document.getElementById('lightbox-title');
  const caption = document.getElementById('lightbox-caption');

  if (img) img.src = item.src;
  if (category) category.textContent = item.category || 'Photo';
  if (title) title.textContent = item.title || '';
  if (caption) caption.textContent = item.caption || '';

  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightbox');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

function initLightbox() {
  const closeBtn = document.getElementById('lightbox-close');
  const overlay = document.getElementById('lightbox-overlay');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (closeBtn) closeBtn.onclick = closeLightbox;
  if (overlay) overlay.onclick = closeLightbox;
  if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); openLightbox(currentLightboxIndex - 1); };
  if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); openLightbox(currentLightboxIndex + 1); };

  document.onkeydown = (e) => {
    const modal = document.getElementById('lightbox');
    if (!modal || !modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') openLightbox(currentLightboxIndex - 1);
    if (e.key === 'ArrowRight') openLightbox(currentLightboxIndex + 1);
  };
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach(el => observer.observe(el));
}

async function init() {
  try {
    const data = await loadContent();
    renderSite(data);
    renderHeroThumbs(data.gallery || [], data.profile?.photo);
    renderStats(data.stats);
    renderExperience(data.experience);
    renderProjects(data.projects, data.site);
    renderResearch(data.research || [], data.site);
    renderTutorials(data.tutorials || [], data.site);
    renderSkills(data.skills);
    renderGallery(data.gallery || [], data.site);
    renderBlogPreview(data.blogs, data.site);
    renderContact(data);
    initScrollReveal();
  } catch (err) {
    console.error(err);
    document.body.innerHTML = '<p style="padding:2rem;color:#38bdf8;font-family:monospace;">Failed to load portfolio content.</p>';
  }
}

init();
