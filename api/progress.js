import { OPENINGS } from "../js/data.js";
import { method, fail, sessionEmail, progressKey, readJSON, writeJSON, Conflict } from "./_lib.js";

// Record that a line was completed.  Body: { openingId, lineIndex, mistakes }
export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  try {
    const email = sessionEmail(req);
    if (!email) return res.status(401).json({ error: "Please sign in." });

    const { openingId, lineIndex, mistakes } = req.body || {};
    const opening = OPENINGS.find(o => o.id === openingId);
    if (!opening || !Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= opening.lines.length) {
      return res.status(400).json({ error: "Unknown line." });
    }
    const m = Number.isInteger(mistakes) && mistakes >= 0 ? Math.min(mistakes, 999) : 0;

    // read-modify-write with an ETag check so two devices finishing lines at once don't lose one
    for (let attempt = 0; attempt < 4; attempt++) {
      const cur = await readJSON(progressKey(email));
      const data = cur ? cur.data : {};
      data[openingId] = data[openingId] || {};
      data[openingId][lineIndex] = { mistakes: m, at: Date.now() };
      try {
        await writeJSON(progressKey(email), data, cur ? { ifMatch: cur.etag } : { create: true });
        return res.status(200).json({ progress: data });
      } catch (e) {
        if (!(e instanceof Conflict)) throw e;
      }
    }
    res.status(409).json({ error: "Could not save, please try again." });
  } catch (e) { fail(res, e); }
}
