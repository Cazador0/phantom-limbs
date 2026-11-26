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
  if (v && v.reel !== undefined && typeof v.reel !== 'boolean') fail('watch[' + i + ']: reel must be boolean, got ' + JSON.stringify(v.reel));
});

function readImageDims(relPath) {
  var full = path.resolve(root, relPath.replace(/^\//, ''));
  if (full.indexOf(root + path.sep) !== 0 || !fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  var buf = fs.readFileSync(full);
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    var chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8 ' && buf[23] === 0x9D && buf[24] === 0x01 && buf[25] === 0x2A) {
      return { width: buf.readUInt16LE(26) & 0x3FFF, height: buf.readUInt16LE(28) & 0x3FFF };
    }
    if (chunk === 'VP8L' && buf[20] === 0x2F) {
      var bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3FFF) + 1, height: ((bits >> 14) & 0x3FFF) + 1 };
    }
    if (chunk === 'VP8X') {
      return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    }
  }
  if (buf.length >= 4 && buf[0] === 0xFF && buf[1] === 0xD8) {
    var pos = 2;
    while (pos + 1 < buf.length) {
      if (buf[pos] !== 0xFF) break;
      while (pos < buf.length && buf[pos] === 0xFF) pos++;
      if (pos >= buf.length) break;
      var m = buf[pos++];
      if (m === 0xD8 || m === 0xD9 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) continue;
      if (pos + 2 > buf.length) break;
      var segLen = buf.readUInt16BE(pos);
      if (segLen < 2 || pos + segLen > buf.length) break;
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        if (pos + 7 > buf.length) break;
        return { width: buf.readUInt16BE(pos + 5), height: buf.readUInt16BE(pos + 3) };
      }
      pos += segLen;
    }
  }
  return null;
}

function checkImageDims(who, relPath, expW, expH) {
  var dims = readImageDims(relPath);
  if (!dims) fail(who + ': could not read dimensions of ' + relPath);
  else if (dims.width !== expW || dims.height !== expH) {
    fail(who + ': ' + relPath + ' is ' + dims.width + 'x' + dims.height + ', expected ' + expW + 'x' + expH);
  }
}

