// ============== UTILITIES ==============
const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const qs  = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

// ============== NAV & DROPDOWN (mobile-friendly + dropdown reset) ==============
document.addEventListener('DOMContentLoaded', () => {
  const btn = qs('.mobile-menu-btn');
  const nav = qs('#main-nav');
  const backdrop = qs('.nav-backdrop');

  // დახუროს ყველა dropdown
  const closeAllDropdowns = (root = document) => {
    qsa('.dropdown', root).forEach(dd => {
      dd.classList.remove('active');
      const t = qs(':scope > a', dd);
      if (t) t.setAttribute('aria-expanded','false');
    });
  };

  if (btn && nav) {
    const setOpen = (open) => {
      if (open) closeAllDropdowns(nav); // გახსნისას სუფთა მდგომარეობა
      nav.classList.toggle('active', open);
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    const toggleMenu = () => setOpen(!nav.classList.contains('active'));

    btn.setAttribute('aria-controls','main-nav');
    btn.setAttribute('aria-expanded','false');
    btn.addEventListener('click', toggleMenu);

    // მობილურზე: dropdown-ის შიგნით კლიკები არ უნდა დაკეტოს მენიუ
   nav.addEventListener('click', (e) => {
  //ignore clicks *anywhere inside* dropdown area on mobile
  if (window.innerWidth < 768 && (e.target.closest('.dropdown') || e.target.closest('.dropdown-menu'))) return;

  const a = e.target.closest('a');
  if (!a) return;
  const isHashOnly = (a.getAttribute('href') || '').trim() === '#';
  if (window.innerWidth < 768 && !isHashOnly) {
    closeAllDropdowns(nav);
    setOpen(false);
  }
});

    // backdrop → სრულად დახურვა
    backdrop?.addEventListener('click', () => { closeAllDropdowns(nav); setOpen(false); });

    // desktop-ზე გადასვლისას დაიკეტოს
    window.addEventListener('resize', () => { if (window.innerWidth >= 769) { closeAllDropdowns(nav); setOpen(false); } });

    // bfcache/დაბრუნებისას — ყოველთვის დახურული dropdown-ები
    window.addEventListener('pageshow', () => { closeAllDropdowns(nav); });
  }

  // Dropdowns: desktop=hover, mobile=click
  qsa('.dropdown').forEach(dd => {
    const trigger = qs(':scope > a', dd);
    const menu = qs('.dropdown-menu', dd);
    if (!trigger || !menu) return;

    const open  = () => { dd.classList.add('active');  trigger.setAttribute('aria-expanded','true');  };
    const close = () => { dd.classList.remove('active'); trigger.setAttribute('aria-expanded','false'); };

    trigger.setAttribute('aria-haspopup','true');
    trigger.setAttribute('aria-expanded','false');

    // Desktop hover
    trigger.addEventListener('mouseenter', () => { if (window.innerWidth >= 768) open(); });
    dd.addEventListener('mouseleave',       () => { if (window.innerWidth >= 768) close(); });

    // Mobile click — შევაჩეროთ ბაბლი, თორემ nav-click დახურავს
   trigger.addEventListener('click', (e) => {
  if (window.innerWidth < 768) {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation(); // <- ახალიც
    dd.classList.toggle('active');
    trigger.setAttribute('aria-expanded', dd.classList.contains('active') ? 'true' : 'false');
  }
});


    // ჩამოშლილ მენიუში პროდუქტზე დაჭერისას — დავკეტოთ ორივე
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      if (window.innerWidth < 768 && (a.getAttribute('href') || '#') !== '#') {
        closeAllDropdowns(qs('#main-nav'));
        document.body.classList.remove('menu-open');
        qs('#main-nav').classList.remove('active');
      }
    });

    // Desktop outside click
    document.addEventListener('click', (e) => {
      if (window.innerWidth >= 768 && !dd.contains(e.target)) close();
    });
  });
});

// ============== PRODUCT CARDS CLICKABLE ==============
document.addEventListener('DOMContentLoaded', () => {
  qsa('.product-card').forEach(card => {
    const link = card.matches('a[href]') ? card : qs('a[href]', card);
    if (!link) return;
    card.addEventListener('click', e => { if (!e.target.closest('a')) window.location.href = link.getAttribute('href'); });
    card.style.cursor = 'pointer';
  });
});

