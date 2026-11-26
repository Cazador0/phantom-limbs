/*
 * Phantom Limbs — page behaviour.
 * No dependencies. Reads its content from window.PL (data/site-data.js).
 */
(function () {
  'use strict';

  var PL = window.PL || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Create an element. `attrs.text` sets textContent; everything else is an attribute. */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] == null || attrs[k] === false) return;
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  /** Only http(s), mailto and same-site paths are ever written into href/src. */
  function safeUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return '';
    var u = url.trim();
    if (/^(https?:|mailto:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.indexOf('//') === 0) return '';
    return u;
  }

  function show(node, on) { if (node) node.hidden = !on; }

  /* ------------------------------------------------------------------
     Sections that only exist when they have content
     ------------------------------------------------------------------ */
  function setSection(id, on) {
    show(document.getElementById(id), on);
    $$('[data-nav="' + id + '"]').forEach(function (li) { show(li, on); });
  }

  /* ------------------------------------------------------------------
     Horizontal scrollers: arrow buttons and edge fades (#band, #watch reels)
     ------------------------------------------------------------------ */
  function bindScroller(wrap, track, itemSel, controls, prev, next) {
    if (!wrap || !track) return;
    var ticking = false;
    function state() {
      ticking = false;
      var max = track.scrollWidth - track.clientWidth - 2;
      var canScroll = max > 0;
      var atStart = track.scrollLeft <= 2, atEnd = track.scrollLeft >= max;
      wrap.classList.toggle('is-scrollable', canScroll);
      wrap.classList.toggle('at-start', atStart);
      wrap.classList.toggle('at-end', atEnd);
      show(controls, canScroll);
      track.tabIndex = canScroll ? 0 : -1;
      var toPrev = atEnd && document.activeElement === next && prev && !atStart;
      var toNext = atStart && document.activeElement === prev && next && !atEnd;
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
      if (toPrev) prev.focus();
      else if (toNext) next.focus();
    }
    function step(dir) {
      var card = $(itemSel, track);
      if (!card) return;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(state); } }, { passive: true });
    window.addEventListener('resize', state);
    state();
  }

  function initBand() {
    var wrap = $('[data-band]');
    if (!wrap) return;
    var track = $('.band', wrap);
    initBandMemberDialog(track);
    bindScroller(wrap, track, '.band-member', $('.band__controls', wrap), $('[data-band-prev]', wrap), $('[data-band-next]', wrap));
  }

  /*
   * Enlarged member card. Only cards with a portrait <img> open the dialog;
   * initials-only placeholders become static cards until a portrait is added.
   * Prev/next, arrow keys and swipes step through members without closing.
   */
  function initBandMemberDialog(track) {
    var rawCards = $$('.band-member__card', track);
    var cards = [];
    rawCards.forEach(function (c) {
      var hasImg = !!$('img', $('.band-member__portrait', c));
      if (hasImg) {
        cards.push(c);
      } else {
        var box = el('div', { class: 'band-member__card band-member__card--static' });
        while (c.firstChild) box.appendChild(c.firstChild);
        c.parentNode.replaceChild(box, c);
      }
    });
    var dialog = $('[data-band-member-dialog]');
    if (!cards.length || !dialog || !dialog.showModal) return;
    var big = $('[data-band-member-card]', dialog);
    var portrait = $('[data-band-member-portrait]', dialog);
    var photosWrap = $('[data-band-member-photos]', dialog);
    var nameEl = $('[data-band-member-name]', dialog);
    var roleEl = $('[data-band-member-role]', dialog);
    var navWrap = $('.band-member-dialog__nav', dialog);
    var count = $('[data-band-member-count]', dialog);
    var index = 0, photoIndex = 0, closing = false;
    var EASE = 'cubic-bezier(.2,.7,.2,1)';
    show(navWrap, cards.length > 1);

    function memberSlugs(src) {
      return String(src.getAttribute('data-photos') || '')
        .split(',')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return /^[a-z0-9-]+$/.test(s); });
    }

    function makePortrait(slug, altText) {
      var base = safeUrl('assets/img/members/' + slug);
      return el('picture', {}, [
        el('source', { type: 'image/webp', srcset: base + '-400.webp 400w, ' + base + '-880.webp 880w', sizes: '(max-width: 520px) 90vw, 440px' }),
        el('img', { src: base + '-880.jpg', alt: altText, width: '880', height: '1100', decoding: 'async' })
      ]);
    }

    function paintPhoto(src, slugs, name, animateSwap) {
      portrait.textContent = '';
      if (slugs.length) {
        var alt = slugs.length > 1 ? name + ', photo ' + (photoIndex + 1) + ' of ' + slugs.length : name;
        portrait.appendChild(makePortrait(slugs[photoIndex], alt));
      } else {
        var img = $('img', src);
        if (img) {
          var copy = ($('picture', src) || img).cloneNode(true);
          var copyImg = copy.tagName === 'IMG' ? copy : $('img', copy);
          copyImg.removeAttribute('loading');
          copyImg.alt = name;
          $$('source[srcset]', copy).forEach(function (s) { s.setAttribute('sizes', '(max-width: 520px) 90vw, 440px'); });
          if (copyImg.hasAttribute('srcset') || copyImg.hasAttribute('sizes')) copyImg.setAttribute('sizes', '(max-width: 520px) 90vw, 440px');
          portrait.appendChild(copy);
        }
      }
      if (photosWrap) {
        $$('.band-member-dialog__thumb', photosWrap).forEach(function (btn, bi) {
          if (bi === photoIndex) btn.setAttribute('aria-current', 'true');
          else btn.removeAttribute('aria-current');
        });
      }
      if (animateSwap && !reduceMotion && portrait.animate) {
        portrait.animate([{ opacity: .55 }, { opacity: 1 }], { duration: 180, easing: EASE });
      }
    }

    function paint() {
      var card = cards[index];
      var src = $('.band-member__portrait', card);
      var slugs = memberSlugs(src);
      var name = $('.band-member__name', card).textContent;
      portrait.setAttribute('data-initials', src.getAttribute('data-initials') || '');
      var hadThumbFocus = photosWrap && photosWrap.contains(document.activeElement);
      if (photosWrap) {
        photosWrap.textContent = '';
        if (slugs.length > 1) {
          slugs.forEach(function (slug, si) {
            var btn = el('button', {
              class: 'band-member-dialog__thumb',
              type: 'button',
              'aria-label': 'Photo ' + (si + 1) + ' of ' + slugs.length
            }, [
              el('img', { src: safeUrl('assets/img/members/' + slug + '-400.webp'), alt: '', width: '400', height: '500', decoding: 'async' })
            ]);
            btn.addEventListener('click', function () {
              if (photoIndex === si) return;
              photoIndex = si;
              paintPhoto(src, slugs, name, true);
            });
            photosWrap.appendChild(btn);
          });
        }
        show(photosWrap, slugs.length > 1);
      }
      paintPhoto(src, slugs, name, false);
      nameEl.textContent = name;
      roleEl.textContent = $('.band-member__role', card).textContent;
      count.textContent = (index + 1) + ' of ' + cards.length;
      if (hadThumbFocus) {
        var nextFocus = (slugs.length > 1 && $('.band-member-dialog__thumb', photosWrap)) || $('[data-band-member-next]', dialog) || $('[data-band-member-close]', dialog);
        if (nextFocus) nextFocus.focus();
      }
    }

    function stepPhoto(step) {
      var src = $('.band-member__portrait', cards[index]);
      var slugs = memberSlugs(src);
      if (slugs.length < 2) return;
      photoIndex = (photoIndex + step + slugs.length) % slugs.length;
      paintPhoto(src, slugs, $('.band-member__name', cards[index]).textContent, true);
    }

    // Transform that puts the big card exactly over `rect`, scaled evenly.
    function overRect(rect) {
      var b = big.getBoundingClientRect();
      var k = rect.width / b.width;
      var dx = (rect.left + rect.width / 2) - (b.left + b.width / 2);
      var dy = (rect.top + rect.height / 2) - (b.top + b.height / 2);
      return 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')';
    }
    function visible(el) {
      var r = el.getBoundingClientRect(), t = track.getBoundingClientRect();
      return r.right > t.left && r.left < t.right && r.bottom > 0 && r.top < window.innerHeight;
    }

    function open(i) {
      index = i;
      photoIndex = 0;
      paint();
      dialog.showModal();
      if (reduceMotion || !big.animate) return;
      big.animate([{ transform: overRect(cards[i].getBoundingClientRect()), opacity: .6 }, { transform: 'none', opacity: 1 }],
        { duration: 340, easing: EASE });
    }
    function close() {
      if (closing || !dialog.open) return;
      var card = cards[index];
      card.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      function done() { closing = false; dialog.close(); card.focus({ preventScroll: true }); }
      if (reduceMotion || !big.animate || !visible(card)) { done(); return; }
      closing = true;
      var anim = big.animate([{ transform: 'none', opacity: 1 }, { transform: overRect(card.getBoundingClientRect()), opacity: .4 }],
        { duration: 240, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
      anim.onfinish = function () { done(); anim.cancel(); };
    }
    function go(step) {
      if (cards.length < 2) return;
      index = (index + step + cards.length) % cards.length;
      photoIndex = 0;
      paint();
      if (!reduceMotion && big.animate) big.animate([{ opacity: .4, transform: 'translateX(' + (step * 24) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE });
    }

    cards.forEach(function (c, i) { c.addEventListener('click', function () { open(i); }); });
    $('[data-band-member-close]', dialog).addEventListener('click', close);
    $('[data-band-member-prev]', dialog).addEventListener('click', function () { go(-1); });
    $('[data-band-member-next]', dialog).addEventListener('click', function () { go(1); });
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });          // Escape
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });       // backdrop
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); stepPhoto(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); stepPhoto(1); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    var startX = null;
    big.addEventListener('touchstart', function (e) { startX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    big.addEventListener('touchend', function (e) {
      if (startX == null) return;
      var dx = e.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Desktop nav: split the visible links evenly either side of the logo,
     so the row stays balanced whichever sections are showing.
     ------------------------------------------------------------------ */
  function balanceNav() {
    var left = $('.nav__group--left');
    var right = $('.nav__group--right');
    if (!left || !right) return;
    var items = $$('li', left).concat($$('li', right));
    var visible = items.filter(function (li) { return !li.hidden; });
    var half = Math.ceil(visible.length / 2);
    var seen = 0;
    items.forEach(function (li) {
      var side = seen < half ? left : right;
      if (!li.hidden) seen++;
      side.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------
     Social links
     ------------------------------------------------------------------ */
  var ICONS = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>',
    facebook: '<path d="M14 8h3V4.5h-3a4 4 0 0 0-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.5A.5.5 0 0 1 14 8z"/>'
  };
  var SOCIAL_NAMES = { instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook' };

  function socialLinks() {
    var s = PL.social || {};
    return Object.keys(SOCIAL_NAMES)
      .map(function (k) { return { key: k, name: SOCIAL_NAMES[k], url: safeUrl(s[k]) }; })
      .filter(function (x) { return x.url; });
  }

  function initSocial() {
    var links = socialLinks();
    $$('[data-social]').forEach(function (host) {
      links.forEach(function (l) {
        var a = el('a', { class: 'social-link', href: l.url, 'aria-label': 'Phantom Limbs on ' + l.name, rel: 'noopener' });
        a.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' + ICONS[l.key] + '</svg>';
        host.appendChild(a);
      });
      if (!links.length) host.hidden = true;
    });
    var follow = $('[data-follow]');
    var followLinks = $('[data-follow-links]');
    if (follow && followLinks && links.length) {
      links.forEach(function (l) { followLinks.appendChild(el('a', { href: l.url, rel: 'noopener', text: l.name })); });
      follow.hidden = false;
    }
  }

  /* ------------------------------------------------------------------
     Header, backdrop wash, current-section marker
     ------------------------------------------------------------------ */
  function initScroll() {
    var header = $('[data-header]');
    var hero = $('[data-hero]');
    var navLogo = $('[data-nav-logo]');
    var root = document.documentElement;
    var links = $$('.nav__link');
    var sections = $$('main > section[id]').filter(function (sec) { return !sec.hidden; });
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;
      var heroH = hero ? hero.offsetHeight : window.innerHeight;
      var headerH = header ? header.offsetHeight : 0;

      // Ivory wash: 0 at the top, full strength about two thirds of the way down the hero.
      root.style.setProperty('--wash', Math.min(1, y / Math.max(1, heroH * 0.66)).toFixed(3));

      var past = y > heroH - headerH - 8;
      if (header) header.classList.toggle('is-past', past);
      if (navLogo) navLogo.tabIndex = past ? 0 : -1;

      var current = 'top';
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= headerH + 88) current = sections[i].id; else break;
      }
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ------------------------------------------------------------------
     Mobile menu (native <dialog>: focus trap, Escape, focus return)
     ------------------------------------------------------------------ */
  function initMenu() {
    var menu = $('[data-menu]');
    var open = $('[data-menu-open]');
    if (!menu || !open || !menu.showModal) return;
    open.addEventListener('click', function () { menu.showModal(); });
    $('[data-menu-close]', menu).addEventListener('click', function () { menu.close(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.close(); }); });
    // Leaving the small-screen layout closes the menu.
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) { if (e.matches && menu.open) menu.close(); });
  }

  /* ------------------------------------------------------------------
     Shows
     ------------------------------------------------------------------ */
  function parseDate(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function fmt(date, opts) { return date.toLocaleDateString('en-US', opts); }
  function todayCentral() {
    try {
      var map = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(new Date()).forEach(function (p) { map[p.type] = p.value; });
      var d = parseDate(map.year + '-' + map.month + '-' + map.day);
      if (d) return d;
    } catch (e) {}
    var fallback = new Date(); fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  function initShows() {
    var today = todayCentral();
    var all = (Array.isArray(PL.shows) ? PL.shows : [])
      .map(function (s) { return Object.assign({}, s, { when: parseDate(s && s.date) }); })
      .filter(function (s) { return s.when && s.venue; });
    var upcoming = all.filter(function (s) { return s.when >= today; }).sort(function (a, b) { return a.when - b.when; });
    var past = all.filter(function (s) { return s.when < today && s.status !== 'cancelled'; }).sort(function (a, b) { return b.when - a.when; });
    var live = upcoming.filter(function (s) { return s.status !== 'cancelled'; });

    // Upcoming list
    var list = $('[data-upcoming]');
    upcoming.forEach(function (s) {
      var meta = [s.city, s.time].filter(Boolean).join(' · ');
      var badge = s.status === 'cancelled' ? 'Cancelled' : s.status === 'sold-out' ? 'Sold out' : '';
      var url = s.status === 'cancelled' ? '' : safeUrl(s.url);
      var linkText = s.linkText || (s.status === 'sold-out' ? 'Details' : 'Tickets');
      var li = el('li', { class: 'show' + (s.status === 'cancelled' ? ' show--cancelled' : '') }, [
        el('span', { class: 'show__date', text: fmt(s.when, { weekday: 'short', month: 'short', day: 'numeric' }) }),
        el('span', { class: 'show__where' }, [
          el('span', { text: s.venue }),
          s.support ? el('span', { class: 'show__support', text: 'with ' + s.support }) : null,
          meta ? el('span', { class: 'show__meta', text: meta }) : null
        ]),
        badge ? el('span', { class: 'show__badge', text: badge }) : null,
        url ? el('a', { class: 'show__link', href: url, rel: 'noopener', text: linkText + ' →', 'aria-label': linkText + ' for ' + s.venue + ', ' + fmt(s.when, { month: 'long', day: 'numeric' }) }) : null
      ]);
      list.appendChild(li);
    });
    show($('[data-no-shows]'), !upcoming.length);

    // Past performances
    var pastList = $('[data-past]');
    past.forEach(function (s) {
      pastList.appendChild(el('li', { text: [fmt(s.when, { month: 'short', day: 'numeric', year: 'numeric' }), s.venue, s.city].filter(Boolean).join(' · ') }));
    });
    show($('[data-past-wrap]'), past.length > 0);

    // "Next show" line in the hero
    var chip = $('[data-next-show]');
    if (chip && live.length) {
      var n = live[0];
      $('[data-next-show-text]', chip).textContent = [fmt(n.when, { weekday: 'short', month: 'short', day: 'numeric' }), [n.venue, n.city].filter(Boolean).join(', ')].join(' · ');
      chip.hidden = false;
    }

    return upcoming;
  }

  /* ------------------------------------------------------------------
     Listen / Watch — nothing third-party loads until the visitor asks
     ------------------------------------------------------------------ */
  var PLAY = '<svg aria-hidden="true" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="21" fill="rgba(27,21,33,.6)" stroke="currentColor" stroke-width="1.4"/><path d="M18 14.5v15l12-7.5z" fill="currentColor"/></svg>';
  var pausePlayer = function () {};

  function loader(kind, label, poster, makeFrame) {
    var box = el('div', { class: 'embed embed--' + kind });
    var btn = el('button', { class: 'embed__load', type: 'button', 'aria-label': label });
    if (poster) btn.appendChild(el('img', { src: poster, alt: '', loading: 'lazy', decoding: 'async' }));
    btn.insertAdjacentHTML('beforeend', PLAY);
    btn.appendChild(el('span', { text: label }));
    btn.addEventListener('click', function () {
      pausePlayer();
      var frame = makeFrame();
      box.textContent = '';
      box.appendChild(frame);
      frame.focus();
    });
    box.appendChild(btn);
    return box;
  }

  /*
   * Turn an ordinary share link into the player address, so the content file
   * can hold the link people copy from the app. Returns '' when unsupported.
   */
  function playerUrl(link) {
    var u;
    try { u = new URL(String(link || '').trim()); } catch (e) { return ''; }
    if (u.protocol !== 'https:') return '';
    var host = u.hostname.replace(/^www\./, '');
    var m;
    if (host === 'open.spotify.com') {
      if (/^\/embed\//.test(u.pathname)) return u.href;
      m = /^\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode)\/([A-Za-z0-9]+)/.exec(u.pathname);
      return m ? 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] : '';
    }
    if (host === 'music.apple.com') return 'https://embed.music.apple.com' + u.pathname + u.search;
    if (host === 'embed.music.apple.com') return u.href;
    if (host === 'soundcloud.com') return 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u.origin + u.pathname) + '&visual=false';
    if (host === 'w.soundcloud.com') return u.href;
    if (host === 'bandcamp.com' && /^\/EmbeddedPlayer\//.test(u.pathname)) return u.href;   // Bandcamp: use the link from its "Embed" button
    return '';
  }

  /* A YouTube video id from a plain id or any YouTube link (watch, youtu.be, shorts, embed). */
  function youtubeId(v) {
    if (v.id && /^[\w-]{6,20}$/.test(v.id)) return v.id;
    var u;
    try { u = new URL(String(v.url || '').trim()); } catch (e) { return ''; }
    var host = u.hostname.replace(/^(www|m)\./, '');
    var id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = u.searchParams.get('v') || (/^\/(?:shorts|embed|live)\/([\w-]+)/.exec(u.pathname) || [])[1] || '';
    }
    return /^[\w-]{6,20}$/.test(id) ? id : '';
  }

  function isReel(v) {
    if (typeof v.reel === 'boolean') return v.reel;
    var u;
    try { u = new URL(String(v.url || '').trim()); } catch (e) { return false; }
    var host = u.hostname.replace(/^(www|m)\./, '');
    return (host === 'youtube.com' || host === 'youtube-nocookie.com') && /^\/shorts\//.test(u.pathname);
  }

  var AUDIO_PATH_RE = /^assets\/audio\/[a-z0-9._-]+\.(m4a|mp3|ogg|opus|aac|wav)$/i;
  var BAR_COUNT = 28;

  function parseClockSec(str) {
    var m = /^(\d{1,2}):([0-5]\d)$/.exec(String(str || '').trim());
    return m ? (+m[1] * 60 + +m[2]) : 0;
  }
  function fmtClock(sec) {
    var s = Math.max(0, Math.floor(+sec || 0));
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }
  function fmtClockAria(sec) {
    var s = Math.max(0, Math.floor(+sec || 0)), m = Math.floor(s / 60), r = s % 60;
    return (m ? m + (m === 1 ? ' minute ' : ' minutes ') : '') + r + (r === 1 ? ' second' : ' seconds');
  }
  function inferStreamLabel(url, custom) {
    var c = String(custom || '').trim();
    if (c) return c;
    try {
      var h = new URL(url).hostname.replace(/^www\./, '');
      if (h.indexOf('spotify.com') >= 0) return 'Spotify';
      if (h.indexOf('apple.com') >= 0) return 'Apple Music';
      if (h.indexOf('soundcloud.com') >= 0) return 'SoundCloud';
      if (h.indexOf('bandcamp.com') >= 0) return 'Bandcamp';
      if (h.indexOf('youtube.com') >= 0 || h === 'youtu.be') return 'YouTube';
    } catch (e) {}
    return 'Stream';
  }
  function trackPeaks(raw, seedStr) {
    if (Array.isArray(raw) && raw.length === BAR_COUNT && raw.every(function (n) { return typeof n === 'number' && isFinite(n) && n >= 0 && n <= 1; })) {
      return raw.map(function (n) { return Math.max(0.18, Math.min(1, n)); });
    }
    var h = 2166136261;
    for (var c = 0; c < seedStr.length; c++) { h ^= seedStr.charCodeAt(c); h = Math.imul(h, 16777619); }
    var out = [];
    for (var i = 0; i < BAR_COUNT; i++) {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      var n = ((h >>> 0) % 1000) / 1000;
      var env = Math.sin((Math.PI * (i + 1.5)) / (BAR_COUNT + 2));
      out.push(+(0.22 + (0.28 + 0.48 * env) * (0.45 + 0.55 * n)).toFixed(3));
    }
    return out;
  }

  function makePreviewWav(freqs) {
    var rate = 11025, secs = 6, samples = rate * secs, dataLen = samples * 2;
    var buf = new ArrayBuffer(44 + dataLen), view = new DataView(buf), bytes = new Uint8Array(buf);
    function str(off, s) { for (var i = 0; i < s.length; i++) bytes[off + i] = s.charCodeAt(i); }
    str(0, 'RIFF'); view.setUint32(4, 36 + dataLen, true); str(8, 'WAVE');
    str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    str(36, 'data'); view.setUint32(40, dataLen, true);
    for (var s = 0; s < samples; s++) {
      var t = s / rate;
      var env = Math.min(1, t / 0.04) * Math.min(1, (secs - t) / 0.18) * Math.exp(-t * 0.28) * (0.88 + 0.12 * Math.sin(2 * Math.PI * 4.2 * t));
      var sum = 0;
      for (var f = 0; f < freqs.length; f++) sum += Math.sin(2 * Math.PI * freqs[f] * t);
      view.setInt16(44 + s * 2, Math.round((sum / freqs.length) * env * 14000), true);
    }
    var bin = '';
    for (var p = 0; p < bytes.length; p += 8192) {
      bin += String.fromCharCode.apply(null, bytes.subarray(p, p + 8192));
    }
    return 'data:audio/wav;base64,' + window.btoa(bin);
  }

  function previewTracks() {
    return [
      { title: 'Soundcheck I (Preview)', freqs: [174.61, 220.0, 261.63, 329.63], credits: 'Preview tone · PL sleeve', duration: '0:06', cover: '', streamUrl: '' },
      { title: 'Soundcheck II (Preview)', freqs: [146.83, 174.61, 220.0, 329.63], credits: 'Preview tone · Custom cover', duration: '0:06', cover: 'assets/img/band-photo-960.webp', streamUrl: '' },
      { title: 'Soundcheck III (Preview)', freqs: [220.0, 261.63, 329.63, 392.0], credits: 'Preview tone · Auto-advance', duration: '0:06', cover: '', streamUrl: '' }
    ].map(function (t, i) {
      t.src = '';
      t.streamLabel = '';
      t.peaks = trackPeaks(null, t.title + ':' + i);
      return t;
    });
  }

  function initPlayer() {
    var player = $('[data-player]');
    if (!player) return;
    var tracks = (Array.isArray(PL.playlist) ? PL.playlist : []).map(function (t, i) {
      if (!t) return null;
      var title = String(t.title || '').trim();
      var src = safeUrl(t.src).replace(/^\//, '');
      if (!title || !AUDIO_PATH_RE.test(src)) return null;
      var rawCover = String(t.cover || '').trim().replace(/^\//, '');
      var cover = rawCover && !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(rawCover) ? safeUrl(rawCover) : '';
      var rawStream = String(t.streamUrl || '').trim();
      var streamUrl = /^https:\/\//i.test(rawStream) ? safeUrl(rawStream) : '';
      var dur = /^\d{1,2}:[0-5]\d$/.test(String(t.duration || '').trim()) ? String(t.duration).trim() : '';
      return {
        title: title,
        src: src,
        credits: String(t.credits || '').trim(),
        duration: dur,
        cover: cover,
        streamUrl: streamUrl,
        streamLabel: streamUrl ? inferStreamLabel(streamUrl, t.streamLabel) : '',
        peaks: trackPeaks(t.peaks, title + ':' + i)
      };
    }).filter(Boolean);

    if (!tracks.length && /(?:^\?|&)preview=player(?:&|$)/.test(window.location.search || '')) {
      tracks = previewTracks();
    }
    if (!tracks.length) return;
    player.hidden = false;
    document.body.classList.add('has-player');

    var audio = $('[data-player-audio]', player);
    var pill = $('[data-player-pill]', player);
    var card = $('[data-player-card]', player);
    var openBtn = $('[data-player-open]', player);
    var quickToggle = $('[data-player-toggle]', player);
    var closeBtn = $('[data-player-close]', player);
    var pillLabel = $('[data-player-pill-label]', player);
    var cardLabel = $('[data-player-card-label]', player);
    var sleeve = $('[data-player-sleeve]', player);
    var pillTitle = $('[data-player-pill-title]', player);
    var pillSub = $('[data-player-pill-sub]', player);
    var cardTitle = $('[data-player-card-title]', player);
    var cardCredits = $('[data-player-card-credits]', player);
    var streamLink = $('[data-player-stream]', player);
    var wave = $('[data-player-wave]', player);
    var seek = $('[data-player-seek]', player);
    var elapsedEl = $('[data-player-elapsed]', player);
    var durationEl = $('[data-player-duration]', player);
    var prevBtn = $('[data-player-prev]', player);
    var nextBtn = $('[data-player-next]', player);
    var mainToggle = $('[data-player-main-toggle]', player);
    var queue = $('[data-player-queue]', player);

    var index = 0, loadedIndex = -1, pendingRatio = null, loadFailed = false;
    var bars = [], queueButtons = [], queueDurSpans = [];

    for (var b = 0; b < BAR_COUNT; b++) {
      var bar = el('span', { class: 'player__bar' });
      bars.push(bar);
      wave.appendChild(bar);
    }

    show(prevBtn, tracks.length > 1);
    show(nextBtn, tracks.length > 1);
    show(queue, tracks.length > 1);
    if (tracks.length > 1) {
      tracks.forEach(function (tr, ti) {
        var durSpan = el('span', { class: 'player__track-dur', text: tr.duration });
        var btn = el('button', { class: 'player__track', type: 'button' }, [
          el('span', { class: 'player__track-name', text: (ti + 1) + '. ' + tr.title }),
          durSpan
        ]);
        btn.addEventListener('click', function () {
          if (index === ti) toggle();
          else selectTrack(ti, true);
        });
        queueButtons.push(btn);
        queueDurSpans.push(durSpan);
        queue.appendChild(el('li', {}, [btn]));
      });
    }

    function totalSeconds() {
      if (loadedIndex === index && isFinite(audio.duration) && audio.duration > 0) return audio.duration;
      return parseClockSec(tracks[index].duration);
    }

    function paintArt(node, coverUrl, withMonogram) {
      node.textContent = '';
      if (coverUrl) node.appendChild(el('img', { src: coverUrl, alt: '', decoding: 'async' }));
      else if (withMonogram) node.appendChild(el('span', { class: 'player__monogram', text: 'PL' }));
    }

    function updateMediaSession() {
      if (!('mediaSession' in navigator) || typeof window.MediaMetadata !== 'function') return;
      var t = tracks[index];
      var artSrc = t.cover || 'assets/img/og.jpg';
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: t.title,
          artist: 'Phantom Limbs',
          album: t.credits || 'Phantom Limbs',
          artwork: [{ src: artSrc }]
        });
      } catch (e) {}
    }

    function paintPlayState() {
      var playing = loadedIndex === index && !audio.paused && !audio.ended;
      player.classList.toggle('is-playing', playing);
      var verb = playing ? 'Pause' : 'Play';
      var t = tracks[index];
      quickToggle.setAttribute('aria-label', verb + ' ' + t.title);
      mainToggle.textContent = verb;
      mainToggle.setAttribute('aria-label', verb + ' ' + t.title);
      openBtn.setAttribute('aria-label', 'Expand music player: ' + t.title);
    }

    function paintProgress(ratio, elapsedSec, totalSec, fromSeek) {
      var r = Math.max(0, Math.min(1, +ratio || 0));
      var t = tracks[index];
      player.style.setProperty('--player-progress', r.toFixed(4));
      for (var i = 0; i < BAR_COUNT; i++) {
        bars[i].classList.toggle('is-played', r > 0 && (i / (BAR_COUNT - 1)) <= r);
      }
      elapsedEl.textContent = fmtClock(elapsedSec);
      durationEl.textContent = totalSec > 0 ? fmtClock(totalSec) : (t.duration || '--:--');
      if (!fromSeek) seek.value = String(Math.round(r * 1000));
      seek.setAttribute('aria-valuetext', totalSec > 0 ? fmtClockAria(elapsedSec) + ' of ' + fmtClockAria(totalSec) : Math.round(r * 100) + '%');

      if (loadFailed) {
        pillSub.textContent = 'Audio unavailable';
      } else if ((loadedIndex === index && !audio.paused) || elapsedSec > 0 || pendingRatio !== null) {
        var tail = t.credits || (tracks.length > 1 ? (index + 1) + ' of ' + tracks.length : '');
        pillSub.textContent = fmtClock(elapsedSec) + (tail ? ' · ' + tail : '');
      } else {
        pillSub.textContent = t.credits || (tracks.length > 1 ? 'Track ' + (index + 1) + ' of ' + tracks.length : (t.duration || 'Listen'));
      }
    }

    function paintTrack() {
      var t = tracks[index];
      pillTitle.textContent = t.title;
      cardTitle.textContent = t.title;
      cardCredits.textContent = t.credits;
      show(cardCredits, !!t.credits);
      if (t.streamUrl) {
        streamLink.href = t.streamUrl;
        streamLink.textContent = t.streamLabel + ' ↗';
        streamLink.setAttribute('aria-label', t.streamLabel + ': ' + t.title);
      }
      show(streamLink, !!t.streamUrl);
      paintArt(sleeve, t.cover, true);
      paintArt(pillLabel, t.cover, false);
      paintArt(cardLabel, t.cover, false);
      for (var i = 0; i < BAR_COUNT; i++) {
        bars[i].style.setProperty('--bar-h', Math.round(t.peaks[i] * 100) + '%');
      }
      queueButtons.forEach(function (btn, bi) {
        if (bi === index) {
          btn.setAttribute('aria-current', 'true');
          if (!card.hidden && btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest' });
        } else {
          btn.removeAttribute('aria-current');
        }
      });
      paintPlayState();
      updateMediaSession();
    }

    function ensureLoaded() {
      if (loadedIndex === index) return;
      loadFailed = false;
      var t = tracks[index];
      if (!t.src && t.freqs) t.src = makePreviewWav(t.freqs);
      audio.src = t.src;
      loadedIndex = index;
    }

    function play() {
      ensureLoaded();
      var p = audio.play();
      if (p && p.catch) p.catch(function () { paintPlayState(); });
    }

    function pause() {
      if (!audio.paused) audio.pause();
    }

    function toggle() {
      if (loadedIndex !== index || audio.paused) play();
      else pause();
    }

    function selectTrack(nextIdx, autoPlay) {
      var shouldPlay = autoPlay !== undefined ? autoPlay : (loadedIndex === index && !audio.paused);
      pause();
      index = (nextIdx + tracks.length) % tracks.length;
      loadedIndex = -1;
      pendingRatio = null;
      loadFailed = false;
      paintTrack();
      paintProgress(0, 0, totalSeconds(), false);
      if (shouldPlay) play();
    }

    function expand() {
      pill.hidden = true;
      card.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      if (queueButtons[index] && queueButtons[index].scrollIntoView) queueButtons[index].scrollIntoView({ block: 'nearest' });
      mainToggle.focus({ preventScroll: true });
    }

    function collapse() {
      card.hidden = true;
      pill.hidden = false;
      openBtn.setAttribute('aria-expanded', 'false');
      openBtn.focus({ preventScroll: true });
    }

    pausePlayer = pause;

    openBtn.addEventListener('click', expand);
    closeBtn.addEventListener('click', collapse);
    card.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); collapse(); } });
    quickToggle.addEventListener('click', toggle);
    mainToggle.addEventListener('click', toggle);
    prevBtn.addEventListener('click', function () { selectTrack(index - 1); });
    nextBtn.addEventListener('click', function () { selectTrack(index + 1); });

    seek.addEventListener('input', function () {
      var r = Math.max(0, Math.min(1, (+seek.value || 0) / 1000));
      if (loadedIndex === index && isFinite(audio.duration) && audio.duration > 0) {
        pendingRatio = null;
        audio.currentTime = r * audio.duration;
        paintProgress(r, audio.currentTime, audio.duration, true);
      } else {
        pendingRatio = r;
        var est = totalSeconds();
        paintProgress(r, r * est, est, true);
      }
    });

    audio.addEventListener('play', paintPlayState);
    audio.addEventListener('pause', paintPlayState);
    audio.addEventListener('loadedmetadata', function () {
      if (loadedIndex !== index || !isFinite(audio.duration) || audio.duration <= 0) return;
      if (!tracks[index].duration) {
        tracks[index].duration = fmtClock(audio.duration);
        if (queueDurSpans[index]) queueDurSpans[index].textContent = tracks[index].duration;
      }
      if (pendingRatio !== null) {
        audio.currentTime = pendingRatio * audio.duration;
        pendingRatio = null;
      }
      paintProgress(audio.currentTime / audio.duration, audio.currentTime, audio.duration, false);
    });
    audio.addEventListener('timeupdate', function () {
      if (loadedIndex !== index) return;
      var tot = totalSeconds();
      var cur = audio.currentTime || 0;
      paintProgress(tot > 0 ? cur / tot : 0, cur, tot, false);
    });
    audio.addEventListener('ended', function () {
      if (index + 1 < tracks.length) selectTrack(index + 1, true);
      else selectTrack(0, false);
    });
    audio.addEventListener('error', function () {
      if (loadedIndex !== index) return;
      loadFailed = true;
      paintPlayState();
      paintProgress(0, 0, totalSeconds(), false);
    });

    if ('mediaSession' in navigator && navigator.mediaSession) {
      [['play', play], ['pause', pause], ['previoustrack', tracks.length > 1 ? function () { selectTrack(index - 1, true); } : null],
       ['nexttrack', tracks.length > 1 ? function () { selectTrack(index + 1, true); } : null],
       ['seekto', function (d) {
         if (d && typeof d.seekTime === 'number' && loadedIndex === index && isFinite(audio.duration) && audio.duration > 0) {
           audio.currentTime = Math.max(0, Math.min(audio.duration, d.seekTime));
         }
       }]].forEach(function (pair) {
        try { navigator.mediaSession.setActionHandler(pair[0], pair[1]); } catch (e) {}
      });
    }

    paintTrack();
    paintProgress(0, 0, totalSeconds(), false);
  }

  function initListen() {
    var tracks = (Array.isArray(PL.listen) ? PL.listen : [])
      .map(function (t) { return t && Object.assign({}, t, { player: playerUrl(t.url || t.embed) }); })
      .filter(function (t) { return t && t.player; });
    var host = $('[data-listen]');
    tracks.forEach(function (t) {
      host.appendChild(el('li', { class: 'track' }, [
        t.title ? el('p', { class: 'track__title', text: t.title }) : null,
        t.credits ? el('p', { class: 'track__credits', text: t.credits }) : null,
        loader('audio', 'Load player' + (t.title ? ': ' + t.title : ''), '', function () {
          return el('iframe', { src: t.player, title: (t.title || 'Track') + ' player', loading: 'lazy', allow: 'autoplay; encrypted-media; clipboard-write', tabindex: '0' });
        })
      ]));
    });
    setSection('listen', tracks.length > 0);
  }

  function initWatch() {
    var items = (Array.isArray(PL.watch) ? PL.watch : [])
      .map(function (v) { return v && Object.assign({}, v, { id: youtubeId(v), reel: isReel(v) }); })
      .filter(function (v) { return v && v.id; });
    var videos = items.filter(function (v) { return !v.reel; });
    var reels = items.filter(function (v) { return v.reel; });
    var videoHost = $('[data-watch]');
    var reelsWrap = $('[data-reels]');
    var reelsHost = $('[data-reels-list]');

    function ytEmbed(v, kind, noun, fallbackTitle) {
      return loader(kind, 'Play ' + noun + (v.title ? ': ' + v.title : ''), 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg', function () {
        return el('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0', title: v.title || fallbackTitle, allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true, tabindex: '0' });
      });
    }

    videos.forEach(function (v) {
      videoHost.appendChild(el('li', {}, [
        ytEmbed(v, 'video', 'video', 'Video'),
        v.title ? el('p', { class: 'video__title', text: v.title }) : null
      ]));
    });
    reels.forEach(function (v) {
      reelsHost.appendChild(el('li', { class: 'reel' }, [
        ytEmbed(v, 'reel', 'reel', 'Reel'),
        v.title ? el('p', { class: 'reel__title', text: v.title }) : null
      ]));
    });

    setSection('watch', items.length > 0);
    show(videoHost, videos.length > 0);
    show($('[data-reels-title]'), videos.length > 0 && reels.length > 0);
    show(reelsWrap, reels.length > 0);
    if (reels.length) {
      bindScroller(reelsWrap, reelsHost, '.reel', $('.reels__controls', reelsWrap), $('[data-reels-prev]', reelsWrap), $('[data-reels-next]', reelsWrap));
    }
  }

  /* ------------------------------------------------------------------
     Press
     ------------------------------------------------------------------ */
  function initPress() {
    var press = PL.press || {};
    var url = safeUrl(press.kitUrl);
    if (url) $('[data-press-kit]').setAttribute('href', url);
    var intro = $('[data-press-intro]');
    if (press.intro) { intro.textContent = press.intro; intro.hidden = false; }
    setSection('press', !!url);
  }

  /* ------------------------------------------------------------------
     Photography + viewer
     ------------------------------------------------------------------ */
  function initGallery() {
    var photos = (Array.isArray(PL.photos) ? PL.photos : []).filter(function (p) { return p && safeUrl(p.src); });
    var host = $('[data-gallery]');
    var viewer = $('[data-viewer]');
    // One photo is already shown in Meet the Band; the gallery appears from two.
    setSection('photography', photos.length > 1);
    if (photos.length < 2 || !viewer) return;

    var img = $('[data-viewer-img]', viewer);
    var count = $('[data-viewer-count]', viewer);
    var credit = $('[data-viewer-credit]', viewer);
    var stage = $('[data-viewer-stage]', viewer);
    var index = 0;

    function paint() {
      var p = photos[index];
      img.src = safeUrl(p.src);
      img.alt = p.alt || '';
      if (p.width && p.height) { img.width = p.width; img.height = p.height; }
      count.textContent = 'Photo ' + (index + 1) + ' of ' + photos.length;
      credit.textContent = p.credit ? 'Photo: ' + p.credit : '';
    }
    function go(step) { if (photos.length > 1) { index = (index + step + photos.length) % photos.length; paint(); } }
    // With a single photo there is nothing to page through.
    show($('[data-viewer-prev]', viewer), photos.length > 1);
    show($('[data-viewer-next]', viewer), photos.length > 1);
    show(count, photos.length > 1);

    photos.forEach(function (p, i) {
      var btn = el('button', { class: 'gallery__tile', type: 'button', 'aria-label': 'Open photo ' + (i + 1) + ' of ' + photos.length + (p.alt ? ': ' + p.alt : '') }, [
        el('img', { src: safeUrl(p.thumb) || safeUrl(p.src), alt: '', width: p.width, height: p.height, loading: 'lazy', decoding: 'async' })
      ]);
      btn.addEventListener('click', function () {
        index = i; paint();
        if (viewer.showModal) viewer.showModal();
      });
      host.appendChild(el('li', {}, [btn]));
    });

    $('[data-viewer-prev]', viewer).addEventListener('click', function () { go(-1); });
    $('[data-viewer-next]', viewer).addEventListener('click', function () { go(1); });
    $('[data-viewer-close]', viewer).addEventListener('click', function () { viewer.close(); });
    viewer.addEventListener('click', function (e) { if (e.target === viewer) viewer.close(); });
    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    // The public gallery offers no download; stop the casual right-click save on the large image.
    img.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    img.setAttribute('draggable', 'false');

    var startX = null;
    stage.addEventListener('touchstart', function (e) { startX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (startX == null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------ */
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  /*
   * Email goes through the visitor's own email app (a mailto: link), so no
   * outside service sees it and nothing runs on the server. Their app sends it
   * from their own address, which is where the band's reply goes.
   */
  function initForm() {
    var form = $('[data-form]');
    if (!form) return;
    var contact = PL.contact || {};
    var email = EMAIL_RE.test(contact.email || '') ? contact.email : 'phantomlimbs62@gmail.com';
    var done = $('[data-form-done]');
    var copyBtn = $('[data-form-copy]');
    var copyEmailBtn = $('[data-form-copy-email]');
    var copyStatus = $('[data-form-copy-status]');
    var fields = ['name', 'email', 'message'];
    var lastDraft = '';

    $$('[data-email-link]').forEach(function (a) { a.href = 'mailto:' + email; a.textContent = email; });

    function value(name) { return String(form.elements[name].value || '').trim(); }
    function invalid(name) { return name === 'email' ? !EMAIL_RE.test(value(name)) : !value(name); }
    function mark(name, bad) {
      var input = form.elements[name];
      if (bad) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      show(document.getElementById('err-' + name), bad);
    }

    fields.forEach(function (name) {
      var input = form.elements[name];
      input.addEventListener('blur', function () { mark(name, invalid(name)); });
      input.addEventListener('input', function () { if (input.hasAttribute('aria-invalid') && !invalid(name)) mark(name, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (value('website')) return;                     // spam trap: real visitors never fill this
      var bad = fields.filter(invalid);
      fields.forEach(function (name) { mark(name, bad.indexOf(name) >= 0); });
      if (bad.length) { form.elements[bad[0]].focus(); return; }

      var subject = '[' + (form.elements.subject.value || 'General') + '] Phantom Limbs website';
      var body = value('message') + '\n\n' + value('name') + '\n' + value('email');
      lastDraft = 'To: ' + email + '\nSubject: ' + subject + '\n\n' + body;

      window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      form.hidden = true;
      done.hidden = false;
      copyStatus.textContent = '';
      done.focus();
    });

    // For visitors with no email app set up: copy the whole message or the address to paste into webmail.
    function writeClip(text, okMsg) {
      function ok() { copyStatus.textContent = okMsg; }
      function fail() { copyStatus.textContent = 'Copy didn\'t work here. Please email ' + email + ' directly.'; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fail);
      else fail();
    }
    copyBtn.addEventListener('click', function () {
      writeClip(lastDraft, 'Copied. Paste it into a new email to ' + email + '.');
    });
    if (copyEmailBtn) {
      copyEmailBtn.addEventListener('click', function () {
        writeClip(email, 'Copied ' + email + '.');
      });
    }

    $('[data-form-reset]').addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });
  }

  /* ------------------------------------------------------------------
     Structured data for search engines (band + upcoming shows)
     ------------------------------------------------------------------ */
  function initStructuredData(upcoming) {
    var site = document.querySelector('link[rel="canonical"]').href;
    var group = {
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      name: 'Phantom Limbs',
      url: site,
      image: site + 'assets/img/og.jpg',
      email: (PL.contact && PL.contact.email) || undefined,
      foundingLocation: { '@type': 'Place', name: 'Dallas, TX' },
      genre: ['Rock', 'Funk', 'R&B'],
      member: $$('.band-member').map(function (li) {
        return {
          '@type': 'OrganizationRole',
          roleName: ($('.band-member__role', li) || {}).textContent || '',
          member: { '@type': 'Person', name: ($('.band-member__name', li) || {}).textContent || '' }
        };
      }),
      sameAs: socialLinks().map(function (l) { return l.url; })
    };
    if (!group.sameAs.length) delete group.sameAs;
    delete group['@context'];
    group.foundingLocation.address = { '@type': 'PostalAddress', addressLocality: 'Dallas', addressRegion: 'TX', addressCountry: 'US' };
    var events = upcoming.map(function (s) {
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var ev = {
        '@type': 'MusicEvent',
        name: 'Phantom Limbs at ' + s.venue,
        startDate: s.when.getFullYear() + '-' + pad(s.when.getMonth() + 1) + '-' + pad(s.when.getDate()),
        eventStatus: 'https://schema.org/' + (s.status === 'cancelled' ? 'EventCancelled' : 'EventScheduled'),
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'MusicVenue', name: s.venue, address: s.city || undefined },
        performer: [{ '@type': 'MusicGroup', name: 'Phantom Limbs', url: site }].concat(s.support ? [{ '@type': 'PerformingGroup', name: s.support }] : [])
      };
      var url = safeUrl(s.url);
      if (url) ev.offers = { '@type': 'Offer', url: url, availability: 'https://schema.org/' + (s.status === 'sold-out' ? 'SoldOut' : 'InStock') };
      return ev;
    });
    var script = document.getElementById('schema-json') || el('script', { type: 'application/ld+json', id: 'schema-json' });
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [group].concat(events) });
    if (!script.parentNode) document.head.appendChild(script);
  }

  /* ------------------------------------------------------------------ */
  function init() {
    var year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
    initSocial();
    initBand();
    initMenu();
    var upcoming = initShows();
    initPlayer();
    initListen();
    initWatch();
    initPress();
    initGallery();
    initForm();
    initStructuredData(upcoming);
    balanceNav();
    initScroll();       // last: section visibility is settled by now
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
