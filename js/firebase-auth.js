// ─────────────────────────────────────────────────────────────────────────────
// firebase-auth.js  —  ARCH Interactive Experience
// ─────────────────────────────────────────────────────────────────────────────
//
// NOTE ON FILENAME:
//   This file is kept as `firebase-auth.js` only to avoid touching any other
//   file's <script> reference. It no longer uses Firebase, OTP, SMS,
//   reCAPTCHA, or any authentication/login concept.
//
// FLOW:
//   Page loads → lead form is shown
//     → user fills in Name / Phone / Email (all required)
//     → on submit, form + device/context data is POSTed to a Google Apps
//       Script Web App, which appends a row to a Google Sheet
//     → on success, the form fades out and the interactive experience starts
//     → on failure, the form stays filled in and a friendly error is shown
//
// GOOGLE SHEETS SETUP (one-time, 5 minutes):
//   1. Create a Google Sheet with these headers in Row 1:
//      Timestamp | Name | Phone | Email |
//      Device | Browser | OS | Screen | Language | Timezone | URL | Referrer
//
//   2. Extensions → Apps Script → paste this exact code:
//
//      function doPost(e) {
//        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//        var data  = JSON.parse(e.postData.contents);
//        sheet.appendRow([
//          data.timestamp,
//          data.name,
//          data.phone,
//          data.email,
//          data.device,
//          data.browser,
//          data.os,
//          data.screen,
//          data.language,
//          data.timezone,
//          data.url,
//          data.referrer || 'direct'
//        ]);
//        return ContentService.createTextOutput('OK');
//      }
//
//   3. Click Deploy → New deployment
//      Type: Web App
//      Execute as: Me
//      Who has access: Anyone
//      → Copy the URL → paste into SHEETS_WEBHOOK_URL below
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── GOOGLE SHEETS WEBHOOK ───────────────────────────────────────────────────
// Paste your Apps Script Web App URL here after you deploy it.
const SHEETS_WEBHOOK_URL = 'PASTE_WEB_APP_URL_HERE';

// ─────────────────────────────────────────────────────────────────────────────
// STATE (module-scoped, not global — nothing is attached to `window` except
// the single entry point Firebase/other modules used to expect: none needed).
// ─────────────────────────────────────────────────────────────────────────────
let isSubmitting = false;


// ─── HELPERS — DEVICE / BROWSER / OS DETECTION ───────────────────────────────
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  return 'Other';
}

function getOperatingSystem() {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}


// ─── HELPERS — VALIDATION ─────────────────────────────────────────────────────
function digitsOnly(value) {
  return value.replace(/\D/g, '');
}

function validateForm({ name, phone, email }) {
  const errors = [];

  if (!name) errors.push('Please enter your name');

  const phoneDigits = digitsOnly(phone);
  if (!phone) {
    errors.push('Please enter your phone number');
  } else if (!/^\d+$/.test(phone)) {
    errors.push('Phone number must contain only digits');
  } else if (phoneDigits.length < 10) {
    errors.push('Phone number must have at least 10 digits');
  }

  if (!email) {
    errors.push('Please enter your email address');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('That email address doesn’t look right');
  }

  return errors;
}


// ─── BUILD DATA PAYLOAD ───────────────────────────────────────────────────────
function buildPayload(formValues) {
  return {
    name:      formValues.name,
    phone:     formValues.phone,
    email:     formValues.email,
    timestamp: new Date().toISOString(),
    url:       window.location.href,
    referrer:  document.referrer || 'direct',
    device:    getDeviceType(),
    browser:   getBrowserName(),
    os:        getOperatingSystem(),
    screen:    `${window.screen.width}×${window.screen.height}`,
    userAgent: navigator.userAgent,
    language:  navigator.language || 'Unknown',
    timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
  };
}


// ─── SEND LEAD TO GOOGLE SHEETS ────────────────────────────────────────────────
// Uses no-cors so the browser doesn't block the cross-origin POST to Apps
// Script. That means we can't read the response body/status — we treat the
// fetch resolving (not throwing) as success, which matches how Apps Script
// Web Apps behave in practice.
async function sendToSheets(payload) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL === 'PASTE_WEB_APP_URL_HERE') {
    throw new Error('Sheets webhook URL is not configured yet.');
  }

  await fetch(SHEETS_WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}


