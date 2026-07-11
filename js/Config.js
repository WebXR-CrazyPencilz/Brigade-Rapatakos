/**
 * config.js
 * ─────────────────────────────────────────────────────────────
 * Central configuration for the lead collection system.
 *
 * Every other file (lead.js) reads its settings from here.
 * Never hardcode the Web App URL or secret key anywhere else —
 * if either value changes, this is the only file that needs editing.
 *
 * Load this file BEFORE lead.js:
 *   <script src="js/config.js"></script>
 *   <script src="js/lead.js"></script>
 * ─────────────────────────────────────────────────────────────
 */
const CONFIG = {
  // Paste your deployed Google Apps Script Web App URL here.
  // Apps Script editor → Deploy → New deployment → Web app → Copy URL
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbxxoaGZWnBpWzP6DOgIq_ToKR9HK-c3pwko4osi6EX1UBd3NfAI8lJfkzBzeZTqO7sYPQ/exec",

  // Must exactly match the SECRET_KEY constant in Code.gs.
  // This is a shared-secret check (keeps random bots off the endpoint),
  // not real authentication — don't treat it as a security boundary on
  // its own. Rotate it if it's ever exposed alongside write access.
  SECRET_KEY: "zxcvbnm"
};