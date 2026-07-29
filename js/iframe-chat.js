// iframe-chat.js — Brigade Stellaris · AI Assistant (independent, global module)
//
// This module is fully self-contained and mounts directly under
// document.body. It does NOT belong to, depend on, or get created by
// HomeModule / GalleryModule / FloorplanModule / the Location screen,
// and it never calls, clicks, classes, reads, or navigates any of them.
// It is created exactly once on page load and stays mounted — with one
// single, unchanging bottom-right position — across every screen (Home,
// Floor Plan, 360 View, Gallery, Location, Unit Viewer) without being
// recreated or destroyed. There is no Home-specific behavior, no grid
// integration, and no separate "Home version" of the launcher — the
// same #ai-chat-launcher element is used everywhere, including Home.
//
// Opening the assistant only ever: lazy-creates the iframe (once),
// adds .open to its own panel, and hides its own launcher. Closing it
// only ever: removes .open and shows its own launcher. Nothing else —
// no other element in the application is ever read, classed, clicked,
// or transformed by this module.
//
// FIX (z-index): Home's #landing-screen overlay (see home.js) is a
// full-viewport, opaque, pointer-events:all layer with z-index: 500.
// This launcher/panel previously used z-index 401/400, so on Home the
// landing screen visually and interactively covered the launcher even
// though nothing here ever hid it. Raised to 601/600 — comfortably
// above landing-screen's 500 — so the launcher stays on top on every
// screen, without touching home.js or index.html.

