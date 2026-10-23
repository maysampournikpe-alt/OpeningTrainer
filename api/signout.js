import { method, clearSession } from "./_lib.js";

export default function handler(req, res) {
  if (!method(req, res, "POST")) return;
  clearSession(res);
  res.status(200).json({ ok: true });
}
