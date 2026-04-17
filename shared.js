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

    const heading = firstVisit ? "Where are you based?" : "Change location";
    const sub = firstVisit
      ? "Charm shows listings near you by default. You can change this anytime from the nav."
      : "Pick a city to see nearby listings, or switch to all locations.";

    modal.innerHTML = `
      <div style="
        background:#0d0d1a; border:1px solid rgba(255,255,255,0.1); border-radius:14px;
        padding:28px 28px 24px; width:min(460px, calc(100vw - 48px));
        box-shadow:0 24px 80px rgba(0,0,0,0.55);
        transform:translateY(12px); opacity:0;
        transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s;
      " id="charm-loc-card">
        <div style="font-family:'Syne',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#e2a84b; margin-bottom:8px;">📍 Location</div>
        <h2 style="font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:500; color:#f0ece3; margin:0 0 8px; line-height:1.1; letter-spacing:-0.3px;">${heading}</h2>
        <p style="font-family:'DM Sans',sans-serif; font-size:13.5px; color:#9896a8; line-height:1.55; margin:0 0 22px;">${sub}</p>
        <div id="charm-loc-options" style="display:flex; flex-direction:column; gap:6px; margin-bottom:18px; max-height:320px; overflow-y:auto;"></div>
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
    });
  }

  function closeLocationModal() {
    const modal = document.getElementById('charm-loc-modal');
    if (!modal) return;
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 220);
  }

  function renderLocationPill() {
    const navRight = document.querySelector('.nav-right, .nav .btn-ghost')?.parentElement;
    if (!navRight) return;
    let pill = document.getElementById('charm-loc-pill');
    const city = CharmDB.Location.get();
    const label = city || 'All locations';

    if (!pill) {
      pill = document.createElement('button');
      pill.id = 'charm-loc-pill';
      pill.setAttribute('aria-label', 'Change location');
      pill.style.cssText = `
        display:inline-flex; align-items:center; gap:6px;
        height:34px; padding:0 12px; border-radius:8px;
        border:1px solid rgba(255,255,255,0.13);
        background:rgba(255,255,255,0.05); color:#9896a8;
        font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:500;
        cursor:pointer; transition:color 0.2s, background 0.2s, border-color 0.2s;
        flex-shrink:0; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      `;
      pill.addEventListener('mouseenter', () => { pill.style.color = '#e2a84b'; pill.style.borderColor = 'rgba(226,168,75,0.35)'; });
      pill.addEventListener('mouseleave', () => { pill.style.color = '#9896a8'; pill.style.borderColor = 'rgba(255,255,255,0.13)'; });
      pill.addEventListener('click', () => openLocationModal());
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) navRight.insertBefore(pill, themeToggle);
      else navRight.insertBefore(pill, navRight.firstChild);
    }
    pill.innerHTML = `<span style="font-size:13px;">📍</span><span>${label}</span>`;
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
