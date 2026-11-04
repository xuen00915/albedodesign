# Maintain the Albedo landed-home landing page

This repository contains Albedo Design’s landed-home renovation landing page, its Elementor source snippets, automated tests, and GitHub Pages deployment.

- **Live page**: [Albedo landed-home landing page](https://xuen00915.github.io/albedodesign/)
- **Detailed editing guide**: [`albedo-landed-lp/README.md`](albedo-landed-lp/README.md)
- **Elementor installation guide**: [`albedo-landed-lp/elementor/INSTALL-ELEMENTOR.md`](albedo-landed-lp/elementor/INSTALL-ELEMENTOR.md)
- **Unresolved launch content**: [`albedo-landed-lp/docs/placeholders.md`](albedo-landed-lp/docs/placeholders.md)

## Preview the page

Run these commands from the repository root:

```bash
cd albedo-landed-lp
npm install
npx playwright install chromium
npm run build:preview
python3 -m http.server 4187
```

Open `http://localhost:4187/preview/`.

## Make a change

Edit files in `albedo-landed-lp/elementor/`. Do not edit the generated `preview/index.html` or `pages-dist/` output directly.

After editing a section, regenerate and test the page:

```bash
npm run build:pages
npm test
npm run test:browser
git diff --check
```

The browser tests require the local server on port `4187`.

## Deploy the page

Push an approved commit to `main`. The GitHub Actions workflow builds and publishes the GitHub Pages site automatically.

Read the [detailed collaborator guide](albedo-landed-lp/README.md) before changing media, project anchors, form fields, analytics, or the credential strip.
