# Albedo restart handoff — 9 November 2026

User requested a Git update and restart during final responsive checks.

## Current state

- Repository: https://github.com/xuen00915/albedodesign, branch `main`.
- Restart save uses the GitHub connector because this session cannot write local `.git`. Local HEAD remains at `4b8dfa5`; working files contain the saved changes. After restart, fetch and compare the remote commit to these files before synchronizing Git metadata. Do not discard these files or blindly pull over the untracked additions.
- App directory: `albedo-landed-lp`.
- WordPress review draft: https://albedodesign.com.sg/?page_id=10993&preview=true (WordPress login required).
- Draft 10993 uses copied form 10992, saved shortcode hash `ef39ba3`.
- Installed and local asset release: `280550199669`.
- The form reference and styling are fixed and desktop-verified. The existing published page 10972 and original form 10973 were not changed by this work. Nothing was published.
- Local release archive is generated and ignored by Git; recreate with `npm run build:wordpress`.
- All 42 tests passed; PHP syntax checks passed. No test lead was sent.

## Resume here

1. Read `albedo-landed-lp/wordpress/PUBLISH.md` for installation details, backups and publication checks.
2. Reopen the review draft and finish visual checks at 390px phone and 768px tablet, including lower sections, sticky contact bar, form focus, project details and FAQ. Desktop hero/form and a 722px stacked view were inspected; full responsive QA is incomplete.
3. Chrome DevTools was left in responsive mode during dimension adjustment. Restore sensible dimensions (390 x 844) before inspecting; the height control was blank at interruption. No page content edits are pending in the browser.
4. Confirm final imagery/copy and the form recipient/delivery before publishing. Do not run the original importer again: it creates another draft/form.
5. For future changes, back up the current page metadata, build a new version, replace only asset URL prefixes inside decoded widget fields, preserve the saved form shortcode, and clear the draft Elementor caches.

## Access

Main site is `albedodesign.com.sg`, not the commercial subdomain. cPanel session was restored and Softaculous's main-installation Login restored WordPress access. Sessions may expire after restart. No credentials or authenticated session URLs are recorded here.

## Commands

```sh
cd albedo-landed-lp
npm run build:wordpress
npm test
php -l wordpress/import-draft.php
php -l wordpress/repair-review-form.php
```
