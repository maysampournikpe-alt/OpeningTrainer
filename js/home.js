import { Chess } from "./chess.js";
import { OPENINGS } from "./data.js";
import { renderBoard } from "./board.js";
import { getProgress } from "./auth.js";

const grid = document.getElementById("grid");
const none = document.getElementById("none");
const q = document.getElementById("q");
const progress = getProgress();
let filter = "all";

// small board for each card: the position a few moves into the first line
function thumbFen(o) {
  const g = new Chess();
  o.lines[0].moves.split(" ").slice(0, 6).forEach(m => g.move(m));
  return g.fen();
}

function draw() {
  const text = q.value.trim().toLowerCase();
  const list = OPENINGS.filter(o =>
    (filter === "all" || o.side === filter) &&
    (!text || (o.name + " " + o.blurb + " " + o.lines.map(l => l.name).join(" ")).toLowerCase().includes(text)));
  grid.innerHTML = "";
  none.hidden = list.length > 0;
  for (const o of list) {
    const a = document.createElement("a");
    a.className = "card";
    a.href = "/course.html?id=" + o.id;
    const done = progress[o.id] || {};
    a.innerHTML = `
      <div class="thumb"></div>
      <div>
        <h3>${o.name}</h3>
        <p>${o.blurb}</p>
        <div class="meta">Play as ${o.side} &middot; ${o.lines.length} lines</div>
        <div class="bar">${o.lines.map((_, i) => `<i class="${done[i] ? "done" : ""}"></i>`).join("")}</div>
      </div>`;
    renderBoard(a.querySelector(".thumb"), thumbFen(o), { orientation: o.side });
    grid.appendChild(a);
  }
}

q.addEventListener("input", draw);
document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => {
  filter = b.dataset.f;
  document.querySelectorAll(".seg button").forEach(x => x.classList.toggle("on", x === b));
  draw();
}));
draw();
