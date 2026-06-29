# Portfolio Website

A developer portfolio inspired by [touhidur.bd](https://touhidur.bd/) with a warm editorial design and an admin panel to manage all static content.

## Features

- **Portfolio site** — Hero, stats, experience, projects, skills, and contact sections
- **Admin panel** — Edit all content through a web UI at `/admin.html`
- **JSON-backed content** — All data stored in `data/content.json`
- **Hardcoded admin credentials** — Simple login for content management

## Quick start

```bash
npm install
npm start
```

- Portfolio: http://localhost:3000
- Admin: http://localhost:3000/admin.html



## Project structure

```
portfolio/
├── server.js           # Express server + admin API
├── data/
│   └── content.json    # All portfolio content
└── public/
    ├── index.html      # Portfolio page
    ├── admin.html      # Admin dashboard
    ├── css/
    └── js/
```

## Customization

Log in to the admin panel and edit:

- **Profile** — Name, title, bio, links, availability
- **Stats** — Key metrics shown in the hero
- **Experience** — Work history with highlights and tech stack
- **Projects** — Open source / side projects
- **Skills** — Languages, backend, databases, cloud, frontend
- **Contact** — Hiring headline and response time

Changes are saved to `data/content.json` and reflected immediately on the public site.

## Deployment

Run with Node.js on any host (Railway, Render, VPS, etc.). Set the `PORT` environment variable if needed.

For a fully static deploy without the admin API, export `content.json` and serve the `public/` folder — but you would lose live admin editing unless you add a separate backend.
"# myportfolio" 
