/**
 * BagBag — Full-Featured Script
 * Features: Cart (localStorage), Cart Drawer, Search, Quick View,
 *           Hero Slider, Product Filter, Wishlist, Lightbox,
 *           FAQ Accordion, Form Validation, Countdown, Toast Alerts
 */

(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════════
       1.  UTILS
    ═══════════════════════════════════════════════════════ */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const on = (el, ev, cb) => el && el.addEventListener(ev, cb);

    /* ═══════════════════════════════════════════════════════
       2.  INJECT GLOBAL UI (cart drawer + QV modal + toast)
    ═══════════════════════════════════════════════════════ */
    function injectGlobalUI() {
        // — Cart Drawer —
        if (!$('#cartDrawer')) {
            document.body.insertAdjacentHTML('beforeend', `
            <div class="cart-drawer" id="cartDrawer">
                <div class="cart-drawer__overlay" id="cartOverlay"></div>
                <div class="cart-drawer__panel">
                    <div class="cart-drawer__hdr">
                        <h3>Your Cart (<span id="cdCount">0</span>)</h3>
                        <button class="cart-drawer__close" id="cartClose">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="cart-drawer__body" id="cdBody">
                        <div class="cart-empty" id="cartEmpty">
                            <i class="fa-solid fa-bag-shopping"></i>
                            <p>Your cart is empty.</p>
                            <a href="arrivals.html" class="btn btn--dark" style="margin-top:16px;">Shop Now</a>
                        </div>
                        <ul class="cart-list" id="cartList"></ul>
                    </div>
                    <div class="cart-drawer__ftr" id="cdFtr">
                        <div class="cart-subtotal">
                            <span>Subtotal</span>
                            <span id="cdSubtotal">Rs 0</span>
                        </div>
                    <a href="checkout.html" class="btn btn--dark btn--full" style="justify-content:center;margin-top:14px;">
                        Proceed to Checkout &nbsp;<i class="fa-solid fa-arrow-right"></i>
                    </a>
                        <p class="cart-ship-note"><i class="fa-solid fa-truck-fast"></i> Free shipping on orders over Rs 5,000</p>
                    </div>
                </div>
            </div>`);
        }

        // — Quick View Modal (injected once) —
        if (!$('#qvBackdrop')) {
            document.body.insertAdjacentHTML('beforeend', `
            <div class="qv-backdrop" id="qvBackdrop">
                <div class="qv-modal" id="qvModal">
                    <button class="qv-modal__close" id="qvClose"><i class="fa-solid fa-xmark"></i></button>
                    <div class="qv-modal__body">
                        <div class="qv-modal__img-wrap"><img id="qvImg" src="" alt=""></div>
                        <div class="qv-modal__det">
                            <p class="qv-modal__cat" id="qvCat"></p>
                            <h2 class="qv-modal__title" id="qvTitle"></h2>
                            <p class="qv-modal__price" id="qvPrice"></p>
                            <p class="qv-modal__desc">Premium handcrafted leather goods that only get better with age.</p>
                            <ul class="qv-modal__specs">
                                <li><strong>Material:</strong> Full-Grain Leather</li>
                                <li><strong>Hardware:</strong> Solid Brass</li>
                                <li><strong>Lining:</strong> Canvas</li>
                            </ul>
                            <div class="qv-qty-row">
                                <button class="qv-qty__btn" id="qvMinus">−</button>
                                <span class="qv-qty__val" id="qvQty">1</span>
                                <button class="qv-qty__btn" id="qvPlus">+</button>
                            </div>
                            <button class="btn btn--dark" style="width:100%;justify-content:center;margin-top:18px;" id="qvAddCart">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>`);
        }

        // — Toast —
        if (!$('#toastBox')) {
            document.body.insertAdjacentHTML('beforeend', `<div class="toast-box" id="toastBox"></div>`);
        }

        // — Lightbox —
        if (!$('#lightbox')) {
            document.body.insertAdjacentHTML('beforeend', `
            <div class="lightbox" id="lightbox">
                <button class="lightbox__close" id="lbClose"><i class="fa-solid fa-xmark"></i></button>
                <button class="lightbox__nav lb-prev" id="lbPrev"><i class="fa-solid fa-chevron-left"></i></button>
                <img class="lightbox__img" id="lbImg" src="" alt="">
                <button class="lightbox__nav lb-next" id="lbNext"><i class="fa-solid fa-chevron-right"></i></button>
            </div>`);
        }
    }

    /* ═══════════════════════════════════════════════════════
       3.  TOAST NOTIFICATION
    ═══════════════════════════════════════════════════════ */
    function toast(msg, type = 'success') {
        const box = $('#toastBox');
        if (!box) return;
        const t = document.createElement('div');
        t.className = `toast toast--${type}`;
        t.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-xmark'}"></i> ${msg}`;
        box.appendChild(t);
        setTimeout(() => t.classList.add('toast--show'), 10);
        setTimeout(() => {
            t.classList.remove('toast--show');
            setTimeout(() => t.remove(), 400);
        }, 3200);
    }

    /* ═══════════════════════════════════════════════════════
       4.  CART  (localStorage)
    ═══════════════════════════════════════════════════════ */
    const Cart = {
        KEY: 'bagbag_cart',
        get() { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); },
        save(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); },
        add(item) {
            const items = this.get();
            const existing = items.find(i => i.id === item.id);
            if (existing) {
                existing.qty += item.qty;
            } else {
                items.push(item);
            }
            this.save(items);
            this.render();
            toast(`"${item.title}" added to cart!`);
        },
        remove(id) {
            const items = this.get().filter(i => i.id !== id);
            this.save(items);
            this.render();
            toast('Item removed from cart.', 'error');
        },
        updateQty(id, delta) {
            const items = this.get();
            const item = items.find(i => i.id === id);
            if (item) {
                item.qty = Math.max(1, item.qty + delta);
                this.save(items);
                this.render();
            }
        },
        clear() { this.save([]); this.render(); },
        count() { return this.get().reduce((s, i) => s + i.qty, 0); },
        subtotal() {
            return this.get().reduce((s, i) => {
                const num = parseInt(i.price.replace(/[^\d]/g, ''), 10) || 0;
                return s + num * i.qty;
            }, 0);
        },
        render() {
            const items  = this.get();
            const count  = this.count();
            const badges = $$('.cart-badge');
            badges.forEach(b => { b.textContent = count; b.style.display = count ? 'flex' : 'none'; });

            const cdCount   = $('#cdCount');
            const cartList  = $('#cartList');
            const cartEmpty = $('#cartEmpty');
            const cdFtr     = $('#cdFtr');
            const cdSub     = $('#cdSubtotal');

            if (cdCount)  cdCount.textContent = count;
            if (cdSub)    cdSub.textContent = 'Rs ' + this.subtotal().toLocaleString();

            if (!cartList) return;

            if (items.length === 0) {
                cartList.innerHTML = '';
                cartEmpty && (cartEmpty.style.display = 'flex');
                cdFtr     && (cdFtr.style.display = 'none');
            } else {
                cartEmpty && (cartEmpty.style.display = 'none');
                cdFtr     && (cdFtr.style.display = 'block');
                cartList.innerHTML = items.map(item => `
                    <li class="cart-item" data-id="${item.id}">
                        <img src="${item.img}" alt="${item.title}" class="cart-item__img">
                        <div class="cart-item__info">
                            <p class="cart-item__name">${item.title}</p>
                            <p class="cart-item__cat">${item.cat}</p>
                            <p class="cart-item__price">${item.price}</p>
                            <div class="cart-item__qty">
                                <button class="cq-btn" data-action="dec" data-id="${item.id}">−</button>
                                <span>${item.qty}</span>
                                <button class="cq-btn" data-action="inc" data-id="${item.id}">+</button>
                            </div>
                        </div>
                        <button class="cart-item__del" data-id="${item.id}" title="Remove">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </li>`).join('');

                // Delegate cart item actions
                $$('.cq-btn', cartList).forEach(btn => {
                    on(btn, 'click', () => {
                        const id = btn.getAttribute('data-id');
                        Cart.updateQty(id, btn.getAttribute('data-action') === 'inc' ? 1 : -1);
                    });
                });
                $$('.cart-item__del', cartList).forEach(btn => {
                    on(btn, 'click', () => Cart.remove(btn.getAttribute('data-id')));
                });
            }
        }
    };

    /* ═══════════════════════════════════════════════════════
       5.  CART DRAWER
    ═══════════════════════════════════════════════════════ */
    function initCartDrawer() {
        const drawer  = $('#cartDrawer');
        const overlay = $('#cartOverlay');
        const closeBtn = $('#cartClose');

        const openDrawer  = () => drawer && drawer.classList.add('open');
        const closeDrawer = () => drawer && drawer.classList.remove('open');

        // All cart icon clicks
        $$('.cart-icon, .cart-icon-btn').forEach(el => on(el, 'click', openDrawer));
        on(overlay,  'click', closeDrawer);
        on(closeBtn, 'click', closeDrawer);
    }

    /* ═══════════════════════════════════════════════════════
       6.  HEADER: scroll + spy
    ═══════════════════════════════════════════════════════ */
    function initHeader() {
        const hdr  = $('#hdr');
        const navLinks = $$('.hnav__link');
        const sections = $$('section[id]');

        const spyNav = () => {
            let cur = '';
            sections.forEach(s => {
                if (window.scrollY >= s.offsetTop - 130) cur = s.id;
            });
            navLinks.forEach(l => {
                if (l.getAttribute('data-sec')) {
                    l.classList.toggle('active', l.getAttribute('data-sec') === cur);
                }
            });
        };

        window.addEventListener('scroll', () => {
            hdr && hdr.classList.toggle('scrolled', window.scrollY > 30);
            spyNav();
        }, { passive: true });
    }

    /* ═══════════════════════════════════════════════════════
       7.  MOBILE NAV
    ═══════════════════════════════════════════════════════ */
    function initMobileNav() {
        const burger   = $('#burgerBtn');
        const mainNav  = $('#mainNav');
        const navClose = $('#navClose');
        const navOvl   = $('#navOverlay');

        const openNav  = () => { mainNav?.classList.add('open');    navOvl?.classList.add('show'); };
        const closeNav = () => { mainNav?.classList.remove('open'); navOvl?.classList.remove('show'); };

        on(burger,   'click', openNav);
        on(navClose, 'click', closeNav);
        on(navOvl,   'click', closeNav);

        // Close on link click (mobile)
        $$('.hnav__link').forEach(l => on(l, 'click', () => {
            if (window.innerWidth < 769) closeNav();
        }));

        window._closeNav = closeNav;
    }

    /* ═══════════════════════════════════════════════════════
       8.  SEARCH (full-screen overlay)
    ═══════════════════════════════════════════════════════ */
    function injectSearchOverlay() {
        if ($('#searchOverlay')) return;
        document.body.insertAdjacentHTML('beforeend', `
        <div class="search-overlay" id="searchOverlay">
            <div class="search-overlay__box">
                <button class="search-overlay__close" id="soClose"><i class="fa-solid fa-xmark"></i></button>
                <p class="search-overlay__hint">What are you looking for?</p>
                <div class="search-overlay__field">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="soInput" placeholder="bags, backpacks, sling…" autocomplete="off">
                </div>
                <div class="search-overlay__results" id="soResults"></div>
                <p class="search-overlay__sub">Popular: <a href="arrivals.html?q=backpack">Backpacks</a> · <a href="arrivals.html?q=sling">Sling Bags</a> · <a href="sale.html">Sale</a></p>
            </div>
        </div>`);
    }

    function initSearch() {
        injectSearchOverlay();

        const overlay = $('#searchOverlay');
        const soInput = $('#soInput');
        const soResults = $('#soResults');
        const soClose = $('#soClose');

        const openSearch = () => {
            overlay?.classList.add('open');
            setTimeout(() => soInput?.focus(), 80);
        };
        const closeSearch = () => overlay?.classList.remove('open');

        // All search triggers
        $$('#searchOpen, .search-trigger').forEach(el => on(el, 'click', openSearch));
        on(soClose, 'click', closeSearch);
        on(overlay, 'click', e => { if (e.target === overlay) closeSearch(); });

        // All products catalogue (for live search)
        const ALL_PRODUCTS = [
            { title:'Urban Explorer Pack', cat:'Men · Backpack', price:'Rs 12,900', img:'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=300&q=60', link:'arrivals.html?q=backpack' },
            { title:'Elegant Leather Sling', cat:'Women · Sling', price:'Rs 6,900', img:'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=300&q=60', link:'arrivals.html?q=sling' },
            { title:'Minimalist Crossbody', cat:'Men · Sling', price:'Rs 5,500', img:'https://images.unsplash.com/photo-1554336416-caeb280c4109?auto=format&fit=crop&w=300&q=60', link:'arrivals.html?q=sling' },
            { title:'Classic Canvas Backpack', cat:'Women · Backpack', price:'Rs 9,500', img:'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=300&q=60', link:'arrivals.html?q=backpack' },
            { title:'Nomad Travel Pack', cat:'Men · Travel', price:'Rs 14,500', img:'https://images.unsplash.com/photo-1553531580-60ce379f8319?auto=format&fit=crop&w=300&q=60', link:'arrivals.html?q=backpack' },
            { title:'Premium Leather Tote', cat:'Women · Tote', price:'Rs 21,000', img:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=300&q=60', link:'arrivals.html?q=women' },
            { title:'ROCCO 1PC - Blue', cat:'Women · Leather', price:'Rs 2,999', img:'../images/WhatsApp Image 2026-03-16 at 1.57.42 PM (3).jpeg', link:'sale.html' },
            { title:'ROCCO 1PC - Black', cat:'Women · Leather', price:'Rs 4,999', img:'../images/WhatsApp Image 2026-03-16 at 1.57.42 PM (7).jpeg', link:'sale.html' },
        ];

        let debounceTimer;
        on(soInput, 'input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const q = soInput.value.trim().toLowerCase();
                if (!q) { soResults.innerHTML = ''; return; }
                const hits = ALL_PRODUCTS.filter(p =>
                    p.title.toLowerCase().includes(q) ||
                    p.cat.toLowerCase().includes(q)
                );
                if (hits.length === 0) {
                    soResults.innerHTML = `<p class="so-no-results">No results for "<strong>${q}</strong>". <a href="arrivals.html">Browse all products →</a></p>`;
                } else {
                    soResults.innerHTML = hits.map(p => `
                        <a class="so-result" href="${p.link}">
                            <img src="${p.img}" alt="${p.title}">
                            <div><p class="so-result__name">${p.title}</p><p class="so-result__cat">${p.cat} · ${p.price}</p></div>
                        </a>`).join('');
                }
            }, 220);
        });

        // Enter → go to arrivals with q param
        on(soInput, 'keydown', e => {
            if (e.key === 'Enter' && soInput.value.trim()) {
                window.location.href = `arrivals.html?q=${encodeURIComponent(soInput.value.trim())}`;
            }
        });
    }

    /* ═══════════════════════════════════════════════════════
       9.  WISHLIST  (localStorage)
    ═══════════════════════════════════════════════════════ */
    const Wishlist = {
        KEY: 'bagbag_wish',
        get() { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); },
        toggle(id, title) {
            let items = this.get();
            const idx = items.indexOf(id);
            if (idx > -1) {
                items.splice(idx, 1);
                toast(`Removed from wishlist.`, 'error');
            } else {
                items.push(id);
                toast(`"${title}" added to wishlist!`);
            }
            localStorage.setItem(this.KEY, JSON.stringify(items));
            this.updateUI();
        },
        isWished(id) { return this.get().includes(id); },
        updateUI() {
            $$('.pcard__wish').forEach(btn => {
                const card = btn.closest('[data-cat]');
                const id = card?.querySelector('.pcard__qv')?.dataset.title || '';
                const wished = id && this.isWished(id);
                btn.querySelector('i').className = wished ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                btn.style.color = wished ? '#e11d48' : '';
            });
        }
    };

    /* ═══════════════════════════════════════════════════════
       10. QUICK VIEW MODAL
    ═══════════════════════════════════════════════════════ */
    function initQuickView() {
        const backdrop = $('#qvBackdrop');
        if (!backdrop) return;

        const qvClose  = $('#qvClose');
        const qvMinus  = $('#qvMinus');
        const qvPlus   = $('#qvPlus');
        const qvQty    = $('#qvQty');
        const qvAddBtn = $('#qvAddCart');
        let currentItem = null;

        const openQV  = () => backdrop.classList.add('open');
        const closeQV = () => backdrop.classList.remove('open');

        // Bind QV buttons (delegated for dynamically injected content)
        document.addEventListener('click', e => {
            const btn = e.target.closest('.pcard__qv');
            if (!btn) return;
            const d = btn.dataset;
            currentItem = {
                id:    d.title,
                title: d.title,
                price: d.price,
                cat:   d.cat,
                img:   d.src,
                qty:   1
            };
            $('#qvImg').src    = d.src;
            $('#qvTitle').textContent = d.title;
            $('#qvPrice').textContent = d.price;
            $('#qvCat').textContent   = d.cat;
            $('#qvAddCart').textContent = `Add to Cart — ${d.price}`;
            if (qvQty) qvQty.textContent = '1';
            openQV();
        });

        on(qvClose, 'click', closeQV);
        on(backdrop, 'click', e => { if (e.target === backdrop) closeQV(); });

        let qty = 1;
        on(qvMinus, 'click', () => { qty = Math.max(1, qty - 1); qvQty && (qvQty.textContent = qty); });
        on(qvPlus,  'click', () => { qty++;                        qvQty && (qvQty.textContent = qty); });

        on(qvAddBtn, 'click', () => {
            if (!currentItem) return;
            Cart.add({ ...currentItem, qty });
            closeQV();
            qty = 1;
            if (qvQty) qvQty.textContent = '1';
            // Open cart drawer
            $('#cartDrawer')?.classList.add('open');
        });
    }

    /* ═══════════════════════════════════════════════════════
       11. WISHLIST BUTTON CLICKS
    ═══════════════════════════════════════════════════════ */
    function initWishlistBtns() {
        document.addEventListener('click', e => {
            const btn = e.target.closest('.pcard__wish');
            if (!btn) return;
            const card  = btn.closest('[data-cat]');
            const title = card?.querySelector('.pcard__qv')?.dataset.title || 'Item';
            Wishlist.toggle(title, title);
        });
        Wishlist.updateUI();
    }

    /* ═══════════════════════════════════════════════════════
       12. PRODUCT FILTERS  (on pages that have filters)
    ═══════════════════════════════════════════════════════ */
    function initFilters() {
        const fpills = $$('.fpill');
        const pcards = $$('.pcard');
        if (!fpills.length || !pcards.length) return;

        const applyFilter = (val, animate = true) => {
            fpills.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === val));
            pcards.forEach(p => {
                const cats = p.getAttribute('data-cat').toLowerCase();
                const show = val === 'all' || cats.includes(val);
                if (animate) {
                    p.style.transition = 'opacity .3s, transform .3s';
                    if (show) {
                        p.style.display = 'block';
                        requestAnimationFrame(() => { p.style.opacity = '1'; p.style.transform = ''; });
                    } else {
                        p.style.opacity = '0';
                        p.style.transform = 'scale(.95)';
                        setTimeout(() => { if (!cats.includes(val) && val !== 'all') p.style.display = 'none'; }, 300);
                    }
                } else {
                    p.style.display = show ? 'block' : 'none';
                }
            });
        };

        fpills.forEach(b => on(b, 'click', () => applyFilter(b.getAttribute('data-filter'))));

        // URL param: arrivals.html?q=backpack
        const urlQ = new URLSearchParams(window.location.search).get('q');
        if (urlQ) {
            const matched = fpills.find(b => b.getAttribute('data-filter').toLowerCase().includes(urlQ.toLowerCase()));
            if (matched) applyFilter(matched.getAttribute('data-filter'), false);
        }
    }

    /* ═══════════════════════════════════════════════════════
       13. CATEGORY CARD CLICKS → filter on arrivals page
    ═══════════════════════════════════════════════════════ */
    function initCatCards() {
        $$('.cat-card').forEach(card => {
            on(card, 'click', e => {
                const filter = card.getAttribute('data-filter');
                const href = card.getAttribute('href') || '#';
                if (href.startsWith('arrivals') || href.includes('arrivals')) {
                    e.preventDefault();
                    window.location.href = `arrivals.html?q=${filter}`;
                }
            });
        });
    }

    /* ═══════════════════════════════════════════════════════
       14. HERO SLIDER
    ═══════════════════════════════════════════════════════ */
    function initHeroSlider() {
        const track    = $('#heroTrack');
        const slides   = $$('.hero__slide');
        const dotsWrap = $('#heroDots');
        const prevBtn  = $('#heroPrev');
        const nextBtn  = $('#heroNext');
        if (!slides.length || !track) return;

        let cur = 0, timer;

        slides.forEach((_, i) => {
            const d = document.createElement('div');
            d.className = 'hero__dot' + (i === 0 ? ' active' : '');
            on(d, 'click', () => goTo(i));
            dotsWrap?.appendChild(d);
        });

        const getDots = () => $$('.hero__dot');

        const goTo = (idx) => {
            getDots().forEach(d => d.classList.remove('active'));
            slides.forEach(s => s.classList.remove('active'));
            cur = (idx + slides.length) % slides.length;
            track.style.transform = `translateX(-${cur * 100}%)`;
            getDots()[cur]?.classList.add('active');
            slides[cur].classList.add('active');
            clearInterval(timer);
            timer = setInterval(() => goTo(cur + 1), 5500);
        };

        on(prevBtn, 'click', () => goTo(cur - 1));
        on(nextBtn, 'click', () => goTo(cur + 1));
        slides[0].classList.add('active');
        timer = setInterval(() => goTo(1), 5500);

        // Touch swipe
        let tx = 0;
        on(track, 'touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
        on(track, 'touchend', e => {
            const diff = tx - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) goTo(diff > 0 ? cur + 1 : cur - 1);
        });
    }

    /* ═══════════════════════════════════════════════════════
       15. GALLERY LIGHTBOX (with prev/next)
    ═══════════════════════════════════════════════════════ */
    function initLightbox() {
        const lb     = $('#lightbox');
        const lbImg  = $('#lbImg');
        const lbClose = $('#lbClose');
        const lbPrev  = $('#lbPrev');
        const lbNext  = $('#lbNext');
        if (!lb) return;

        let imgs = [];
        let cur  = 0;

        const refreshGalleryImgs = () => {
            imgs = $$('.gitem img');
        };

        const showLb = (idx) => {
            refreshGalleryImgs();
            cur = (idx + imgs.length) % imgs.length;
            lbImg.src = imgs[cur]?.src || '';
            lb.classList.add('open');
        };

        document.addEventListener('click', e => {
            const item = e.target.closest('.gitem');
            if (!item) return;
            refreshGalleryImgs();
            const idx = imgs.indexOf(item.querySelector('img'));
            showLb(idx >= 0 ? idx : 0);
        });

        on(lbClose, 'click', () => lb.classList.remove('open'));
        on(lb, 'click', e => { if (e.target === lb) lb.classList.remove('open'); });
        on(lbPrev, 'click', e => { e.stopPropagation(); showLb(cur - 1); });
        on(lbNext, 'click', e => { e.stopPropagation(); showLb(cur + 1); });
    }

    /* ═══════════════════════════════════════════════════════
       16. FAQ ACCORDION
    ═══════════════════════════════════════════════════════ */
    function initFAQ() {
        $$('.faq__item').forEach(item => {
            const q   = item.querySelector('.faq__q');
            const ans = item.querySelector('.faq__ans');
            on(q, 'click', () => {
                const isOpen = item.classList.contains('open');
                $$('.faq__item').forEach(fi => {
                    fi.classList.remove('open');
                    fi.querySelector('.faq__ans').style.maxHeight = null;
                });
                if (!isOpen) {
                    item.classList.add('open');
                    ans.style.maxHeight = ans.scrollHeight + 'px';
                }
            });
        });
    }

    /* ═══════════════════════════════════════════════════════
       17. CONTACT / FEEDBACK FORM
    ═══════════════════════════════════════════════════════ */
    function initForms() {
        const form = $('#cform');
        if (!form) return;

        const setErr = (id, msg) => {
            const el = $('#' + id);
            if (el) el.textContent = msg;
        };

        on(form, 'submit', e => {
            e.preventDefault();
            ['cname-err', 'cemail-err', 'cmsg-err'].forEach(id => setErr(id, ''));

            const name  = $('#cf-name')?.value.trim()  ?? '';
            const email = $('#cf-email')?.value.trim() ?? '';
            const msg   = $('#cf-msg')?.value.trim()   ?? '';
            let ok = true;

            if (!name)  { setErr('cname-err', 'Name is required.'); ok = false; }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setErr('cemail-err', 'Valid email required.'); ok = false;
            }
            if (!msg)   { setErr('cmsg-err', 'Message required.'); ok = false; }

            if (ok) {
                form.reset();
                const s = $('#cform-ok');
                s?.classList.remove('hidden');
                toast('Message sent! We\'ll reply within 24 hours.');
                setTimeout(() => s?.classList.add('hidden'), 5000);
            }
        });
    }

    /* ═══════════════════════════════════════════════════════
       18. DOWNLOAD CATALOG
    ═══════════════════════════════════════════════════════ */
    function initDownload() {
        const dlBtn = $('#dlBtn');
        if (!dlBtn) return;
        on(dlBtn, 'click', () => {
            const orig = dlBtn.innerHTML;
            dlBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> &nbsp;Preparing...';
            dlBtn.disabled = true;
            setTimeout(() => {
                toast('Catalog downloaded!');
                dlBtn.innerHTML = '<i class="fa-solid fa-check"></i> &nbsp;Downloaded!';
                setTimeout(() => { dlBtn.innerHTML = orig; dlBtn.disabled = false; }, 3000);
            }, 1500);
        });
    }

    /* ═══════════════════════════════════════════════════════
       19. COUNTDOWN TIMER  (sale page)
    ═══════════════════════════════════════════════════════ */
    function initCountdown() {
        const cdDays = $('#cdDays');
        if (!cdDays) return;
        const end = new Date();
        end.setDate(end.getDate() + 3);
        const tick = () => {
            const diff = end - new Date();
            if (diff < 0) return;
            cdDays.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
            $('#cdHrs').textContent = String(Math.floor(diff % 86400000 / 3600000)).padStart(2, '0');
            $('#cdMin').textContent = String(Math.floor(diff % 3600000 / 60000)).padStart(2, '0');
            $('#cdSec').textContent = String(Math.floor(diff % 60000 / 1000)).padStart(2, '0');
        };
        tick();
        setInterval(tick, 1000);
    }

    /* ═══════════════════════════════════════════════════════
       20. STAR RATING (feedback page)
    ═══════════════════════════════════════════════════════ */
    function initStarRating() {
        const labels = ['', 'Not happy 😕', 'Could be better 🙁', 'Good experience 🙂', 'Really happy! 😊', 'Absolutely loved it! ⭐😍'];
        $$('.star-rating input').forEach(inp => {
            on(inp, 'change', () => {
                const lbl = $('#starLabel');
                if (lbl) lbl.textContent = labels[parseInt(inp.value)] || '';
            });
        });
    }

    /* ═══════════════════════════════════════════════════════
       21. ESCAPE KEY  (close all overlays)
    ═══════════════════════════════════════════════════════ */
    function initEscape() {
        on(document, 'keydown', e => {
            if (e.key !== 'Escape') return;
            $('#qvBackdrop')?.classList.remove('open');
            $('#lightbox')?.classList.remove('open');
            $('#searchOverlay')?.classList.remove('open');
            $('#cartDrawer')?.classList.remove('open');
            window._closeNav?.();
        });
    }

    /* ═══════════════════════════════════════════════════════
       INIT ALL
    ═══════════════════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', () => {
        injectGlobalUI();
        Cart.render();         // restore cart from localStorage
        initCartDrawer();
        initHeader();
        initMobileNav();
        initSearch();
        initQuickView();
        initWishlistBtns();
        initFilters();
        initCatCards();
        initHeroSlider();
        initLightbox();
        initFAQ();
        initForms();
        initDownload();
        initCountdown();
        initStarRating();
        initEscape();
    });

})();