window.IframeChatModule = (function () {

  const CHAT_SRC = 'https://3dactz-brigade-stellaris-chatb.hf.space';

  let launcherEl    = null;
  let panelEl       = null;
  let iframeEl      = null;
  let isOpen        = false;
  let iframeCreated = false;

  // ─── STYLES ────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('iframe-chat-styles')) return;

    const style = document.createElement('style');
    style.id = 'iframe-chat-styles';
    style.textContent = `
      /* ── Shared sizing values for the launcher pill. */
      :root {
        --nav-height: 62px;
        --launcher-gap: 16px;
        --launcher-right: 40px; /* aligned to match Google Maps preview card's right edge (24px overlay padding + 16px card offset) */
        --launcher-width: 260px;
        --launcher-height: 54px;
      }

      /* ── Launcher: premium rectangular CTA card, fixed bottom-right —
         the ONE position used on every page, including Home. There is
         no separate Home-page variant of this element.
         z-index raised to 601 — above Home's #landing-screen (500) —
         so the landing overlay never covers/blocks it. */
      #ai-chat-launcher {
        position: fixed;
        pointer-events: auto;
        right: var(--launcher-right);
        bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + var(--launcher-gap));
        z-index: 601;
        width: var(--launcher-width);
        height: var(--launcher-height);
        border-radius: 16px;
        background: #FFFFFF;
        border: 1px solid rgba(166,96,45,.18);
        box-shadow: 0 8px 24px rgba(0,0,0,.10);
        display: flex; align-items: center; justify-content: center; gap: 8px;
        cursor: pointer;
        box-sizing: border-box;
        transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
        -webkit-tap-highlight-color: transparent;
      }
      #ai-chat-launcher:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(0,0,0,.14);
        border-color: rgba(166,96,45,.55);
      }
      #ai-chat-launcher:active { transform: translateY(-1px); }
      #ai-chat-launcher-label {
        font-family: 'Syne', sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: #2B2B2B;
      }
      #ai-chat-launcher-arrow {
        font-family: 'Syne', sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #A6602D;
        line-height: 1;
      }
      #ai-chat-launcher.hidden { opacity: 0; pointer-events: none; transform: translateY(6px); }

      @media (max-width: 520px) {
        :root {
          --launcher-right: 36px; /* aligned to match Google Maps preview card's right edge on mobile (24px overlay padding + 12px card offset) */
          --launcher-gap: 12px;
          --launcher-width: 190px;
          --launcher-height: 50px;
        }
        #ai-chat-launcher { border-radius: 14px; }
        #ai-chat-launcher-label { font-size: 9.5px; }
      }

      /* ── Chat window: purely a positioning/sizing container. The
         Hugging Face iframe already ships its own header, rounded
         corners, background, padding, and shadow — so this element
         supplies none of that itself, only fixed placement, size, and
         the open/close animation. Overflow stays hidden purely to clip
         the animated width/height growth, not to frame anything.
         z-index raised to 600 (still one below the launcher) — above
         Home's #landing-screen (500) — for the same reason as above. */
      #ai-chat-panel.chat-window {
        position: fixed;
        pointer-events: none;
        right: 18px;
        bottom: calc(62px + env(safe-area-inset-bottom, 0px) + 16px);
        z-index: 600;
        width: 0; height: 0;
        border-radius: 22px;
        overflow: hidden;
        opacity: 0;
        transform-origin: bottom right;
        transform: scale(.92);
        transition: width .32s cubic-bezier(0.22,1,0.36,1),
                    height .32s cubic-bezier(0.22,1,0.36,1),
                    opacity .25s ease,
                    transform .32s cubic-bezier(0.22,1,0.36,1);
      }
      #ai-chat-panel.chat-window.open {
        width: 420px;
        height: 720px;
        opacity: 1;
        pointer-events: auto;
        transform: scale(1);
      }

      /* Small floating close control, overlaid on top of the iframe's
         own UI — not a header bar, not a card, just a control. */
      #ai-chat-close {
        position: absolute;
        top: 10px; right: 10px;
        z-index: 1;
        width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: rgba(255,255,255,.9);
        border: 1px solid rgba(166,96,45,.25);
        box-shadow: 0 4px 14px rgba(0,0,0,.15);
        cursor: pointer;
        transition: background .2s ease, transform .2s ease;
        -webkit-tap-highlight-color: transparent;
      }
      #ai-chat-close:hover { background: #FFFFFF; transform: scale(1.06); }
      #ai-chat-close svg { width: 13px; height: 13px; stroke: #2B2B2B; fill: none; stroke-width: 2; stroke-linecap: round; }

      .chat-iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }

      @media (max-width: 520px) {
        #ai-chat-panel.chat-window { right: 12px; bottom: calc(62px + env(safe-area-inset-bottom, 0px) + 12px); }
        #ai-chat-panel.chat-window.open {
          width: calc(100vw - 24px);
          height: min(60dvh, 520px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Chat window (fixed, independent of launcher placement) ─────────
  function createChatPanel() {
    if (document.getElementById('ai-chat-panel')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="ai-chat-panel" class="chat-window">
        <div id="ai-chat-close" title="Close">
          <svg viewBox="0 0 24 24"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
        </div>
      </div>
    `);

    panelEl = document.getElementById('ai-chat-panel');
    document.getElementById('ai-chat-close').addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closeChat();
    });
  }

  // ─── Launcher (global, single implementation, mounted once directly
  // under document.body — used identically on every screen, Home
  // included). ──────────────────────────────────────────────────────
  function mountLauncher() {
    if (document.getElementById('ai-chat-launcher')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="ai-chat-launcher" title="Chat with the AI Assistant">
        <span id="ai-chat-launcher-label">Chat with AI</span>
        <span id="ai-chat-launcher-arrow">&#8594;</span>
      </div>
    `);

    launcherEl = document.getElementById('ai-chat-launcher');
    launcherEl.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      toggleChat();
    });
  }

  // ─── IFRAME (created once, reused forever) ──────────────────────────
  function loadIframe() {
    if (iframeCreated) return;
    iframeCreated = true;
    iframeEl = document.createElement('iframe');
    iframeEl.className = 'chat-iframe';
    iframeEl.src = CHAT_SRC;
    iframeEl.setAttribute('allow', 'clipboard-write');
    panelEl.appendChild(iframeEl);
  }

  // ─── Public actions ──────────────────────────────────────────────────
  function openChat() {
    if (isOpen) return;
    loadIframe();
    panelEl.classList.add('open');
    hideLauncher();
    isOpen = true;
  }

  function closeChat() {
    if (!isOpen) return;
    panelEl.classList.remove('open');
    showLauncher();
    isOpen = false;
  }

  function toggleChat() {
    if (isOpen) closeChat();
    else openChat();
  }

  function showLauncher() {
    if (launcherEl) launcherEl.classList.remove('hidden');
  }

  function hideLauncher() {
    if (launcherEl) launcherEl.classList.add('hidden');
  }

  function createChatWidget() {
    injectStyles();
    createChatPanel();
    mountLauncher();
  }

  return {
    init() {
      createChatWidget();
    },
    toggleChat,
    openChat,
    closeChat,
    showLauncher,
    hideLauncher
  };

})();

document.addEventListener('DOMContentLoaded', function () {
  window.IframeChatModule.init();
});