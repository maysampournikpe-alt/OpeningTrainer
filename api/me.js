import { method, fail, sessionEmail, userKey, progressKey, readJSON, clearSession } from "./_lib.js";

// Who am I, and what have I learned?  Called once when a page loads.
export default async function handler(req, res) {
  if (!method(req, res, "GET")) return;
  res.setHeader("Cache-Control", "no-store");
  try {
    const email = sessionEmail(req);
    const user = email && await readJSON(userKey(email));
    if (!user) { if (email) clearSession(res); return res.status(200).json({ user: null }); }
    const prog = await readJSON(progressKey(email));
    res.status(200).json({ user: { name: user.data.name, email }, progress: prog ? prog.data : {} });
  } catch (e) { fail(res, e); }
}
