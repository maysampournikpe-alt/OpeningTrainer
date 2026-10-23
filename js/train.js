import { Chess } from "./chess.js";
import { OPENINGS } from "./data.js";
import { renderBoard } from "./board.js";
import { markLineDone, currentUser } from "./auth.js";

const params = new URLSearchParams(location.search);
const o = OPENINGS.find(x => x.id === params.get("c"));
const li = Number(params.get("l") || 0);
const line = o && o.lines[li];
const root = document.getElementById("train");

if (!line) {
  root.innerHTML = `<h1>Line not found</h1><p><a href="/">Back to all openings</a></p>`;
} else {
  document.title = `${line.name} - ${o.name} - Rookery`;
  const moves = line.moves.split(" ");
  const mine = o.side === "white" ? 0 : 1; // my moves are at plies with this parity

  root.innerHTML = `
    <div class="crumbs"><a href="/">Openings</a> / <a href="/course.html?id=${o.id}">${o.name}</a> / ${line.name}</div>
    <div class="trainer">
      <div id="board"></div>
      <div class="panel">
        <h2>${line.name}</h2>
        <div class="note">${line.note}</div>
        <div class="row tabs">
          <button data-mode="practice" class="on">Practice</button>
          <button data-mode="study">Study</button>
        </div>
        <div class="status" id="status"></div>
        <div class="moves" id="moves"></div>
        <div class="row" id="controls"></div>
      </div>
    </div>`;

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const movesEl = document.getElementById("moves");
  const controlsEl = document.getElementById("controls");

  let mode = "practice";
  let game, ply, selected, hint, mistakes, finished, last, busy;

  function reset() {
    game = new Chess(); ply = 0; selected = null; hint = []; mistakes = 0; finished = false; last = []; busy = false;
    draw();
    if (mode === "practice") {
      if (mine === 1) setStatus("You play Black. White moves first...");
      else setStatus("You play White. Make the first move.");
      opponentIfNeeded();
    } else {
      setStatus("Use the buttons to step through the line.");
    }
  }

  function setStatus(msg, kind = "") { statusEl.textContent = msg; statusEl.className = "status " + kind; }

  function playSan(san) {
    const m = game.move(san);
    last = [m.from, m.to];
    ply++;
    return m;
  }

  function opponentIfNeeded() {
    if (mode !== "practice" || finished) return;
    if (ply >= moves.length) return finish();
    if (ply % 2 !== mine) {
      busy = true;
      setTimeout(() => {
        playSan(moves[ply]);
        busy = false;
        draw();
        if (ply >= moves.length) finish();
        else setStatus("Your move.");
      }, 450);
    }
  }

  function finish() {
    finished = true;
    const saved = markLineDone(o.id, li, mistakes);
    setStatus(
      `Line complete${mistakes ? ` with ${mistakes} mistake${mistakes > 1 ? "s" : ""}` : " with no mistakes"}.` +
      (saved ? " Saved to your progress." : " Sign in to save your progress."), "good");
    draw();
  }

  function onSquare(sq) {
    if (mode !== "practice" || finished || busy || ply % 2 !== mine) return;
    const colour = o.side === "white" ? "w" : "b";
    const piece = game.get(sq);
    if (selected) {
      const legal = game.moves({ square: selected, verbose: true }).find(m => m.to === sq);
      if (legal) return tryMove(selected, sq);
    }
    if (piece && piece.color === colour) selected = selected === sq ? null : sq;
    else selected = null;
    hint = [];
    draw();
  }

  function tryMove(from, to) {
    const m = game.move({ from, to, promotion: "q" });
    if (m.san === moves[ply]) {
      last = [m.from, m.to]; ply++; selected = null; hint = [];
      draw();
      if (ply >= moves.length) finish();
      else { setStatus("Good. Waiting for the reply...", "good"); opponentIfNeeded(); }
    } else {
      game.undo();
      mistakes++; selected = null; hint = [];
      setStatus(`${m.san} is a legal move, but it is not the move in this line. Try again.`, "bad");
      draw();
    }
  }

  function showHint() {
    if (mode !== "practice" || finished || busy || ply % 2 !== mine) return;
    const probe = new Chess(game.fen());
    const m = probe.move(moves[ply]);
    hint = hint.length === 0 ? [m.from] : [m.from, m.to];
    setStatus(hint.length === 1 ? "That piece moves. Press Hint again to see where." : `The move is ${moves[ply]}.`);
    draw();
  }

  function stepTo(n) {
    game = new Chess();
    last = [];
    for (let i = 0; i < n; i++) { const m = game.move(moves[i]); last = [m.from, m.to]; }
    ply = n;
    draw();
  }

  function draw() {
    const targets = selected ? game.moves({ square: selected, verbose: true }).map(m => m.to) : [];
    renderBoard(boardEl, game.fen(), {
      orientation: o.side, last, selected, targets, hint,
      onSquare: mode === "practice" ? onSquare : null,
    });
    // move list
    let html = "";
    moves.forEach((m, i) => {
      if (i % 2 === 0) html += `<span class="num">${i / 2 + 1}.</span>`;
      const shown = i < ply;
      const text = mode === "practice" && !shown ? "?" : m;
      html += `<span class="${i === ply - 1 ? "cur" : ""}">${shown || mode === "study" ? m : text}</span> `;
    });
    movesEl.innerHTML = html;
    // buttons
    controlsEl.innerHTML = "";
    const add = (label, fn, cls = "", disabled = false) => {
      const b = document.createElement("button");
      b.textContent = label; if (cls) b.className = cls; b.disabled = disabled;
      b.addEventListener("click", fn); controlsEl.appendChild(b);
    };
    if (mode === "practice") {
      add("Hint", showHint, "", finished);
      add("Restart", reset);
    } else {
      add("Back", () => stepTo(Math.max(0, ply - 1)), "", ply === 0);
      add("Next", () => stepTo(Math.min(moves.length, ply + 1)), "primary", ply >= moves.length);
      add("Start", () => stepTo(0), "", ply === 0);
    }
    if (li + 1 < o.lines.length) add("Next line", () => { location.href = `/train.html?c=${o.id}&l=${li + 1}`; });
    else add("Back to course", () => { location.href = `/course.html?id=${o.id}`; });
  }

  document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("on", x === b));
    reset();
    if (mode === "study") stepTo(0);
  }));

  reset();
}
