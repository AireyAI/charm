/* ─── Charm Shared Utilities ─────────────────────────────────────────── */

(function () {
  'use strict';

  // ── Global mobile nav polish ──────────────────────────────────────────
  // Injected so every page (including those that don't load charm-v2.css)
  // gets a consistent nav at phone widths.
  const mobileNavCss = document.createElement('style');
  mobileNavCss.id = 'charm-mobile-nav-css';
  mobileNavCss.textContent = `
    @media (max-width: 640px) {
      .nav-inner { padding: 0 14px !important; gap: 10px !important; }
      .nav-right, .nav-actions { gap: 6px !important; }
      .nav-icon, .nav-icon-btn { width: 32px !important; height: 32px !important; }
      #charm-loc-pill { padding: 0 !important; width: 34px !important; max-width: 34px !important; justify-content: center !important; }
      #charm-loc-pill > span:nth-child(2) { display: none !important; }
      #theme-toggle { display: none !important; }
    }
    @media (max-width: 480px) {
      .nav-right .nav-icon, .nav-actions .nav-icon-btn { display: none !important; }
      .nav-inner { padding: 0 12px !important; }
      .btn.btn--sm, .btn-ghost, .btn-gold, .nav .btn-gold { padding: 6px 10px !important; font-size: 11px !important; }
    }
    /* When the user is logged in, the avatar covers account + create-listing,
       so the "+ Add Listing" primary button becomes redundant on mobile. */
    @media (max-width: 640px) {
      .nav-right:has(.charm-auth-el) .btn-gold,
      .nav-right:has(.charm-auth-el) .btn--primary,
      .nav-right:has(.charm-auth-el) .nav-add-listing,
      .nav-actions:has(.charm-auth-el) .btn-gold,
      .nav-actions:has(.charm-auth-el) .btn--primary { display: none !important; }
    }
  `;
  document.head.appendChild(mobileNavCss);

  // ── Unified toast notifications (CharmToast) ──────────────────────────
  // Every page used to roll its own toast (different positions, colours,
  // typography, timing). CharmToast replaces them with one editorial look:
  // dark card + gold accent pin, subtle border, Syne kicker + DM Sans copy,
  // bottom-center slide-up. Page-local showToast() / toast() helpers get
  // shimmed to delegate here, so no call sites need to change.
  const toastCss = document.createElement('style');
  toastCss.id = 'charm-toast-css';
  toastCss.textContent = `
    #charm-toast-stack {
      position: fixed;
      left: 50%;
      bottom: max(24px, env(safe-area-inset-bottom, 24px));
      transform: translateX(-50%);
      display: flex;
      flex-direction: column-reverse;
      gap: 10px;
      z-index: 10002;
      pointer-events: none;
      width: min(420px, calc(100vw - 32px));
    }
    .charm-toast {
      display: grid;
      grid-template-columns: 34px 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 12px 14px 12px 12px;
      background: rgba(13, 13, 26, 0.94);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 12px;
      color: #f0ece3;
      font-family: 'DM Sans', 'Inter Tight', sans-serif;
      font-size: 13.5px;
      line-height: 1.45;
      letter-spacing: -0.1px;
      box-shadow: 0 16px 44px rgba(0,0,0,0.45);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      pointer-events: auto;
      transform: translateY(14px);
      opacity: 0;
      transition: transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease;
    }
    .charm-toast.is-open { transform: translateY(0); opacity: 1; }
    .charm-toast__icon {
      width: 34px; height: 34px;
      border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      background: rgba(226,168,75,0.12);
      color: #e2a84b;
      font-family: 'Syne', sans-serif;
      font-size: 15px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .charm-toast--success .charm-toast__icon { background: rgba(54,217,138,0.12); color: #36d98a; }
    .charm-toast--error   .charm-toast__icon { background: rgba(255,107,87,0.14); color: #ff6b57; }
    .charm-toast--info    .charm-toast__icon { background: rgba(0,212,200,0.12);  color: #00d4c8; }
    .charm-toast__body { min-width: 0; }
    .charm-toast__kicker {
      display: block;
      font-family: 'Syne', sans-serif;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #e2a84b;
      margin-bottom: 1px;
    }
    .charm-toast--success .charm-toast__kicker { color: #36d98a; }
    .charm-toast--error   .charm-toast__kicker { color: #ff6b57; }
    .charm-toast--info    .charm-toast__kicker { color: #00d4c8; }
    .charm-toast__msg { display: block; color: #f0ece3; }
    .charm-toast__close {
      width: 28px; height: 28px;
      display: inline-flex; align-items: center; justify-content: center;
      border: none; background: transparent; color: #8886a0;
      font-family: 'Syne', sans-serif; font-size: 14px; line-height: 1;
      border-radius: 6px; cursor: pointer;
      transition: color 0.18s ease, background 0.18s ease;
    }
    .charm-toast__close:hover { color: #f0ece3; background: rgba(255,255,255,0.06); }

    /* Hide legacy page-specific toast containers — CharmToast replaces them. */
    .toast#toast, #success-toast.toast { display: none !important; }
  `;
  document.head.appendChild(toastCss);

  function ensureToastStack() {
    let stack = document.getElementById('charm-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'charm-toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    return stack;
  }

  const DEFAULT_KICKERS = {
    default: 'Charm',
    success: 'Done',
    error: 'Heads up',
    info: 'Note',
  };
  const DEFAULT_ICONS = {
    default: '\u2726',
    success: '\u2713',
    error: '\u0021',
    info: 'i',
  };

  window.CharmToast = {
    show(message, opts = {}) {
      if (!message) return null;
      const variant = opts.variant && DEFAULT_KICKERS[opts.variant] ? opts.variant : 'default';
      const duration = typeof opts.duration === 'number' ? opts.duration : 3200;
      const icon = opts.icon || DEFAULT_ICONS[variant];
      const kicker = opts.kicker !== undefined ? opts.kicker : DEFAULT_KICKERS[variant];

      const stack = ensureToastStack();
      const el = document.createElement('div');
      el.className = `charm-toast charm-toast--${variant}`;
      const hasKicker = kicker && kicker.length > 0;
      el.innerHTML = `
        <span class="charm-toast__icon" aria-hidden="true">${icon}</span>
        <span class="charm-toast__body">
          ${hasKicker ? `<span class="charm-toast__kicker">${kicker}</span>` : ''}
          <span class="charm-toast__msg"></span>
        </span>
        <button class="charm-toast__close" aria-label="Dismiss">&times;</button>
      `;
      el.querySelector('.charm-toast__msg').textContent = message;

      const dismiss = () => {
        el.classList.remove('is-open');
        setTimeout(() => el.remove(), 260);
      };
      el.querySelector('.charm-toast__close').addEventListener('click', dismiss);

      stack.appendChild(el);
      requestAnimationFrame(() => el.classList.add('is-open'));
      if (duration > 0) setTimeout(dismiss, duration);
      return el;
    },
    success(msg, opts = {}) { return this.show(msg, { variant: 'success', ...opts }); },
    error(msg, opts = {})   { return this.show(msg, { variant: 'error',   ...opts }); },
    info(msg, opts = {})    { return this.show(msg, { variant: 'info',    ...opts }); },
  };

  // Legacy shim — every page-local showToast() / toast() now forwards to
  // CharmToast. Keep the scope isolated so individual pages can still
  // define their own if they want different behaviour (they currently
  // don't). Pages that had `window.showToast = ...` still win because
  // they run after shared.js; the shim below only kicks in if the page
  // hasn't defined one. That's wired below via window.addEventListener.
  window.addEventListener('DOMContentLoaded', () => {
    const guessVariant = (txt) => {
      const lower = String(txt || '').toLowerCase();
      if (/\bcould not|fail|error|invalid|cannot|must be|please /i.test(lower)) return 'error';
      if (/\bsaved|added|removed|welcome|signed in|switched|confirmed|logged/i.test(lower)) return 'success';
      return 'default';
    };
    // Don't clobber a page-local showToast — they already run their own
    // animation against specific DOM. The legacy DOM is hidden via CSS
    // above, so calling the old showToast still works but is silent; to
    // keep notifications visible we proxy through CharmToast whenever a
    // page-local implementation exists.
    const wrap = (name) => {
      const orig = window[name];
      if (typeof orig !== 'function') return;
      window[name] = function (...args) {
        try { orig.apply(this, args); } catch {}
        // Most page-local signatures are (msg) or (icon, msg) or ()
        const msg = args.length >= 2 && typeof args[0] === 'string' && args[0].length <= 4 ? args[1] : args[0];
        if (typeof msg === 'string' && msg.length) {
          window.CharmToast.show(msg, { variant: guessVariant(msg) });
        }
      };
    };
    wrap('showToast');
    wrap('toast');
  });

  // ── Page transition ───────────────────────────────────────────────────
  // Inject fade overlay
  const overlay = document.createElement('div');
  overlay.id = 'page-transition-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', background: '#07070e',
    zIndex: '99999', opacity: '1', pointerEvents: 'none',
    transition: 'opacity 0.35s ease',
  });
  document.body.appendChild(overlay);

  // Fade in on load
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 380);
  }));

  // Intercept internal link clicks → fade out then navigate
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('http') || a.target === '_blank') return;
    e.preventDefault();
    overlay.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => { window.location.href = href; }, 340);
    }));
  });

  // ── Back to top ───────────────────────────────────────────────────────
  const btt = document.createElement('button');
  btt.id = 'back-to-top';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`;
  Object.assign(btt.style, {
    position: 'fixed', bottom: '28px', right: '28px',
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(255,255,255,0.13)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    color: '#9896a8', cursor: 'pointer', zIndex: '8000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: '0', transform: 'translateY(12px)',
    transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1), color 0.2s, background 0.2s',
    pointerEvents: 'none',
  });
  btt.addEventListener('mouseenter', () => { btt.style.color = '#e2a84b'; btt.style.background = 'rgba(226,168,75,0.1)'; });
  btt.addEventListener('mouseleave', () => { btt.style.color = '#9896a8'; btt.style.background = 'rgba(13,13,26,0.9)'; });
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btt);

  let bttVisible = false;
  window.addEventListener('scroll', () => {
    const should = window.scrollY > 320;
    if (should !== bttVisible) {
      bttVisible = should;
      btt.style.opacity = should ? '1' : '0';
      btt.style.transform = should ? 'translateY(0)' : 'translateY(12px)';
      btt.style.pointerEvents = should ? 'auto' : 'none';
    }
  }, { passive: true });

  // ── Dark / Light mode ─────────────────────────────────────────────────
  const LIGHT_CSS = `
    :root {
      --c-base: #f5f3ef !important;
      --c-card: #eeebe4 !important;
      --c-elevated: #e6e2d9 !important;
      --c-float: #ddd9ce !important;
      --c-text: #1a1814 !important;
      --c-text-2: #4a4740 !important;
      --c-text-3: #8a8680 !important;
      --c-border: rgba(0,0,0,0.08) !important;
      --c-border-2: rgba(0,0,0,0.14) !important;
    }
    body { background: var(--c-base) !important; color: var(--c-text) !important; }
    .noise { filter: invert(1); }
  `;
  let lightStyleEl = null;

  function applyTheme(theme) {
    if (theme === 'light') {
      if (!lightStyleEl) {
        lightStyleEl = document.createElement('style');
        lightStyleEl.id = 'light-mode-overrides';
        lightStyleEl.textContent = LIGHT_CSS;
        document.head.appendChild(lightStyleEl);
      }
      document.documentElement.dataset.theme = 'light';
    } else {
      if (lightStyleEl) { lightStyleEl.remove(); lightStyleEl = null; }
      delete document.documentElement.dataset.theme;
    }
  }

  const savedTheme = localStorage.getItem('charm-theme') || 'dark';
  applyTheme(savedTheme);

  // Inject theme toggle button into nav (if nav exists)
  function injectThemeToggle() {
    const navRight = document.querySelector('.nav-right, .nav .btn-ghost')?.parentElement;
    if (!navRight) return;
    const toggle = document.createElement('button');
    toggle.id = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle light/dark mode');
    toggle.style.cssText = `
      width:34px; height:34px; border-radius:8px; border:1px solid rgba(255,255,255,0.13);
      background:rgba(255,255,255,0.05); color:#9896a8; cursor:pointer;
      display:flex; align-items:center; justify-content:center; font-size:15px;
      transition:color 0.2s, background 0.2s; flex-shrink:0;
    `;
    toggle.textContent = savedTheme === 'light' ? '☀️' : '🌙';
    toggle.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem('charm-theme', next);
      toggle.textContent = next === 'light' ? '☀️' : '🌙';
    });
    navRight.insertBefore(toggle, navRight.firstChild);
  }
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectThemeToggle);
  } else {
    injectThemeToggle();
  }

  // ── Cookie consent ────────────────────────────────────────────────────
  if (!localStorage.getItem('charm-cookies-accepted')) {
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.style.cssText = `
      position:fixed; bottom:max(20px, env(safe-area-inset-bottom, 20px));
      left:50%; transform:translateX(-50%) translateY(20px);
      width:min(560px, calc(100vw - 32px));
      background:rgba(13,13,26,0.96); border:1px solid rgba(255,255,255,0.13);
      border-radius:14px; padding:18px 20px;
      display:flex; align-items:center; gap:16px; flex-wrap:wrap;
      backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
      z-index:9998; opacity:0;
      transition:opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow:0 8px 40px rgba(0,0,0,0.4);
    `;
    banner.innerHTML = `
      <p style="flex:1; font-family:'DM Sans',sans-serif; font-size:13px; color:#9896a8; line-height:1.5; margin:0; min-width:180px;">
        We use cookies to improve your experience and analyse site traffic.
        <a href="privacy.html" style="color:#e2a84b; text-decoration:underline; text-decoration-color:rgba(226,168,75,0.3); text-underline-offset:3px;">Learn more</a>
      </p>
      <div style="display:flex; gap:8px; flex-shrink:0;">
        <button id="cookie-decline" style="font-family:'Syne',sans-serif; font-size:12px; font-weight:600; color:#9896a8; background:transparent; border:1px solid rgba(255,255,255,0.13); border-radius:8px; padding:8px 14px; cursor:pointer;">Decline</button>
        <button id="cookie-accept" style="font-family:'Syne',sans-serif; font-size:12px; font-weight:700; color:#0f0800; background:#e2a84b; border:none; border-radius:8px; padding:8px 14px; cursor:pointer;">Accept</button>
      </div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translateX(-50%) translateY(0)';
    }, 1200);

    function dismissBanner(accepted) {
      localStorage.setItem('charm-cookies-accepted', accepted ? '1' : '0');
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => banner.remove(), 350);
    }
    document.getElementById('cookie-accept').addEventListener('click', () => dismissBanner(true));
    document.getElementById('cookie-decline').addEventListener('click', () => dismissBanner(false));
  }

  // ── Cart persistence (localStorage) ────────────────────────────────────
  window.CharmCart = {
    KEY: 'charm-cart',
    get() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
    set(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); this._badge(); },
    add(item) {
      const cart = this.get();
      const existing = cart.find(i => i.id === item.id);
      if (existing) existing.qty = (existing.qty || 1) + 1;
      else cart.push({ ...item, qty: 1 });
      this.set(cart);
    },
    remove(id) { this.set(this.get().filter(i => i.id !== id)); },
    clear() { this.set([]); },
    total() { return this.get().reduce((s, i) => s + (i.qty || 1), 0); },
    _badge() {
      const count = this.total();
      document.querySelectorAll('.cart-count, [data-cart-count]').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? '' : 'none';
      });
    }
  };

  // ── Wishlist persistence (localStorage) ───────────────────────────────
  window.CharmWishlist = {
    KEY: 'charm-wishlist',
    get() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
    set(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); },
    toggle(id) {
      const list = this.get();
      const idx = list.indexOf(id);
      if (idx > -1) list.splice(idx, 1); else list.push(id);
      this.set(list);
      return idx === -1; // true = added, false = removed
    },
    has(id) { return this.get().includes(id); },
    count() { return this.get().length; }
  };

  // Init cart badge on page load
  function initCartBadge() { window.CharmCart._badge(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartBadge);
  } else { initCartBadge(); }

  // ── Location pill + first-visit prompt ────────────────────────────────
  function waitForDB(fn) {
    if (window.CharmDB && CharmDB.Location) return fn();
    setTimeout(() => waitForDB(fn), 40);
  }

  function openLocationModal({ firstVisit } = {}) {
    // Remove any existing modal
    document.getElementById('charm-loc-modal')?.remove();

    const cities = CharmDB.Location.availableCities();
    const current = CharmDB.Location.get();

    const modal = document.createElement('div');
    modal.id = 'charm-loc-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Choose your location');
    modal.style.cssText = `
      position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center;
      background:rgba(7,7,14,0.75); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      opacity:0; transition:opacity 0.25s ease; padding:24px;
    `;

    const heading = firstVisit ? "Where in the world?" : "Change location";
    const sub = firstVisit
      ? "Charm is worldwide — type a few letters and we'll find your city. You can change this anytime from the nav."
      : "Search any city worldwide, or pick one with listings below.";

    modal.innerHTML = `
      <div style="
        background:#0d0d1a; border:1px solid rgba(255,255,255,0.1); border-radius:14px;
        padding:28px 28px 24px; width:min(460px, calc(100vw - 48px));
        box-shadow:0 24px 80px rgba(0,0,0,0.55);
        transform:translateY(12px); opacity:0;
        transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s;
      " id="charm-loc-card">
        <div style="font-family:'Syne',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#e2a84b; margin-bottom:8px;">🌍 Location</div>
        <h2 style="font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:500; color:#f0ece3; margin:0 0 8px; line-height:1.1; letter-spacing:-0.3px;">${heading}</h2>
        <p style="font-family:'DM Sans',sans-serif; font-size:13.5px; color:#9896a8; line-height:1.55; margin:0 0 18px;">${sub}</p>
        <div style="position:relative; margin-bottom:14px;">
          <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:14px; opacity:0.7; pointer-events:none;">🔎</span>
          <input type="text" id="charm-loc-search" autocomplete="off" spellcheck="false"
            placeholder="Try 'Barcelona', 'Tokyo', 'Austin'…"
            style="
              width:100%; box-sizing:border-box;
              background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12);
              border-radius:10px; padding:12px 14px 12px 36px; color:#f0ece3;
              font-family:'DM Sans',sans-serif; font-size:15px; outline:none;
              transition:border-color 0.15s, background 0.15s;
            " />
          <div id="charm-loc-search-status" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); font-family:'DM Sans',sans-serif; font-size:11px; color:#9896a8; pointer-events:none; display:none;"></div>
        </div>
        <div id="charm-loc-search-results" style="display:none; flex-direction:column; gap:6px; margin-bottom:14px; max-height:260px; overflow-y:auto;"></div>
        <div id="charm-loc-cities-label" style="font-family:'Syne',sans-serif; font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9896a8; margin-bottom:8px;">Cities with listings</div>
        <div id="charm-loc-options" style="display:flex; flex-direction:column; gap:6px; margin-bottom:18px; max-height:240px; overflow-y:auto;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <button type="button" id="charm-loc-all" style="
            font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#9896a8;
            background:transparent; border:none; padding:8px 0; cursor:pointer; text-decoration:underline;
            text-underline-offset:3px; text-decoration-color:rgba(152,150,168,0.3);
          ">Show all locations</button>
          ${firstVisit ? '' : `<button type="button" id="charm-loc-close" style="
            font-family:'Syne',sans-serif; font-size:12px; font-weight:700; color:#0f0800;
            background:#e2a84b; border:none; border-radius:8px; padding:10px 18px; cursor:pointer;
          ">Done</button>`}
        </div>
      </div>
    `;

    const optionsWrap = modal.querySelector('#charm-loc-options');
    const citiesLabel = modal.querySelector('#charm-loc-cities-label');
    if (cities.length === 0) {
      citiesLabel.style.display = 'none';
    }
    cities.forEach(({ city, count }) => {
      const selected = current === city;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = `
        display:flex; align-items:center; justify-content:space-between; gap:12px;
        padding:12px 14px; background:${selected ? 'rgba(226,168,75,0.12)' : 'rgba(255,255,255,0.03)'};
        border:1px solid ${selected ? 'rgba(226,168,75,0.35)' : 'rgba(255,255,255,0.08)'};
        border-radius:10px; color:#f0ece3; font-family:'DM Sans',sans-serif; font-size:14px;
        text-align:left; cursor:pointer; transition:background 0.15s, border-color 0.15s;
      `;
      btn.innerHTML = `
        <span style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:15px;">📍</span>
          <span style="font-weight:500;">${city}</span>
        </span>
        <span style="font-family:'Syne',sans-serif; font-size:11.5px; font-weight:600; color:#9896a8; letter-spacing:0.04em;">${count} listing${count === 1 ? '' : 's'}</span>
      `;
      btn.addEventListener('mouseenter', () => { if (!selected) btn.style.background = 'rgba(255,255,255,0.06)'; });
      btn.addEventListener('mouseleave', () => { if (!selected) btn.style.background = 'rgba(255,255,255,0.03)'; });
      btn.addEventListener('click', () => {
        CharmDB.Location.set(city);
        closeLocationModal();
      });
      optionsWrap.appendChild(btn);
    });

    // ── Worldwide typeahead ────────────────────────────────────────────
    const searchInput = modal.querySelector('#charm-loc-search');
    const resultsWrap = modal.querySelector('#charm-loc-search-results');
    const statusEl = modal.querySelector('#charm-loc-search-status');
    let searchSeq = 0;
    let searchTimer = null;

    const setStatus = (text) => {
      if (!text) { statusEl.style.display = 'none'; statusEl.textContent = ''; return; }
      statusEl.style.display = 'block';
      statusEl.textContent = text;
    };

    const renderResults = (results) => {
      resultsWrap.innerHTML = '';
      if (results.length === 0) {
        resultsWrap.style.display = 'none';
        return;
      }
      resultsWrap.style.display = 'flex';
      results.forEach(r => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = `
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding:12px 14px; background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08); border-radius:10px;
          color:#f0ece3; font-family:'DM Sans',sans-serif; font-size:14px;
          text-align:left; cursor:pointer; transition:background 0.15s, border-color 0.15s;
        `;
        btn.innerHTML = `
          <span style="display:flex; align-items:center; gap:10px; min-width:0;">
            <span style="font-size:15px; flex-shrink:0;">🌍</span>
            <span style="font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${r.label}</span>
          </span>
          <span style="font-family:'Syne',sans-serif; font-size:11px; font-weight:700; color:#e2a84b; letter-spacing:0.06em; flex-shrink:0;">SELECT →</span>
        `;
        btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.06)'; btn.style.borderColor = 'rgba(226,168,75,0.35)'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.03)'; btn.style.borderColor = 'rgba(255,255,255,0.08)'; });
        btn.addEventListener('click', () => {
          CharmDB.Location.set(r.label, r.coords);
          closeLocationModal();
        });
        resultsWrap.appendChild(btn);
      });
    };

    const runSearch = async (query) => {
      const seq = ++searchSeq;
      const q = query.trim();
      if (q.length < 2) {
        renderResults([]);
        setStatus('');
        return;
      }
      setStatus('Searching…');
      const results = await CharmDB.Location.search(q);
      if (seq !== searchSeq) return; // stale
      setStatus(results.length === 0 ? 'No matches' : '');
      renderResults(results);
    };

    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => runSearch(searchInput.value), 260);
    });
    searchInput.addEventListener('focus', () => {
      searchInput.style.borderColor = 'rgba(226,168,75,0.45)';
      searchInput.style.background = 'rgba(255,255,255,0.06)';
    });
    searchInput.addEventListener('blur', () => {
      searchInput.style.borderColor = 'rgba(255,255,255,0.12)';
      searchInput.style.background = 'rgba(255,255,255,0.04)';
    });

    modal.querySelector('#charm-loc-all').addEventListener('click', () => {
      CharmDB.Location.set(null);
      closeLocationModal();
    });
    modal.querySelector('#charm-loc-close')?.addEventListener('click', closeLocationModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeLocationModal(); });

    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      const card = modal.querySelector('#charm-loc-card');
      if (card) { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }
      // Desktop: jump straight into search. Skip on mobile so the keyboard
      // doesn't obscure the list of cities-with-listings on first open.
      if (window.innerWidth >= 640) {
        setTimeout(() => searchInput && searchInput.focus(), 220);
      }
    });
  }

  function closeLocationModal() {
    const modal = document.getElementById('charm-loc-modal');
    if (!modal) return;
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 220);
  }

  function renderLocationPill() {
    // The nav pill was intentionally removed — location is still accessible
    // via the first-visit modal and any call to window.openCharmLocationModal().
    // If a stale pill remains in the DOM from a previous render, clean it up.
    const existing = document.getElementById('charm-loc-pill');
    if (existing) existing.remove();
  }

  function initLocation() {
    waitForDB(() => {
      renderLocationPill();
      // First visit: ask. But only on a primary surface where it makes sense
      // (home/marketplace). Skip inner pages so it doesn't block reading.
      const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
      const primary = ['index.html', 'home.html', 'marketplace.html', ''].includes(path);
      if (primary && !CharmDB.Location.hasPrompted()) {
        setTimeout(() => openLocationModal({ firstVisit: true }), 900);
      }
      CharmDB.Location.onChange(renderLocationPill);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocation);
  } else {
    initLocation();
  }

  // Expose for other pages to trigger manually
  window.openCharmLocationModal = () => openLocationModal();

  // ── Scroll reveal fallback ────────────────────────────────────────────
  // animations.js handles [data-reveal] via GSAP/ScrollTrigger. Only wire
  // a plain IntersectionObserver fallback when GSAP is not available, and
  // never intervene if animations.js has already flagged itself as running.
  if (typeof window.gsap === 'undefined') {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (revealEls.length) {
      revealEls.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)';
      });
      const revealObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, (entry.target.dataset.delay || 0));
            revealObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      revealEls.forEach(el => revealObs.observe(el));
    }
  }

})();