// ============== SLIDER (with keyboard) ==============
document.addEventListener('DOMContentLoaded', () => {
  const slider = qs('.custom-slider');
  const nextBtn = qs('.slider-btn.next');
  const prevBtn = qs('.slider-btn.prev');
  if (!slider || !nextBtn || !prevBtn) return;

  nextBtn.addEventListener('click', () => slider.scrollBy({ left: 300,  behavior: 'smooth' }));
  prevBtn.addEventListener('click', () => slider.scrollBy({ left: -300, behavior: 'smooth' }));

  slider.setAttribute('tabindex', '0');
  slider.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') slider.scrollBy({ left: 300,  behavior: 'smooth' });
    if (e.key === 'ArrowLeft')  slider.scrollBy({ left: -300, behavior: 'smooth' });
  });
});

// ============== PRICE LOADER (JSON -> slider + related) ==============
(function () {
  let PRICES_MAP = null;
  const processedCards = new WeakSet();

  // matches: "products/x.html", "./products/x.html", "/products/x.html", "./x.html"
  const getSlugFromHref = (href) => {
    const m = (href || '').match(/(?:^|\.?\/)?products\/([^\/]+)\.html$/) ||
              (href || '').match(/(?:^|\.?\/)?\.?\/([^\/]+)\.html$/);
    return m ? m[1] : null;
  };

  const findPriceP = (card) => qs('.price', card) || qs('.product-info p:last-of-type', card) || null;

  function ensurePriceSpanForCard(card) {
    if (processedCards.has(card)) return;
    const link = card.matches('a[href]') ? card : qs('a[href]', card);
    const priceEl = findPriceP(card);
    if (!link || !priceEl) return;
    const slug = getSlugFromHref(link.getAttribute('href'));
    if (!slug) return;

    let span = qs('[data-price-slug]', priceEl);
    if (!span) {
      const text = (priceEl.textContent || '—').trim();
      priceEl.textContent = '';
      span = document.createElement('span');
      span.textContent = text;
      priceEl.appendChild(span);
    }
    span.setAttribute('data-price-slug', slug);
    processedCards.add(card);
  }

  const ensureSliderPriceSpans = (root = document) => qsa('.custom-slider .product-card', root).forEach(ensurePriceSpanForCard);
  const ensureGridPriceSpans   = (root = document) => qsa('.related-products .product-grid .product-card', root).forEach(ensurePriceSpanForCard);

  function applyPrices(ctx = document) {
    if (!PRICES_MAP) return;
    qsa('[data-price-slug]', ctx).forEach(el => {
      const slug = el.getAttribute('data-price-slug');
      const v = PRICES_MAP[slug];
      if (v) el.textContent = v;
    });
  }

  function getPricesUrl() {
    const scriptEl = qs('script[src$="main.js"]') || document.currentScript;
    const base = new URL(scriptEl.getAttribute('src'), window.location.href);
    const root = new URL('.', base).href;
    const u = new URL('assets/data/prices.json', root);
    u.searchParams.set('_', Date.now());
    return u.href;
  }

  async function loadPrices() {
    if (PRICES_MAP) return PRICES_MAP;
    const res = await fetch(getPricesUrl(), { cache: 'no-store' });
    if (!res.ok) throw new Error('prices.json not found');
    const data = await res.json();
    PRICES_MAP = (data && data.items) ? data.items : {};
    return PRICES_MAP;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await loadPrices();
      // Ensure spans then apply prices
      ensureSliderPriceSpans(document);
      ensureGridPriceSpans(document);
      applyPrices(document);

      // Observe slider
      const slider = qs('.custom-slider');
      if (slider) {
        const onMutSlider = debounce(() => { ensureSliderPriceSpans(slider); applyPrices(slider); }, 60);
        const moS = new MutationObserver(muts => {
          for (const m of muts) if (m.type === 'childList' && m.addedNodes.length) return onMutSlider();
        });
        moS.observe(slider, { childList: true });
        setTimeout(() => { ensureSliderPriceSpans(slider); applyPrices(slider); }, 120);
      }

      // Observe related grid (product pages)
      const grid = qs('.related-products .product-grid');
      if (grid) {
        const onMutGrid = debounce(() => { ensureGridPriceSpans(grid); applyPrices(grid); }, 60);
        const moG = new MutationObserver(muts => {
          for (const m of muts) if (m.type === 'childList' && m.addedNodes.length) return onMutGrid();
        });
        moG.observe(grid, { childList: true });
        setTimeout(() => { ensureGridPriceSpans(grid); applyPrices(grid); }, 120);
      }
    } catch (err) {
      console.warn('Price updater error', err);
    }
  });

  // manual refresh if needed
  window.refreshPrices = () => { ensureSliderPriceSpans(document); ensureGridPriceSpans(document); applyPrices(document); };
})();
