// Plain board renderer using unicode chess pieces.
const GLYPH = { p: "♟︎", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };

export function renderBoard(el, fen, opts = {}) {
  const { orientation = "white", last = [], selected = null, targets = [], hint = [], onSquare = null } = opts;
  const rows = fen.split(" ")[0].split("/");
  const grid = {};
  rows.forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += +ch; continue; }
      grid["abcdefgh"[f] + (8 - i)] = ch; f++;
    }
  });
  const files = orientation === "white" ? "abcdefgh" : "hgfedcba";
  const ranks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  el.classList.add("board");
  el.innerHTML = "";
  for (const r of ranks) {
    for (const f of files) {
      const sq = f + r;
      const d = document.createElement("div");
      const light = (f.charCodeAt(0) - 97 + r) % 2 === 0;
      d.className = "sq " + (light ? "l" : "d");
      d.dataset.sq = sq;
      if (last.includes(sq)) d.classList.add("last");
      if (selected === sq) d.classList.add("sel");
      if (hint.includes(sq)) d.classList.add("hint");
      if (targets.includes(sq)) { d.classList.add("tgt"); if (grid[sq]) d.classList.add("cap"); }
      if (f === files[0]) { const s = document.createElement("span"); s.className = "c r"; s.textContent = r; d.appendChild(s); }
      if (r === ranks[7]) { const s = document.createElement("span"); s.className = "c f"; s.textContent = f; d.appendChild(s); }
      const p = grid[sq];
      if (p) {
        const s = document.createElement("span");
        s.className = "pc " + (p === p.toUpperCase() ? "w" : "b");
        s.textContent = GLYPH[p.toLowerCase()];
        d.appendChild(s);
      }
      if (onSquare) d.addEventListener("click", () => onSquare(sq));
      el.appendChild(d);
    }
  }
}
