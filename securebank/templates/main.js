/* =============================================================
   SecureBank — main.js
   Purpose: purely cosmetic / ergonomic JS.
   ⚠️  This file does NOT fix any server-side vulnerabilities.
       - Username enumeration via different error messages is
         intentionally left in the server handler.
       - No rate-limiting or lockout is added here.
       The client-side validation below only improves UX; it can
       be trivially bypassed (e.g. curl / Burp) and must NOT be
       considered a security measure.
   ============================================================= */

(function () {
  "use strict";

  /* ── Burger menu (mobile) ──────────────────────────────────── */
  const burger = document.querySelector(".navbar__burger");
  const links  = document.querySelector(".navbar__links");

  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open);
    });

    // Close menu when a link is clicked
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", false);
      })
    );

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!burger.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove("open");
        burger.classList.remove("open");
      }
    });
  }

  /* ── Active nav link highlight ─────────────────────────────── */
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".navbar__links a").forEach((a) => {
    const href = a.getAttribute("href").replace(/\/$/, "") || "/";
    if (href === currentPath) a.classList.add("active");
  });

  /* ── Password show / hide toggle ───────────────────────────── */
  document.querySelectorAll(".field-password-wrap").forEach((wrap) => {
    const input  = wrap.querySelector("input[type=password], input[type=text]");
    const toggle = wrap.querySelector(".toggle-pw");
    if (!input || !toggle) return;

    toggle.addEventListener("click", () => {
      const isHidden = input.type === "password";
      input.type     = isHidden ? "text" : "password";
      toggle.textContent = isHidden ? "Hide" : "Show";
    });
  });

  /* ── Client-side form validation ───────────────────────────── */
  /*
   * ⚠️  SECURITY NOTE:
   * This validation runs in the browser and can be bypassed at any
   * time by an attacker using curl, Python requests, Burp Suite, etc.
   * It does NOT prevent brute-force or enumeration attacks.
   * The server-side vulnerability (no rate-limiting, different error
   * messages) is intentionally preserved for the CTF/lab exercise.
   */
  document.querySelectorAll("form.auth-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      let valid = true;

      form.querySelectorAll(".field[data-required]").forEach((field) => {
        const input     = field.querySelector("input");
        const errorEl   = field.querySelector(".field-error");
        const isEmpty   = !input || input.value.trim() === "";

        field.classList.toggle("has-error", isEmpty);
        if (isEmpty) valid = false;

        // Clear error once the user starts typing
        if (input) {
          input.addEventListener("input", () => field.classList.remove("has-error"), { once: true });
        }
      });

      if (!valid) {
        e.preventDefault();

        // Show / create a top-level banner if it doesn't already exist
        let banner = form.querySelector(".js-validation-banner");
        if (!banner) {
          banner = document.createElement("div");
          banner.className = "alert alert-error js-validation-banner";
          banner.innerHTML = '<span class="alert-icon">⚠</span> Please fill in all fields.';
          form.prepend(banner);
        }
        banner.style.display = "flex";
      }
    });
  });

  /* ── Dismiss existing server-rendered alerts on click ──────── */
  document.querySelectorAll(".alert").forEach((alert) => {
    alert.style.cursor = "pointer";
    alert.title = "Click to dismiss";
    alert.addEventListener("click", () => {
      alert.style.transition = "opacity .2s ease";
      alert.style.opacity    = "0";
      setTimeout(() => alert.remove(), 220);
    });
  });

  /* ── Smooth card entrance (respects prefers-reduced-motion) ── */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".card, .about-card").forEach((el) => {
      el.style.opacity   = "1";
      el.style.animation = "none";
    });
  }

})();