(PL.photos || []).forEach(function (p, i) {
  if (!p || !p.src) { fail('photos[' + i + ']: missing src'); return; }
  var localSrc = !/^https?:/i.test(p.src);
  if (localSrc && !fs.existsSync(path.join(root, p.src.replace(/^\//, '')))) {
    fail('photos[' + i + ']: file not found: ' + p.src);
  }
  if (p.thumb && !/^https?:/i.test(p.thumb) && !fs.existsSync(path.join(root, p.thumb.replace(/^\//, '')))) {
    fail('photos[' + i + ']: thumb file not found: ' + p.thumb);
  }
  if (!p.width || !p.height) fail('photos[' + i + ']: missing width/height');
  else if (localSrc && fs.existsSync(path.join(root, p.src.replace(/^\//, '')))) {
    checkImageDims('photos[' + i + ']', p.src, p.width, p.height);
  }
  if (typeof p.alt !== 'string' || !p.alt.trim()) fail('photos[' + i + ']: missing alt text');
});

// 3. Copy sync and CSP checks in index.html
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var strippedHtml = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script>/gi, '');
if (/<[a-z][^>]*\sstyle\s*=/i.test(strippedHtml)) {
  fail('index.html contains an inline style= attribute (blocked by Content-Security-Policy in vercel.json).');
}

function decodeEntities(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
var descMeta = (/<meta\s+name="description"\s+content="([^"]*)"/.exec(html) || [])[1];
var ogDescMeta = (/<meta\s+property="og:description"\s+content="([^"]*)"/.exec(html) || [])[1];
var ledeText = (/<p\s+class="lede">([\s\S]*?)<\/p>/.exec(html) || [])[1];
if (!descMeta || descMeta !== ogDescMeta || decodeEntities(descMeta) !== decodeEntities(ledeText)) {
  fail('Bio opening sentence out of sync between <meta name="description">, <meta property="og:description">, and <p class="lede">.');
}

function getAttr(tag, attrName) {
  var m = new RegExp('(?:^|\\s)' + attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(tag);
  return m ? (m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]) : null;
}

function checkLocalAsset(who, rawUrl) {
  var u = String(rawUrl || '').trim();
  if (!u) { fail(who + ': empty image URL'); return; }
  if (/^(?:https?:|data:)/i.test(u)) return;
  var full = path.resolve(root, u.replace(/^\//, ''));
  if (full.indexOf(root + path.sep) !== 0 || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    fail(who + ': file not found: ' + u);
  }
}

var cardRe = /<li\s+class="band-member">([\s\S]*?)<\/li>/g;
var match, count = 0, totalMemberPoses = 0;
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

  var who = 'band-member (' + (name || count) + ')';
  var cleanBlock = block.replace(/<!--[\s\S]*?-->/g, '');
  var primaryImgSrc = '';
  var tagRe = /<(img|source)\b[^>]*>/gi, tagMatch;
  while ((tagMatch = tagRe.exec(cleanBlock)) !== null) {
    var tag = tagMatch[0];
    var isImg = /^<img\b/i.test(tag);
    var src = getAttr(tag, 'src');
    var srcset = getAttr(tag, 'srcset');
    if (isImg) {
      if (!src || !src.trim()) fail(who + ': <img> missing src');
      else { checkLocalAsset(who, src); primaryImgSrc = src.trim(); }
      var w = getAttr(tag, 'width'), h = getAttr(tag, 'height');
      if (!/^[1-9]\d*$/.test(String(w || '').trim()) || !/^[1-9]\d*$/.test(String(h || '').trim())) {
        fail(who + ': <img> requires positive numeric width and height');
      } else if (src && !/^(?:https?:|data:)/i.test(src)) {
        checkImageDims(who, src.trim(), +w, +h);
      }
    } else {
      if (srcset === null) fail(who + ': <source> missing srcset');
      if (src !== null) checkLocalAsset(who, src);
    }
    if (srcset !== null) {
      if (!srcset.trim()) fail(who + ': empty srcset');
      else srcset.split(',').forEach(function (part) {
        checkLocalAsset(who, part.trim().split(/\s+/)[0]);
      });
    }
  }

  var portraitTag = (/<div\s+class="band-member__portrait"[^>]*>/i.exec(cleanBlock) || [])[0] || '';
  var rawPhotos = getAttr(portraitTag, 'data-photos');
  if (rawPhotos !== null) {
    var slugs = rawPhotos.split(',').map(function (s) { return s.trim(); });
    var seenSlugs = {};
    if (!slugs.length || !slugs[0]) fail(who + ': empty data-photos attribute');
    slugs.forEach(function (slug) {
      if (!/^[a-z0-9-]+$/.test(slug)) { fail(who + ': invalid data-photos slug ' + JSON.stringify(slug)); return; }
      if (seenSlugs[slug]) fail(who + ': duplicate data-photos slug ' + slug);
      seenSlugs[slug] = true;
      totalMemberPoses++;
      var base = 'assets/img/members/' + slug;
      checkLocalAsset(who, base + '-400.webp');
      checkLocalAsset(who, base + '-880.webp');
      checkLocalAsset(who, base + '-880.jpg');
      checkImageDims(who, base + '-400.webp', 400, 500);
      checkImageDims(who, base + '-880.webp', 880, 1100);
      checkImageDims(who, base + '-880.jpg', 880, 1100);
    });
    if (slugs[0] && primaryImgSrc && primaryImgSrc !== 'assets/img/members/' + slugs[0] + '-880.jpg') {
      fail(who + ': primary <img> ' + primaryImgSrc + ' does not match first data-photos slug ' + slugs[0]);
    }
  }
}
if (!count) fail('No .band-member items found in index.html');

if (errors.length) {
  console.error('Site check failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('OK: syntax, site-data (' + (PL.shows || []).length + ' shows, ' + (PL.photos || []).length + ' photos), and copy sync (' + count + ' band members, ' + totalMemberPoses + ' portrait poses) passed.');
