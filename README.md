# lunabitlabs.com

The Lunabit Labs website: the studio's home page, the apps, each app's page and
policies, and a blog. Built with [Eleventy](https://www.11ty.dev) and published
to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Working on it

```
npm install          # once
npm start            # preview at http://localhost:8080, updates as you edit
npm run build        # build into _site/
npm run check        # after a build: every link, image and #anchor resolves
```

The deploy runs the same build and check; if the check fails, nothing is
published and the live site stays as it was.

## Where things are

| Address | File |
|---|---|
| `/` | `src/index.njk` |
| `/apps/` | `src/apps/index.njk` |
| `/<app>/` | `src/<app>/index.njk` (Tiqan: `src/tiqan/index.html`) |
| `/<app>/privacy/` | `src/<app>/privacy.njk` (Tiqan: `src/tiqan/privacy/index.html`) |
| `/thaqib/terms/` | `src/thaqib/terms.njk` |
| `/privacy/` | `src/privacy.njk`, every app's policy |
| `/blog/` | `src/blog/index.njk`, posts in `src/blog/posts/` |

- **Every app's name, subtitle, platforms, App Store ID and colours** are in
  `src/_data/apps.json`. The home page, the apps page and the footer read it.
  Add an app there, then give it a folder like `src/miqat/`.
- **Shared look:** `src/assets/css/site.css`, and the layouts in
  `src/_includes/layouts/` (`base` for every page, `app` for an app's page,
  `policy` for privacy and terms, `post` for the blog).
- **Tiqan** keeps its own hand-made page: everything in `src/tiqan/` is
  published exactly as written, without the shared layout.
- **Policies** were moved from the old one-page sites word for word. When an
  app's policy changes, change it here and in the app (Thaqib also shows its
  terms and policy inside the app, in `LegalDocuments.swift`).

## Writing a blog post

Copy `src/blog/posts/2026-10-20-example.md`, name it with the date and a short
title (`2026-11-02-miqat-2-3.md`), set the title and description, delete
`draft: true`, and write in Markdown. It's published at `/blog/miqat-2-3/`.
The Blog link appears in the menu once there's a published post. The feed is
at `/blog/feed.xml`.

## Addresses that must keep working

Shipped apps and App Store listings link to these, so they're checked on every
deploy (`scripts/check.mjs`):

- `/thaqib/#terms`, `#terms-ar`, `#privacy`, `#privacy-ar` (Thaqib's App Store
  description) are forwarded by a script on `/thaqib/` to the terms and privacy
  pages.
- `lunabitlabs.github.io/<anything>` forwards to `lunabitlabs.com/<anything>`
  (GitHub does this).
- `/Miqat/` and `/Miqdar/` (the old sites; addresses are case-sensitive) are
  forwarded to `/miqat/privacy/` and `/miqdar/privacy/`, by the old repos while
  they're published, and by `src/404.njk` after.
- `tiqan.app` and `www.tiqan.app`, including `/privacy` and `/privacy.html`,
  forward to `/tiqan/` from the `lunabitlabs/tiqan.app` repo. Keep the
  tiqan.app domain renewed: the Tiqan app links to it.