// ─── START APP ────────────────────────────────────────────────────────────────
// Called once the lead has been captured successfully.
// Guarded so the app can't accidentally be initialised twice.
let _appStarted = false;
function startApp() {
  if (_appStarted) return;
  _appStarted = true;
  if (window.HomeModule && typeof HomeModule.init === 'function') HomeModule.init();
  if (window.FloorplanModule && typeof FloorplanModule.init === 'function') FloorplanModule.init();
}


// ─── LEAD FORM UI ──────────────────────────────────────────────────────────────
function injectLeadFormUI() {
  if (document.getElementById('lead-screen')) return;

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Syne:wght@400;600;700&display=swap');

    #lead-screen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #0a0805;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.65s ease;
      overflow-y: auto;
      padding: 24px 16px;
    }

    #lead-screen.fade-out {
      opacity: 0;
      pointer-events: none;
    }

    #lead-screen::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      background-size: 200px;
      pointer-events: none;
      opacity: 0.4;
    }

    #lead-card {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 44px 40px;
      border: 1px solid rgba(200,190,154,0.16);
      border-radius: 4px;
      background: rgba(255,255,255,0.02);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 0 0 1px rgba(200,190,154,0.06), 0 24px 80px rgba(0,0,0,0.55);
      width: 100%;
      max-width: 420px;
      box-sizing: border-box;
    }

    .lead-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 46px;
      font-weight: 300;
      letter-spacing: 0.30em;
      color: rgba(245,242,235,0.92);
      line-height: 1;
      text-indent: 0.30em;
    }

    .lead-tagline {
      margin-top: 8px;
      font-family: 'Syne', sans-serif;
      font-size: 8.5px;
      font-weight: 600;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: rgba(200,190,154,0.45);
      text-indent: 0.32em;
    }

    .lead-rule {
      width: 48px;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(200,190,154,0.50), transparent);
      margin: 28px 0 26px;
    }

    #lead-form {
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    .lead-field {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .lead-field + .lead-field {
      margin-top: 14px;
    }

    .lead-label {
      font-family: 'Syne', sans-serif;
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(200,190,154,0.45);
    }

    #lead-form input {
      width: 100%;
      padding: 12px 15px;
      background: rgba(200,190,154,0.05);
      border: 1px solid rgba(200,190,154,0.24);
      border-radius: 5px;
      font-family: 'Syne', sans-serif;
      font-size: 12.5px;
      letter-spacing: 0.02em;
      color: rgba(245,242,235,0.92);
      box-sizing: border-box;
      transition: border-color 0.22s ease, background 0.22s ease;
    }

    #lead-form input::placeholder {
      color: rgba(200,190,154,0.30);
    }

    #lead-form input:focus {
      outline: none;
      border-color: rgba(200,190,154,0.60);
      background: rgba(200,190,154,0.08);
    }

    .lead-primary-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 13px;
      padding: 13px 22px;
      margin-top: 24px;
      background: rgba(200,190,154,0.07);
      border: 1px solid rgba(200,190,154,0.32);
      border-radius: 5px;
      cursor: pointer;
      font-family: 'Syne', sans-serif;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(200,190,154,0.80);
      transition: background 0.22s ease, border-color 0.22s ease,
                  color 0.22s ease, transform 0.22s ease;
      box-sizing: border-box;
    }

    .lead-primary-btn:hover {
      background: rgba(200,190,154,0.13);
      border-color: rgba(200,190,154,0.60);
      color: rgba(245,242,235,0.95);
      transform: translateY(-1px);
    }

    .lead-primary-btn:active { transform: translateY(0); }

    .lead-primary-btn:disabled {
      pointer-events: none;
      opacity: 0.6;
    }

    .lead-spinner {
      display: none;
      width: 15px;
      height: 15px;
      border: 1.5px solid rgba(200,190,154,0.22);
      border-top-color: rgba(200,190,154,0.85);
      border-radius: 50%;
      animation: leadSpin 0.65s linear infinite;
      flex-shrink: 0;
    }

    .lead-spinner.on { display: block; }

    @keyframes leadSpin { to { transform: rotate(360deg); } }

    #lead-status {
      margin-top: 16px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 13px;
      font-style: italic;
      color: rgba(200,190,154,0.40);
      letter-spacing: 0.04em;
      text-align: center;
      min-height: 18px;
      transition: color 0.3s ease;
    }

    #lead-status.success { color: rgba(200,190,154,0.75); }
    #lead-status.error   { color: rgba(214,140,120,0.80); }

    .lead-privacy {
      margin-top: 24px;
      font-family: 'Syne', sans-serif;
      font-size: 8px;
      letter-spacing: 0.08em;
      color: rgba(200,190,154,0.22);
      text-align: center;
      line-height: 1.8;
    }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <div id="lead-screen">
      <div id="lead-card">

        <div class="lead-logo">ARCH</div>
        <div class="lead-tagline">Interactive Experience</div>

        <div class="lead-rule"></div>

        <form id="lead-form" novalidate>

          <div class="lead-field">
            <label class="lead-label" for="lead-name">Name</label>
            <input type="text" id="lead-name" placeholder="Your full name" autocomplete="name" />
          </div>

          <div class="lead-field">
            <label class="lead-label" for="lead-phone">Phone Number</label>
            <input type="tel" id="lead-phone" placeholder="+91 9876543210" autocomplete="tel" />
          </div>

          <div class="lead-field">
            <label class="lead-label" for="lead-email">Email Address</label>
            <input type="email" id="lead-email" placeholder="you@example.com" autocomplete="email" />
          </div>

          <button type="submit" id="lead-submit-btn" class="lead-primary-btn">
            <span id="lead-submit-btn-text">Submit</span>
            <div id="lead-submit-spinner" class="lead-spinner"></div>
          </button>

        </form>

        <div id="lead-status">Fill in your details to begin your experience</div>

        <div class="lead-privacy">
          Information collected for follow-up purposes only.<br>
          Never shared with third parties.
        </div>

      </div>
    </div>
  `);

  document.getElementById('lead-form')?.addEventListener('submit', handleSubmit);
}


// ─── DISMISS LEAD FORM ────────────────────────────────────────────────────────
function dismissLeadScreen() {
  const screen = document.getElementById('lead-screen');
  if (!screen) return;
  screen.classList.add('fade-out');
  setTimeout(() => screen.remove(), 700);
}


// ─── UI STATE HELPERS ─────────────────────────────────────────────────────────
function setStatus(message, kind) {
  const status = document.getElementById('lead-status');
  if (!status) return;
  status.textContent = message;
  status.classList.remove('success', 'error');
  if (kind) status.classList.add(kind);
}

function setLoadingState(isLoading) {
  const btn      = document.getElementById('lead-submit-btn');
  const spinner  = document.getElementById('lead-submit-spinner');
  const btnText  = document.getElementById('lead-submit-btn-text');
  if (!btn || !spinner || !btnText) return;

  btn.disabled = isLoading;
  spinner.classList.toggle('on', isLoading);
  btnText.textContent = isLoading ? 'Submitting…' : 'Submit';
}

function readFormValues() {
  const get = (id) => document.getElementById(id)?.value.trim() || '';
  return {
    name:  get('lead-name'),
    phone: get('lead-phone'),
    email: get('lead-email'),
  };
}


// ─── SUBMIT HANDLER ────────────────────────────────────────────────────────────
async function handleSubmit(event) {
  event.preventDefault();

  // Guard against double-submits (double click, double Enter, etc.)
  if (isSubmitting) return;

  const formValues = readFormValues();
  const errors = validateForm(formValues);

  if (errors.length > 0) {
    setStatus(errors[0], 'error');
    return;
  }

  isSubmitting = true;
  setLoadingState(true);
  setStatus('Submitting your details…');

  try {
    const payload = buildPayload(formValues);
    await sendToSheets(payload);

    setStatus('Thank you. Your information has been received.', 'success');

    // Brief pause so the success message is visible, then launch the app.
    setTimeout(() => {
      dismissLeadScreen();
      startApp();
    }, 1000);

  } catch (err) {
    console.error('❌ Lead submission failed:', err.message);
    setStatus('Something went wrong — please try again', 'error');
    isSubmitting = false;
    setLoadingState(false);
    // Form values are intentionally left untouched so the user doesn't
    // have to re-type everything.
  }
}


// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
// No auth state to check — always show the lead form on load.
document.addEventListener('DOMContentLoaded', injectLeadFormUI);