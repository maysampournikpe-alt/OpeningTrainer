// Checks that every line in js/data.js is legal.  Run: node scripts/validate.mjs
import { Chess } from "../js/chess.js";
import { OPENINGS } from "../js/data.js";

let bad = 0, total = 0;
for (const o of OPENINGS) {
  for (const l of o.lines) {
    total++;
    const g = new Chess();
    for (const m of l.moves.split(" ")) {
      try { g.move(m); } catch { console.log(`ILLEGAL  ${o.name} / ${l.name}: ${m}`); bad++; break; }
    }
  }
}
console.log(`${OPENINGS.length} openings, ${total} lines, ${bad} problems`);
process.exit(bad ? 1 : 0);
