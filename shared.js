/* ─── Charm Shared Utilities ─────────────────────────────────────────── */

(function () {
  'use strict';

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
        <a href="#" style="color:#e2a84b; text-decoration:none;">Learn more</a>
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

  // ── Scroll reveal ─────────────────────────────────────────────────────
  // Auto-apply to any element with data-reveal attribute
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    revealEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)';
    });
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
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

})();
