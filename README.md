# Darul Qur'an Purakkad

Static landing site for Darul Qur'an Purakkad (HTML + assets only).

## Project structure
- index.html: main page
- assets/: static images
- netlify.toml: Netlify config for static hosting, SPA fallback, caching
- .netlify/: Netlify CLI state (ignored)
- Canonical/OG meta in `index.html` points to `https://darulquranpurakkad.netlify.app/`; update if you use a custom domain.

## Deploy on Netlify (dashboard)
1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify, choose "Add new site" -> "Import an existing project" and pick the repo.
3. Build command: leave blank. Publish directory: `.`
4. Deploy and set a custom domain if you have one.
5. Update the `canonical` and `og:url` meta tags in `index.html` to the Netlify/custom domain you choose.

## Deploy with Netlify CLI
1. Install CLI: `npm install -g netlify-cli`
2. `netlify init` (creates/links a site)
3. Preview: `netlify deploy --dir .`
4. Production: `netlify deploy --dir . --prod`

## Local preview
- `netlify dev --dir .` serves the static files using the config in `netlify.toml`.
