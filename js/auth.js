// Accounts and progress live on the server (api/*), so they follow you across devices.
// The session is an HttpOnly cookie; this module just asks /api/me who you are once per page load.

async function call(url, body) {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

let state = { user: null, progress: {} };
try { state = { user: null, progress: {}, ...(await call("/api/me")) }; } catch {} // offline or no API: act signed out

export function currentUser() { return state.user; }
export function getProgress() { return state.user ? state.progress : {}; }

export async function signUp(name, email, password) { await call("/api/signup", { name, email, password }); }
export async function signIn(email, password) { await call("/api/signin", { email, password }); }
export async function signOut() { try { await call("/api/signout", {}); } catch {} }

// Returns true if saved to the account, false if signed out or the save failed.
export async function markLineDone(openingId, lineIndex, mistakes) {
  if (!state.user) return false;
  try {
    const r = await call("/api/progress", { openingId, lineIndex, mistakes });
    state.progress = r.progress;
    return true;
  } catch { return false; }
}
