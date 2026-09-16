# Majestic Template — Source Code Snapshot

Site of origin: https://majestic-template.thedigitalyes.com

This archive contains the **complete deployed source** of the site as it exists on the live server today.

## Files

```
.
├── index.html        # HTML entry point (mounts the React app on #root)
├── bundle.js         # Prettified production JS bundle (React + app code)
├── styles.css        # Prettified production CSS bundle (Tailwind + custom)
├── assets/           # 28 static assets (images, video, audio)
└── README.md         # This file
```

## Important notes

1. **This is a production build, not the original repo.** The site is a Vite + React
   app published through Lovable. The original `.jsx`/`.tsx` component files are
   not exposed on the server — only the compiled, minified bundle is. The bundle
   has been **prettified** (via Prettier) so it is human-readable, but variable
   names remain minified (e.g. `Wg`, `sd`, `C`) and there are no source maps
   available on the host.

2. **No sourcemaps exist.** We probed `/assets/index-*.js.map` and
   `/assets/index-*.css.map` — both return HTTP 404. The original JSX/TSX source
   is therefore not recoverable from the server alone.

3. **Analytics scripts removed.** The live `<head>` includes two Lovable
   analytics snippets (`/~flock.js` and `/__l5e/events.js`). They are not part
   of the application code and have been omitted. If you need them, fetch them
   directly from the live URL.

4. **Asset filenames are content-hashed** by Vite (e.g.
   `couple-dancing-D8lPNoP4.png`). The bundle references them by these exact
   names, so don't rename anything or the app won't load.

## How to run it locally

## RSVP responses

Open `responses.html` on the same static host as `index.html` to view submitted
RSVPs. Anyone with the page link can view responses without signing in.
The page reads `wedding_rsvp_responses` in your Supabase project
`jcuqwcwkowtjxcykstlf` and shows only rows with a
`responded_at` timestamp. Search, attendance filters, party totals, companion
details, and automatic refresh every 30 seconds are included.

Both pages use `supabase-config.js` for your project URL, public publishable key,
and RSVP table name. Guest submissions use the original form and save logic,
with a separate Supabase client for the new wedding table. The original
database remains intact; unrelated FAQ and legacy admin queries retain their
original connection. Old RSVP records are not migrated or modified.

`supabase/wedding-rsvp.sql` records the setup applied to the new table only.
Row-level security permits public reads, submissions, and updates so guests can
revise their RSVP as before. Public deletion is not granted. The script fails
if the table already exists, preventing accidental modification on reruns.
Never place a Supabase secret or service-role key in these browser files.

### Local server

It's a static site — any static file server will work:

```bash
# from this directory
python3 -m http.server 8080
# then open http://localhost:8080
```

Or with Node:

```bash
npx serve .
```

Note: the bundle uses ES module syntax (`<script type="module">`), so you **must**
serve it over HTTP(S) — opening `index.html` via `file://` will not work because
browsers block module imports from the file protocol.

## What's inside the bundle

Searching the prettified bundle reveals this is a **wedding invitation site**
with sections for:

- Intro video + music (`intro-video.mp4`, `intro-music.mp3`)
- Hero with background video (`hero-bg-l.mp4`)
- Couple photo, monogram "M&J", ornate frame
- Story / timeline section
- Ceremony & venue at Finca Biniagual (Mallorca)
- Dress code, accommodation, transport (bus) icons
- Mallorca illustrated map
- RSVP form (with `rsvp-confirmation.webm` success animation)
- Footer with string-lights ornament

The app is built with **React + React Router + Tailwind CSS + Framer Motion**
and uses Google Fonts via Adobe Typekit (`use.typekit.net/dup6afg.css`).
