# Rookery

A small, plain site for learning chess openings, in the spirit of chessreps.com.
20 openings, 72 lines. Pick a course, then Study a line move by move or Practice it from memory.

- Static site, no build step. Plain HTML, CSS and ES modules.
- Board logic: [chess.js](https://github.com/jhlywa/chess.js) (vendored in `js/chess.js`).
- Opening data lives in `js/data.js`. Run `node scripts/validate.mjs` after editing it to check every line is legal.
- Sign up / sign in is stored in the browser's localStorage (salted SHA-256), so accounts and
  progress are per-browser. Swap `js/auth.js` for a real backend (Supabase, Clerk, etc.) if you
  want accounts that follow people across devices.

## Run locally

    python3 -m http.server 8000

## Deploy

Import the repo in Vercel. Framework preset "Other", no build command, output directory is the root.
