# Hydra website (Radiant InnovaTech)

The public website for Hydra, the AI security analyst built by Radiant InnovaTech: https://www.radiantinnovatech.com

Hydra was previously called Radiant Nexus. Nothing here is the product itself; the platform lives in the `autonomous-ai-soc-copilot` repository.

## How it is built

The site is static. The text lives in Python files and is turned into HTML. **Edit `site-src/`, never `public-site/` by hand.**

```
site-src/pages.py         page text: home, how it works, security, test results, about, contact, early access, working with us
site-src/legal_pages.py   privacy notice and terms of use (drafts for a Ghanaian lawyer: keep the legal-review marker)
site-src/build_site.py    the builder, the resources and solutions pages, and the switches (forms, analytics)
public-site/              the generated site, plus css/, js/, assets/, llms.txt, robots.txt, sitemap.xml
scripts/check-site.js     the site check
backend/                  the small Node server: form submissions, admin one-time codes, audit log
admin/                    the admin panel for the form submissions
Dockerfile, deploy-gcp.sh builds and deploys one Cloud Run service (project nexus-501421, service radiant-nexus-site)
```

`public-site/llms.txt` is written by hand, not generated. Keep it in step with the pages.

## Change a page

```bash
python3 site-src/build_site.py   # rebuild public-site/
npm run check                    # placeholders, claims, links, structure
```

CI (`.github/workflows/check-site.yml`) runs the same check and the backend tests on every pull request.

## Rules for the text

- Say only what is true today. No customers, no licence, advice-only, lab results only: if a page says something is planned or not done, nothing else on the site may describe it as available. `scripts/check-site.js` enforces part of this.
- When the platform starts sending data somewhere new (a lookup provider, a feed), add it to the privacy notice (section 6) and to the table on the Security page in the same change.
- "Last reviewed ... by Samuel Maclar" is his sign-off. Change it only when he has read the page.

## Run the backend locally

```bash
cd backend && npm install && npm test   # tests use an in-memory store
npm start                               # http://localhost:3000, files from public-site/ and admin/
```

Storage is chosen by `DATA_STORE` (`firestore` in production, `sqlite` locally, `memory` in tests). Forms need `FORMS_ENABLED=true` and `EARLY_ACCESS_ENABLED=true` on the server; the page-side switches are `FORMS_PAUSED` and `EARLY_ACCESS_ENABLED` in `site-src/build_site.py`. Other settings: `JWT_SECRET`, `BREVO_API_KEY`, `SMTP_FROM`, `ADMIN_EMAILS`, `ALLOWED_ORIGINS`, `MATOMO_URL`. Never commit secrets.

Note: `backend/README.md` describes an older server setup (SQLite on a Lightsail server) and is out of date.
