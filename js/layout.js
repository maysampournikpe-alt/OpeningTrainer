import { currentUser, signOut } from "./auth.js";

const user = currentUser();
const nav = user
  ? `<span>${esc(user.name)}</span> <a href="#" id="out">Sign out</a>`
  : `<a href="/signin.html">Sign in</a> <a class="btn primary" href="/signup.html">Sign up</a>`;

document.getElementById("header").outerHTML = `
<header class="site"><div class="wrap">
  <a class="brand" href="/"><img src="/logo.svg" alt="">Rookery</a>
  <nav><a class="hide-sm" href="/">Openings</a>${nav}</nav>
</div></header>`;

document.getElementById("footer").outerHTML = `
<footer class="site"><div class="wrap">Rookery: learn your chess openings, one line at a time.</div></footer>`;

document.getElementById("out")?.addEventListener("click", e => { e.preventDefault(); signOut(); location.href = "/"; });

function esc(s) { return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
