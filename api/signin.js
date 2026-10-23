import { method, fail, normEmail, userKey, readJSON, checkPassword, setSession } from "./_lib.js";

export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  try {
    const { email: rawEmail, password } = req.body || {};
    const email = normEmail(rawEmail);
    const found = email && typeof password === "string" && password.length <= 200 ? await readJSON(userKey(email)) : null;
    if (!found || !(await checkPassword(found.data, password))) {
      return res.status(401).json({ error: "Wrong email or password." });
    }
    setSession(res, email);
    res.status(200).json({ user: { name: found.data.name, email } });
  } catch (e) { fail(res, e); }
}
