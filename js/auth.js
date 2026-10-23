// Accounts live in this browser's localStorage only (no server).
// That keeps the site fully static on Vercel. Passwords are salted + hashed, but this is
// not real security: anyone with access to the browser can read the data.
const USERS = "rookery.users";
const SESSION = "rookery.session";
const PROGRESS = "rookery.progress.";

const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

async function hash(password, salt) {
  const buf = new TextEncoder().encode(salt + ":" + password);
  const out = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(out)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function currentUser() {
  const email = read(SESSION, null);
  if (!email) return null;
  const u = read(USERS, {})[email];
  return u ? { email, name: u.name } : null;
}

export async function signUp(name, email, password) {
  email = email.trim().toLowerCase();
  name = name.trim();
  if (!name) throw new Error("Please enter a username.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("That email address doesn't look right.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const users = read(USERS, {});
  if (users[email]) throw new Error("There's already an account with that email. Try signing in.");
  const salt = crypto.getRandomValues(new Uint32Array(4)).join("-");
  users[email] = { name, salt, hash: await hash(password, salt), created: Date.now() };
  write(USERS, users);
  write(SESSION, email);
}

export async function signIn(email, password) {
  email = email.trim().toLowerCase();
  const u = read(USERS, {})[email];
  if (!u || u.hash !== await hash(password, u.salt)) throw new Error("Wrong email or password.");
  write(SESSION, email);
}

export function signOut() { try { localStorage.removeItem(SESSION); } catch {} }

// progress: { [openingId]: { [lineIndex]: { mistakes, at } } }
export function getProgress() {
  const u = currentUser();
  return u ? read(PROGRESS + u.email, {}) : {};
}

export function markLineDone(openingId, lineIndex, mistakes) {
  const u = currentUser();
  if (!u) return false;
  const p = read(PROGRESS + u.email, {});
  p[openingId] = p[openingId] || {};
  p[openingId][lineIndex] = { mistakes, at: Date.now() };
  write(PROGRESS + u.email, p);
  return true;
}
