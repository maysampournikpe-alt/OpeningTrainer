import { signUp, signIn } from "./auth.js";

const f = document.getElementById("f");
const err = document.getElementById("err");
const isSignup = !!document.getElementById("name");

f.addEventListener("submit", async e => {
  e.preventDefault();
  err.textContent = "";
  const email = document.getElementById("email").value;
  const pw = document.getElementById("pw").value;
  try {
    if (isSignup) await signUp(document.getElementById("name").value, email, pw);
    else await signIn(email, pw);
    location.href = "/";
  } catch (ex) {
    err.textContent = ex.message;
  }
});
