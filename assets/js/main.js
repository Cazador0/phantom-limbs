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

  function initShows() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
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

  function loader(kind, label, poster, makeFrame) {
    var box = el('div', { class: 'embed embed--' + kind });
    var btn = el('button', { class: 'embed__load', type: 'button', 'aria-label': label });
    if (poster) btn.appendChild(el('img', { src: poster, alt: '', loading: 'lazy', decoding: 'async' }));
    btn.insertAdjacentHTML('beforeend', PLAY);
    btn.appendChild(el('span', { text: label }));
    btn.addEventListener('click', function () {
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
    var vids = (Array.isArray(PL.watch) ? PL.watch : [])
      .map(function (v) { return v && Object.assign({}, v, { id: youtubeId(v) }); })
      .filter(function (v) { return v && v.id; });
    var host = $('[data-watch]');
    vids.forEach(function (v) {
      host.appendChild(el('li', {}, [
        loader('video', 'Play video' + (v.title ? ': ' + v.title : ''), 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg', function () {
          return el('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0', title: v.title || 'Video', allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true, tabindex: '0' });
        }),
        v.title ? el('p', { class: 'video__title', text: v.title }) : null
      ]));
    });
    setSection('watch', vids.length > 0);
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

    // For visitors with no email app set up: copy the whole message to paste into webmail.
    copyBtn.addEventListener('click', function () {
      function ok() { copyStatus.textContent = 'Copied. Paste it into a new email to ' + email + '.'; }
      function fail() { copyStatus.textContent = 'Copy didn\'t work here. Please email ' + email + ' directly.'; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lastDraft).then(ok, fail);
      else fail();
    });

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
      genre: ['R&B', 'Funk', 'Rock'],
      member: [
        ['Tiff Cassius-Baucum', 'Lead vocals'], ['Joren Cain', 'Keyboards / guitar'], ['Danny Enriquez', 'Guitar / vocals'],
        ['Robert Tracy', 'Bass'], ['Kei Tabuchi', 'Drums']
      ].map(function (m) { return { '@type': 'OrganizationRole', roleName: m[1], member: { '@type': 'Person', name: m[0] } }; }),
      sameAs: socialLinks().map(function (l) { return l.url; })
    };
    if (!group.sameAs.length) delete group.sameAs;
    var events = upcoming.map(function (s) {
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var ev = {
        '@context': 'https://schema.org',
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
    var script = el('script', { type: 'application/ld+json' });
    script.textContent = JSON.stringify([group].concat(events));
    document.head.appendChild(script);
  }

  /* ------------------------------------------------------------------ */
  function init() {
    var year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
    initSocial();
    initMenu();
    var upcoming = initShows();
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
