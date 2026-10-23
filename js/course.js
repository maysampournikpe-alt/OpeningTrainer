import { OPENINGS } from "./data.js";
import { getProgress, currentUser } from "./auth.js";

const id = new URLSearchParams(location.search).get("id");
const o = OPENINGS.find(x => x.id === id);
const root = document.getElementById("course");

if (!o) {
  root.innerHTML = `<h1>Course not found</h1><p><a href="/">Back to all openings</a></p>`;
} else {
  document.title = o.name + " - Rookery";
  const done = getProgress()[o.id] || {};
  const count = Object.keys(done).length;
  root.innerHTML = `
    <div class="crumbs"><a href="/">Openings</a> / ${o.name}</div>
    <h1>${o.name}</h1>
    <p class="sub">${o.blurb} You play ${o.side}.${currentUser() ? ` ${count} of ${o.lines.length} lines done.` : ` <a href="/signup.html">Sign up</a> to track which lines you have learned.`}</p>
    <ol class="lines">
      ${o.lines.map((l, i) => `
        <li>
          <span class="n">${i + 1}.</span>
          <span class="t"><a href="/train.html?c=${o.id}&l=${i}">${l.name}</a> ${done[i] ? '<span class="tick">&#10003; done</span>' : ""}
            <small>${l.note}</small>
            <code>${l.moves.split(" ").length} moves</code></span>
          <a class="btn" href="/train.html?c=${o.id}&l=${i}">Practice</a>
        </li>`).join("")}
    </ol>`;
}
