import { method, fail, normEmail, userKey, hashPassword, writeJSON, Conflict, setSession } from "./_lib.js";

export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  try {
    const { name, email: rawEmail, password } = req.body || {};
    const email = normEmail(rawEmail);
    const nm = String(name || "").trim();
    if (!nm || nm.length > 30) return res.status(400).json({ error: "Please enter a username (30 characters or fewer)." });
    if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "That email address doesn't look right." });
    if (typeof password !== "string" || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    if (password.length > 200) return res.status(400).json({ error: "Password is too long." });

    const { salt, hash } = await hashPassword(password);
    try {
      await writeJSON(userKey(email), { name: nm, email, salt, hash, created: Date.now() }, { create: true });
    } catch (e) {
      if (e instanceof Conflict) return res.status(409).json({ error: "There's already an account with that email. Try signing in." });
      throw e;
    }
    setSession(res, email);
    res.status(200).json({ user: { name: nm, email } });
  } catch (e) { fail(res, e); }
}
