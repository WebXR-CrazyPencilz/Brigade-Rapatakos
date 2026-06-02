// ─────────────────────────────────────────────────────────────────────────────
// firebase-auth.js  —  ARCH Interactive Experience
// ─────────────────────────────────────────────────────────────────────────────
//
// FLOW:
//   Page loads → onAuthStateChanged fires
//     ├── User already logged in  → skip UI → start app directly
//     └── No user                 → show login screen → Google popup
//                                   → save to Firestore + Google Sheets
//                                   → start app
//
// GOOGLE SHEETS SETUP (one-time, 5 minutes):
//   1. Create a Google Sheet with these headers in Row 1:
//      Timestamp | Name | Email | UID | Device | Browser | Screen | Referrer
//
//   2. Extensions → Apps Script → paste this exact code:
//
//      function doPost(e) {
//        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//        var data  = JSON.parse(e.postData.contents);
//        sheet.appendRow([
//          data.timestamp,
//          data.name,
//          data.email,
//          data.uid,
//          data.device,
//          data.browser,
//          data.screen,
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

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';


// ─── YOUR FIREBASE CONFIG (heybro / arch-web) ────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCC394FBNbNCuVBujTuKrbZj9IxampFNOg",
  authDomain:        "heybro-48634.firebaseapp.com",
  projectId:         "heybro-48634",
  storageBucket:     "heybro-48634.firebasestorage.app",
  messagingSenderId: "270387700071",
  appId:             "1:270387700071:web:ddb8eedf548253147d4fc2",
  measurementId:     "G-C4SSC9NWG5"
};

// ─── GOOGLE SHEETS WEBHOOK ───────────────────────────────────────────────────
// Paste your Apps Script Web App URL here after you deploy it.
// Leave as-is for now — the app will still work, just won't write to Sheets yet.
const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyZimItfRFOeZJ3U558-VTjh8OhoF0efQD6OEpQS9WuWGbRlg1LN07lxqPmziVvWrJ9/exec';

// ─────────────────────────────────────────────────────────────────────────────

let firebaseApp, auth, db, provider;

try {
  firebaseApp = initializeApp(firebaseConfig);
  auth        = getAuth(firebaseApp);
  db          = getFirestore(firebaseApp);
  provider    = new GoogleAuthProvider();

  // Always prompt account chooser even if only one account is signed in
  provider.setCustomParameters({ prompt: 'select_account' });
} catch (err) {
  // If Firebase fails to initialize, show a useful error instead of a black page
  console.error('❌ Firebase initialization failed:', err);
  document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
      'background:#0a0805;color:rgba(200,190,154,.65);font-family:sans-serif;font-size:14px;' +
      'text-align:center;padding:24px;">' +
      'Unable to load. Please refresh or try again later.' +
      '</div>';
  });
  throw err; // halt the rest of the module
}


// ─── HELPERS — DETECT DEVICE & BROWSER ───────────────────────────────────────
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua))  return 'Mobile';
  if (/iPad|Tablet/i.test(ua))   return 'Tablet';
  return 'Desktop';
}

function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg'))                             return 'Edge';
  if (ua.includes('Chrome') && !ua.includes('Edg'))  return 'Chrome';
  if (ua.includes('Firefox'))                         return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  return 'Other';
}


// ─── BUILD DATA PAYLOAD ───────────────────────────────────────────────────────
function buildPayload(user) {
  return {
    uid:       user.uid,
    name:      user.displayName || 'Unknown',
    email:     user.email       || 'Unknown',
    photo:     user.photoURL    || '',
    device:    getDeviceType(),
    browser:   getBrowserName(),
    screen:    `${window.screen.width}×${window.screen.height}`,
    referrer:  document.referrer || 'direct',
    timestamp: new Date().toISOString(),
    url:       window.location.href,
  };
}


