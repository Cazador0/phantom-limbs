#!/usr/bin/env node
'use strict';

/*
 * Static site check for Phantom Limbs (no dependencies).
 * Catches silent content drops in data/site-data.js and copy drift in index.html.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var childProcess = require('child_process');

var root = path.resolve(__dirname, '..');
var errors = [];

function fail(msg) { errors.push(msg); }

// 1. JavaScript syntax checks
['assets/js/main.js', 'data/site-data.js'].forEach(function (rel) {
  var res = childProcess.spawnSync(process.execPath, ['--check', path.join(root, rel)], { encoding: 'utf8' });
  if (res.status !== 0) fail(rel + ' syntax error:\n' + (res.stderr || res.stdout));
});

// 2. Load data/site-data.js and validate entries that main.js would silently drop
var sandbox = { window: {} };
try {
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data/site-data.js'), 'utf8'), sandbox, { filename: 'data/site-data.js' });
} catch (e) {
  fail('Could not evaluate data/site-data.js: ' + e.message);
}
var PL = sandbox.window.PL || {};

function validDate(str) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''));
  if (!m) return false;
  var d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1;
}

function validPlayerUrl(link) {
  var u;
  try { u = new URL(String(link || '').trim()); } catch (e) { return false; }
  if (u.protocol !== 'https:') return false;
  var host = u.hostname.replace(/^www\./, '');
  if (host === 'open.spotify.com') {
    return /^\/embed\//.test(u.pathname) || /^\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode)\/[A-Za-z0-9]+/.test(u.pathname);
  }
  if (host === 'music.apple.com' || host === 'embed.music.apple.com') return true;
  if (host === 'soundcloud.com' || host === 'w.soundcloud.com') return true;
  if (host === 'bandcamp.com' && /^\/EmbeddedPlayer\//.test(u.pathname)) return true;
  return false;
}

function validYoutube(v) {
  if (v && v.id && /^[\w-]{6,20}$/.test(v.id)) return true;
  var u;
  try { u = new URL(String((v && v.url) || '').trim()); } catch (e) { return false; }
  var host = u.hostname.replace(/^(www|m)\./, '');
  var id = '';
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v') || (/^\/(?:shorts|embed|live)\/([\w-]+)/.exec(u.pathname) || [])[1] || '';
  }
  return /^[\w-]{6,20}$/.test(id);
}

(PL.shows || []).forEach(function (s, i) {
  if (!s || !validDate(s.date)) fail('shows[' + i + ']: invalid YYYY-MM-DD date ' + JSON.stringify(s && s.date));
  if (!s || !String(s.venue || '').trim()) fail('shows[' + i + ']: missing venue');
});

(PL.listen || []).forEach(function (t, i) {
  if (!t || !validPlayerUrl(t.url || t.embed)) fail('listen[' + i + ']: unsupported player URL ' + JSON.stringify(t && (t.url || t.embed)));
});

(PL.watch || []).forEach(function (v, i) {
  if (!v || !validYoutube(v)) fail('watch[' + i + ']: invalid YouTube entry ' + JSON.stringify(v));
});

(PL.photos || []).forEach(function (p, i) {
  if (!p || !p.src) { fail('photos[' + i + ']: missing src'); return; }
  if (!/^https?:/i.test(p.src) && !fs.existsSync(path.join(root, p.src.replace(/^\//, '')))) {
    fail('photos[' + i + ']: file not found: ' + p.src);
  }
  if (p.thumb && !/^https?:/i.test(p.thumb) && !fs.existsSync(path.join(root, p.thumb.replace(/^\//, '')))) {
    fail('photos[' + i + ']: thumb file not found: ' + p.thumb);
  }
  if (!p.width || !p.height) fail('photos[' + i + ']: missing width/height');
  if (typeof p.alt !== 'string' || !p.alt.trim()) fail('photos[' + i + ']: missing alt text');
});

// 3. Copy sync checks in index.html
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function decodeEntities(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
var descMeta = (/<meta\s+name="description"\s+content="([^"]*)"/.exec(html) || [])[1];
var ogDescMeta = (/<meta\s+property="og:description"\s+content="([^"]*)"/.exec(html) || [])[1];
var ledeText = (/<p\s+class="lede">([\s\S]*?)<\/p>/.exec(html) || [])[1];
if (!descMeta || descMeta !== ogDescMeta || decodeEntities(descMeta) !== decodeEntities(ledeText)) {
  fail('Bio opening sentence out of sync between <meta name="description">, <meta property="og:description">, and <p class="lede">.');
}

var cardRe = /<li\s+class="band-member">([\s\S]*?)<\/li>/g;
var match, count = 0;
while ((match = cardRe.exec(html)) !== null) {
  count++;
  var block = match[1];
  var name = decodeEntities((/<span\s+class="band-member__name">([^<]+)<\/span>/.exec(block) || [])[1] || '').trim();
  var label = decodeEntities((/aria-label="([^"]+)"/.exec(block) || [])[1] || '').trim();
  var initials = ((/data-initials="([^"]+)"/.exec(block) || [])[1] || '').trim();
  var expectedInitials = name.split(/\s+/).filter(Boolean).map(function (w) { return w[0].toUpperCase(); }).join('');
  if (!name) fail('band-member[' + count + ']: missing .band-member__name');
  if (label && label !== 'Enlarge ' + name) fail('band-member (' + name + '): aria-label ' + JSON.stringify(label) + ' != ' + JSON.stringify('Enlarge ' + name));
  if (initials && initials !== expectedInitials) fail('band-member (' + name + '): data-initials ' + JSON.stringify(initials) + ' != ' + JSON.stringify(expectedInitials));
}
if (!count) fail('No .band-member items found in index.html');

if (errors.length) {
  console.error('Site check failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('OK: syntax, site-data (' + (PL.shows || []).length + ' shows, ' + (PL.photos || []).length + ' photos), and copy sync (' + count + ' band members) passed.');
