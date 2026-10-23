# Rookery

A small, plain site for learning chess openings, in the spirit of chessreps.com.
20 openings, 72 lines. Pick a course, then Study a line move by move or Practice it from memory.

- Static site, no build step. Plain HTML, CSS and ES modules.
- Board logic: [chess.js](https://github.com/jhlywa/chess.js) (vendored in `js/chess.js`).
- Opening data lives in `js/data.js`. Run `node scripts/validate.mjs` after editing it to check every line is legal.
- Accounts and progress are stored on the server so they sync across devices:
  - `api/*.js` are Vercel serverless functions (sign up, sign in, sign out, session, progress).
  - Data lives in a private Vercel Blob store (`users/<hash>.json`, `progress/<hash>.json`).
  - Passwords are hashed with scrypt. The session is an HMAC-signed HttpOnly cookie.
  - Needs two env vars on the Vercel project: `BLOB_READ_WRITE_TOKEN` (added when the Blob store is
    connected) and `SESSION_SECRET` (any long random string).

## Run locally

    npm install
    npm run dev          # http://localhost:3000, stores accounts as files in .data/

## Deploy

Import the repo in Vercel. Framework preset "Other", no build command, output directory is the root.