// ─── SAVE TO FIRESTORE ────────────────────────────────────────────────────────
// setDoc with merge:true → new users get created, returning users get updated.
// loginCount is not overwritten because of merge — only lastSeen updates.
async function saveToFirestore(payload) {
  try {
    await setDoc(
      doc(db, 'customers', payload.uid),
      {
        ...payload,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('✅ Firestore — customer saved:', payload.email);
  } catch (err) {
    // Don't block the app if Firestore fails
    console.error('❌ Firestore save failed:', err.message);
  }
}


// ─── SEND ROW TO GOOGLE SHEETS ────────────────────────────────────────────────
// Uses no-cors so the browser doesn't block cross-origin POST to Apps Script.
async function sendToSheets(payload) {
  if (
    !SHEETS_WEBHOOK_URL ||
    SHEETS_WEBHOOK_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL'
  ) {
    console.warn('⚠️  Sheets webhook not set — skipping. Add URL to SHEETS_WEBHOOK_URL.');
    return;
  }
  try {
    await fetch(SHEETS_WEBHOOK_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    console.log('✅ Sheets — row sent');
  } catch (err) {
    console.error('❌ Sheets send failed:', err.message);
  }
}


// ─── START APP ────────────────────────────────────────────────────────────────
// Called after successful login OR if user is already signed in on page load.
// Guarded so that if onAuthStateChanged fires more than once in a session
// (e.g. token refresh, sign-out then sign-in), the app doesn't re-init twice.
let _appStarted = false;
function startApp() {
  if (_appStarted) return;
  _appStarted = true;
  if (window.HomeModule      && typeof HomeModule.init === 'function')      HomeModule.init();
  if (window.FloorplanModule && typeof FloorplanModule.init === 'function') FloorplanModule.init();
}


// ─── LOGIN SCREEN UI ──────────────────────────────────────────────────────────
function injectLoginUI() {
  if (document.getElementById('auth-screen')) return;

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Syne:wght@400;600;700&display=swap');

    /* ── Screen shell ── */
    #auth-screen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #0a0805;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.65s ease;
      overflow: hidden;
    }

    #auth-screen.fade-out {
      opacity: 0;
      pointer-events: none;
    }

    /* Subtle grain texture */
    #auth-screen::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      background-size: 200px;
      pointer-events: none;
      opacity: 0.4;
    }

    /* Radial glow behind the card */
    #auth-screen::after {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(ellipse, rgba(200,190,154,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    /* ── Card ── */
    #auth-card {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      padding: 52px 56px 44px;
      border: 1px solid rgba(200,190,154,0.16);
      border-radius: 4px;
      background: rgba(255,255,255,0.02);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow:
        0 0 0 1px rgba(200,190,154,0.06),
        0 24px 80px rgba(0,0,0,0.55);
      min-width: 320px;
      max-width: 380px;
    }

    /* ── Logo ── */
    .auth-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 52px;
      font-weight: 300;
      letter-spacing: 0.30em;
      color: rgba(245,242,235,0.92);
      line-height: 1;
      text-indent: 0.30em; /* optical centre for letter-spacing */
    }

    .auth-tagline {
      margin-top: 8px;
      font-family: 'Syne', sans-serif;
      font-size: 8.5px;
      font-weight: 600;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: rgba(200,190,154,0.45);
      text-indent: 0.32em;
    }

    /* Gold rule */
    .auth-rule {
      width: 48px;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(200,190,154,0.50), transparent);
      margin: 32px 0 28px;
    }

    /* ── Google button ── */
    #auth-google-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 13px;
      padding: 13px 22px;
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

    #auth-google-btn:hover {
      background: rgba(200,190,154,0.13);
      border-color: rgba(200,190,154,0.60);
      color: rgba(245,242,235,0.95);
      transform: translateY(-1px);
    }

    #auth-google-btn:active {
      transform: translateY(0);
    }

    #auth-google-btn:disabled {
      pointer-events: none;
      opacity: 0.6;
    }

    #auth-google-btn svg {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
    }

    /* Spinner */
    #auth-spinner {
      display: none;
      width: 15px;
      height: 15px;
      border: 1.5px solid rgba(200,190,154,0.22);
      border-top-color: rgba(200,190,154,0.85);
      border-radius: 50%;
      animation: authSpin 0.65s linear infinite;
      flex-shrink: 0;
    }

    #auth-spinner.on { display: block; }

    @keyframes authSpin { to { transform: rotate(360deg); } }

    /* ── Status line ── */
    #auth-status {
      margin-top: 18px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 13px;
      font-style: italic;
      color: rgba(200,190,154,0.40);
      letter-spacing: 0.04em;
      text-align: center;
      min-height: 18px;
      transition: color 0.3s ease;
    }

    #auth-status.success {
      color: rgba(200,190,154,0.75);
    }

    /* ── Privacy note ── */
    .auth-privacy {
      margin-top: 28px;
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
    <div id="auth-screen">
      <div id="auth-card">

        <div class="auth-logo">ARCH</div>
        <div class="auth-tagline">Interactive Experience</div>

        <div class="auth-rule"></div>

        <button id="auth-google-btn">
          <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span id="auth-btn-text">Continue with Google</span>
          <div id="auth-spinner"></div>
        </button>

        <div id="auth-status">Sign in to begin your experience</div>

        <div class="auth-privacy">
          Information collected for analytics only.<br>
          Never shared with third parties.
        </div>

      </div>
    </div>
  `);

  const googleBtn = document.getElementById('auth-google-btn');
  if (googleBtn) googleBtn.addEventListener('click', triggerLogin);
}


// ─── DISMISS LOGIN SCREEN ─────────────────────────────────────────────────────
function dismissAuthScreen() {
  const screen = document.getElementById('auth-screen');
  if (!screen) return;
  screen.classList.add('fade-out');
  setTimeout(() => screen.remove(), 700);
}


// ─── TRIGGER GOOGLE LOGIN ─────────────────────────────────────────────────────
async function triggerLogin() {
  const btn     = document.getElementById('auth-google-btn');
  const status  = document.getElementById('auth-status');
  const spinner = document.getElementById('auth-spinner');
  const btnText = document.getElementById('auth-btn-text');
  if (!btn || !status || !spinner || !btnText) return; // safety: UI was removed

  // Loading state
  btn.disabled = true;
  spinner.classList.add('on');
  btnText.textContent  = 'Signing in…';
  status.textContent   = 'Opening Google sign-in…';
  status.classList.remove('success');

  try {
    const result  = await signInWithPopup(auth, provider);
    const user    = result.user;
    const payload = buildPayload(user);

    const firstName = user.displayName?.split(' ')[0] || 'there';
    status.textContent = `Welcome, ${firstName}`;
    status.classList.add('success');

    // Save to Firestore AND Sheets in parallel — neither blocks the other
    await Promise.allSettled([
      saveToFirestore(payload),
      sendToSheets(payload),
    ]);

    // Brief pause so the welcome message is visible, then launch app
    setTimeout(() => {
      dismissAuthScreen();
      startApp();
    }, 1000);

  } catch (err) {
    // popup_closed_by_user is not really an error — user just closed the popup
    if (err.code === 'auth/popup-closed-by-user') {
      status.textContent = 'Sign-in cancelled — try again';
    } else if (err.code === 'auth/popup-blocked') {
      status.textContent = 'Pop-up blocked — please allow pop-ups and retry';
    } else if (err.code === 'auth/network-request-failed') {
      status.textContent = 'Network error — check your connection';
    } else {
      status.textContent = 'Something went wrong — please try again';
      console.error('❌ Login error:', err.code, err.message);
    }

    // Reset button
    status.classList.remove('success');
    btn.disabled         = false;
    spinner.classList.remove('on');
    btnText.textContent  = 'Continue with Google';
  }
}


// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
// Firebase calls this immediately on page load.
// If the user has a valid session cookie → user object is present → skip login.
// If not → show the login screen.
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Returning visitor — silently update their record in the background
    const payload = buildPayload(user);
    Promise.allSettled([
      saveToFirestore(payload),
      sendToSheets(payload),
    ]);

    // Remove login screen if somehow still present, then start
    dismissAuthScreen();
    startApp();

  } else {
    // First visit or session expired → show login
    injectLoginUI();
  }
});