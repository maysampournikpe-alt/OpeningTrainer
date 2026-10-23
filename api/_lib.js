// Shared helpers for the API functions. Files starting with "_" are not routed by Vercel.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { put, get, BlobPreconditionFailedError } from "@vercel/blob";

const COOKIE = "rk_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ---------- storage ----------
// Production: a private Vercel Blob store (BLOB_READ_WRITE_TOKEN is set by Vercel).
// Local dev without a token: JSON files under .data/ (see scripts/dev.mjs).
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const DATA_DIR = path.join(process.cwd(), ".data");

export class Conflict extends Error {}

// returns { data, etag } or null
export async function readJSON(key) {
  if (useBlob) {
    const r = await get(key, { access: "private", useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return { data: JSON.parse(await new Response(r.stream).text()), etag: r.blob.etag };
  }
  try {
    const text = await fs.readFile(path.join(DATA_DIR, key), "utf8");
    return { data: JSON.parse(text), etag: crypto.createHash("md5").update(text).digest("hex") };
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

// create: fail with Conflict if it already exists.  ifMatch: fail with Conflict if etag changed.
export async function writeJSON(key, data, { create = false, ifMatch } = {}) {
  const body = JSON.stringify(data);
  if (useBlob) {
    try {
      await put(key, body, {
        access: "private", contentType: "application/json", addRandomSuffix: false,
        ...(ifMatch ? { ifMatch } : { allowOverwrite: !create }),
      });
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError || /already exists/i.test(e.message)) throw new Conflict();
      // don't rely on the wording of the error: if we were creating and the blob is there, it's a conflict
      if (create && await readJSON(key).catch(() => null)) throw new Conflict();
      throw e;
    }
    return;
  }
  const file = path.join(DATA_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const cur = await readJSON(key);
  if (create && cur) throw new Conflict();
  if (ifMatch && (!cur || cur.etag !== ifMatch)) throw new Conflict();
  await fs.writeFile(file, body);
}

// ---------- users / passwords ----------
export const normEmail = e => String(e || "").trim().toLowerCase();
export const userKey = email => "users/" + crypto.createHash("sha256").update(email).digest("hex") + ".json";
export const progressKey = email => "progress/" + crypto.createHash("sha256").update(email).digest("hex") + ".json";

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (err, key) => err ? reject(err) : resolve({ salt, hash: key.toString("hex") })));
}

export async function checkPassword(user, password) {
  const { hash } = await hashPassword(password, user.salt);
  const a = Buffer.from(hash, "hex"), b = Buffer.from(user.hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------- session cookie (HMAC-signed, HttpOnly) ----------
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}
const b64 = s => Buffer.from(s).toString("base64url");
const sign = body => crypto.createHmac("sha256", secret()).update(body).digest("base64url");

export function setSession(res, email) {
  const body = b64(JSON.stringify({ e: email, exp: Date.now() + MAX_AGE * 1000 }));
  const secure = process.env.VERCEL ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE}=${body}.${sign(body)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`);
}

export function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// returns the signed-in email, or null
export function sessionEmail(req) {
  const m = /(?:^|;\s*)rk_session=([^;]+)/.exec(req.headers.cookie || "");
  if (!m) return null;
  const [body, sig] = m[1].split(".");
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body)), got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p.e : null;
  } catch { return null; }
}

// ---------- request helpers ----------
export function method(req, res, allowed) {
  if (req.method !== allowed) { res.setHeader("Allow", allowed); res.status(405).json({ error: "Method not allowed" }); return false; }
  // JSON-only POSTs: a cross-site form can't send this content type, which blocks simple CSRF
  if (allowed === "POST" && !String(req.headers["content-type"] || "").includes("application/json")) {
    res.status(415).json({ error: "Expected JSON" }); return false;
  }
  return true;
}

export function fail(res, e) {
  console.error(e);
  res.status(500).json({ error: "Something went wrong on our side. Please try again." });
}
