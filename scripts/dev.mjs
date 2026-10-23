// Tiny local server: static files + the api/ functions, with Vercel-style req/res helpers.
// Without BLOB_READ_WRITE_TOKEN, data is stored as JSON files under .data/.
// Run: SESSION_SECRET=anything node scripts/dev.mjs   (or: npm run dev)
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
process.env.SESSION_SECRET ||= "dev-only-secret";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname.startsWith("/api/")) {
    const file = path.join(root, url.pathname + ".js");
    if (path.basename(file).startsWith("_") || !(await fs.stat(file).catch(() => null))) { res.statusCode = 404; return res.end("not found"); }
    let raw = ""; for await (const c of req) raw += c;
    try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = undefined; }
    res.status = c => { res.statusCode = c; return res; };
    res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
    return (await import(pathToFileURL(file))).default(req, res);
  }
  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const f = path.join(root, path.normalize(rel));
    if (!f.startsWith(root)) throw 0;
    res.setHeader("Content-Type", types[path.extname(f)] || "application/octet-stream");
    res.end(await fs.readFile(f));
  } catch { res.statusCode = 404; res.end("not found"); }
}).listen(port, () => console.log("http://localhost:" + port));
