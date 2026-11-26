# Specification — Floating "Spinning 45 + Waveform" Music Player Pill (`004-music-player-pill`)

- **Status:** `Implemented`
- **Selected Design:** Option 1B — Obsidian Vinyl Pill: Spinning 45 Disc + Bottom Progress Hairline (Collapsed) → 7-Inch Monogram/Cover Sleeve + 28-Bar Sculpted Waveform Scrubber + Track Queue (Expanded)
- **Branch:** `music-player-pill`
- **Target Site:** `https://www.phantomlimbsband.com/` (zero-build static HTML/CSS/JS on Vercel)

---

## 1. Agreed "Done When" Checks

Implementation of this specification is complete when all of the following hold:

1. **Zero-Config Empty State & `PL.playlist` Content Contract:**
   - `window.PL.playlist` is added to `data/site-data.js` as `playlist: []` with clear maintainer documentation.
   - When `PL.playlist` has zero valid entries, `<aside class="player" data-player>` stays completely `hidden`, `body.has-player` is absent, and zero audio requests occur—preserving the live site cleanly until real band tracks are added.
   - When `PL.playlist` contains `1+` valid tracks (`{ title, src, credits?, duration?, cover?, streamUrl?, streamLabel?, peaks? }`), the floating capsule renders automatically on page load in its **collapsed, paused** state with `<audio preload="none">` (`0 KB` audio downloaded until the visitor presses Play).
2. **Scroll-Following Floating Placement & Safe-Area Geometry:**
   - **Desktop & Tablet (`>600px`):** Fixed at `right: var(--s-5); bottom: var(--s-5); z-index: 18` (`24px` bottom-right inset), floating smoothly above page panels as the visitor scrolls from the dark `#1B1521` hero across the `#F5F0EA` ivory sections while staying underneath native `<dialog>` Top Layer modals (`.menu`, `.band-member-dialog`, `.viewer`).
   - **Mobile (`<=600px`):** Centered floating dock above the OS home indicator (`left: 12px; right: 12px; bottom: max(12px, env(safe-area-inset-bottom))`), with `pointer-events: none` on the outer wrapper and `pointer-events: auto` on the interactive pill/card so side gutters never block page taps, and zero horizontal overflow down to `320px`.
   - **Footer Clearance:** When `body.has-player` is set, `.site-footer__inner` reserves bottom clearance (`padding-bottom: 88px`) so the floating pill never obscures the copyright line or footer social icons at the bottom of the page.
3. **Collapsed "Spinning 45" Capsule UX:**
   - Frosted dark obsidian surface (`rgb(24 18 30 / .92)` + `backdrop-filter: blur(16px)` + `1px solid rgb(196 161 216 / .35)` rim) legible over both dark and light sections.
   - **Left:** `36×36px` grooved 7-inch vinyl disc (`repeating-radial-gradient` grooves + aubergine center label with spindle hole, or `track.cover` center label when set) that rotates smoothly (`4.5s linear infinite`) while playing, pauses in place when paused, and disables rotation under `prefers-reduced-motion: reduce`.
   - **Center (`button[data-player-open]`):** Track title in `Fraunces` + lilac status subtitle (`tabular-nums` live elapsed time once playing/seeked, or track index/credits when idle); clicking expands the full player card (`aria-expanded="true"`).
   - **Right (`button[data-player-toggle]`):** `44×44px` accessible hit target toggling Play/Pause directly without forcing the card open.
   - **Bottom Progress Hairline:** `2px` lilac progress indicator (`transform: scaleX(var(--player-progress, 0))`) along the inner bottom edge of the capsule.
4. **Expanded "7-Inch Sleeve + 28-Bar Waveform" Card UX (`WCAG 2.2 AA`):**
   - **Header Row:** `46×46px` 7-inch square sleeve defaulting to the Phantom Limbs aubergine-to-ink `PL` monogram (or `track.cover` `<img>` when provided), paired with a peeking `42×42px` spinning grooved 45 disc, `Fraunces` track title, optional `credits`, optional external `streamUrl` pill (`https:` only via `safeUrl()`), and a `44×44px` Minimize button (`✕`) that collapses the card and restores focus to `[data-player-open]` (also triggered by pressing `Escape` while focus is inside the card).
   - **Accessible 28-Bar Waveform Scrubber:** Renders `28` sculpted vertical bars (driven by `track.peaks` when provided, or a deterministic per-track sculpted envelope so adding `{ title, src }` by hand needs zero build scripts), overlaid by a native `<input type="range" min="0" max="1000" step="1" aria-label="Seek track position">` for click, drag, touch, keyboard (`ArrowLeft`/`ArrowRight`/`Home`/`End`), and screen-reader `aria-valuetext` support.
   - **Transport & Queue:** Live elapsed time (`0:00`), `Previous`, primary `Play / Pause`, `Next`, and total duration (`audio.duration` once metadata loads, falling back to `track.duration` or `--:--`), followed by a scrollable track queue (`<ol>`, hidden automatically when `playlist.length === 1` so single-track releases have no redundant 1-item list). Sequential tracks auto-advance on `ended` from track `1 → N` and reset cleanly to track `1` (paused) after the final track completes.
5. **Independent `#listen` Section, Mutual Audio Exclusion & OS `MediaSession`:**
   - Keeps `#listen` (`PL.listen`) independent for third-party streaming embeds (`Spotify`, `Apple Music`, `SoundCloud`, `Bandcamp`).
   - Clicking any `.embed__load` trigger in `#listen` or `#watch` automatically pauses the floating music player so two audio sources never overlap.
   - Updates `navigator.mediaSession` (`metadata` + `play`, `pause`, `previoustrack`, `nexttrack`, `seekto` handlers) when supported so iOS/Android lock screens, AirPods, and CarPlay control the playlist cleanly.
6. **Strict CSP Compliance & Automated Verification:**
   - Zero `style=""` HTML attributes and zero `setAttribute('style', ...)` calls (`vercel.json` `style-src 'self'` enforced; dynamic progress and bar heights use CSS classes and `CSSStyleDeclaration.setProperty('--...', ...)` matching `initScroll()`).
   - `npm test` (`.agents/check.js`) exits `0`, validating `PL.playlist` entries, local audio/cover asset existence, `<25 MB` per-track file size guard, `peaks` bounds, `index.html` markup integrity, and `README.md` documentation accuracy.
   - Headless Chromium verification under `vercel.json`'s exact `Content-Security-Policy` header verifies both the empty state (`PL.playlist: []`) and a multi-track audio fixture across Desktop (`1280×900`), Tablet (`960×900`), and Mobile (`390×844` & `320×800` with `prefers-reduced-motion: reduce`).

---

## 2. Context & Architectural Decisions

| Decision Area | Agreed Choice | Rationale |
|---|---|---|
| **Audio Engine** | Single native HTML5 `<audio preload="none">` element reading `window.PL.playlist` (`assets/audio/*.{m4a,mp3,ogg,opus,aac,wav}`) | Gives full-length playback to 100% of visitors (no 30s Spotify preview wall), zero page-load bandwidth cost, native HTTP `Range` seeking on Vercel, OS `MediaSession` support, and zero `vercel.json` CSP expansion (`default-src 'self'` covers local `media-src`). |
| **Initial Launch State** | Commit `playlist: []` in `data/site-data.js`; hide `[data-player]` when empty | Follows `CLAUDE.md` (*"Nothing is invented... empty sections hide"*). As soon as the band drops `.m4a`/`.mp3` files into `assets/audio/` and adds entries to `PL.playlist`, the capsule goes live with zero code edits. |
| **`#listen` Relationship** | Keep `#listen` (`PL.listen`) separate; auto-pause `[data-player]` on `.embed__load` click | Lets the band showcase full-album/platform embeds in `#listen` if desired while keeping the floating **Spinning 45** capsule focused on instant native playback, with optional `streamUrl` deep-link chips per track. |
| **Waveform Data** | Optional `peaks` (`28` numbers in `0..1`) with deterministic per-track sculpted fallback |Maintainer can add `{ title: "...", src: "assets/audio/..." }` in 10 seconds with zero CLI tooling, while still supporting exact precomputed peak arrays whenever desired. |
| **7-Inch Sleeve Artwork** | Default to Phantom Limbs aubergine `PL` monogram sleeve; allow optional `track.cover` | Looks intentional and cohesive on day one with zero required cover-art files, while supporting single/EP artwork per song. |

---

## 3. Technical Contracts

### 3.1 `data/site-data.js` Schema Contract (`window.PL.playlist`)

Add `playlist` above `listen` in `data/site-data.js`:

```javascript
  /*
   * PLAYLIST (Floating Music Player)
   * Songs for the floating "Spinning 45" player in the corner of the page.
   * Audio loads only when the visitor presses play. Leave empty to hide the player.
   * Put compressed .m4a or .mp3 files (160–192 kbps, ~3–5 MB each) in assets/audio/.
   *
   *   title        "Track title"                         required
   *   src          "assets/audio/track-slug.m4a"         required (local path under assets/audio/)
   *   credits      "Tiffany Baucum · Joren Cain"         optional subtitle
   *   duration     "3:48"                                optional display length before audio loads
   *   cover        "assets/img/covers/track.webp"        optional square sleeve art (defaults to PL monogram)
   *   streamUrl    "https://open.spotify.com/track/..."  optional streaming link shown in expanded card
   *   streamLabel  "Spotify"                             optional link label (inferred from URL when omitted)
   *   peaks        [0.25, 0.6, ...]                      optional 28 bar heights (0..1); auto-sculpted if omitted
   *
   * Example:
   *   { title: "Song title", src: "assets/audio/song-title.m4a", credits: "", duration: "3:48" },
   */
  playlist: [],
```

### 3.2 `index.html` Markup Contract

Add the non-modal floating `<aside>` landmark after `</footer>` and before `<dialog class="band-member-dialog">`:

```html
<aside class="player" id="music-player" aria-label="Music player" hidden data-player>
  <audio preload="none" data-player-audio></audio>

  <div class="player__pill" data-player-pill>
    <button class="player__open" type="button" aria-expanded="false" aria-controls="player-card" data-player-open>
      <span class="player__disc" aria-hidden="true">
        <span class="player__disc-label" data-player-pill-label></span>
      </span>
      <span class="player__pill-copy">
        <span class="player__title" data-player-pill-title></span>
        <span class="player__sub" data-player-pill-sub></span>
      </span>
    </button>
    <button class="player__quick-play" type="button" aria-label="Play" data-player-toggle>
      <svg class="player__icon-play" aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3.5 2.2v9.6L11.5 7z"/></svg>
      <svg class="player__icon-pause" aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2.5h2.6v9H3zm5.4 0H11v9H8.4z"/></svg>
    </button>
    <span class="player__rail" aria-hidden="true"><span class="player__rail-fill"></span></span>
  </div>

  <div class="player__card" id="player-card" hidden data-player-card>
    <div class="player__head">
      <div class="player__turntable" aria-hidden="true">
        <div class="player__sleeve" data-player-sleeve>
          <span class="player__monogram">PL</span>
        </div>
        <div class="player__disc player__disc--card">
          <span class="player__disc-label" data-player-card-label></span>
        </div>
      </div>
      <div class="player__meta">
        <p class="player__card-title" data-player-card-title></p>
        <p class="player__card-credits" hidden data-player-card-credits></p>
        <a class="player__stream" hidden rel="noopener" target="_blank" data-player-stream></a>
      </div>
      <button class="icon-btn icon-btn--light player__close" type="button" aria-label="Minimize music player" data-player-close>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5.5L7 9.5l4-4"/></svg>
      </button>
    </div>

    <div class="player__wave-wrap">
      <div class="player__wave" aria-hidden="true" data-player-wave></div>
      <input class="player__seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek track position" data-player-seek>
    </div>

    <div class="player__controls">
      <span class="player__time" data-player-elapsed>0:00</span>
      <div class="player__transport">
        <button class="player__step" type="button" aria-label="Previous track" data-player-prev>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3.5h1.6v9H3v-9zm2.8 4.5L13 3.5v9L5.8 8z"/></svg>
        </button>
        <button class="player__main-play" type="button" aria-label="Play" data-player-main-toggle>Play</button>
        <button class="player__step" type="button" aria-label="Next track" data-player-next>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.4 3.5H13v9h-1.6v-9zM3 12.5v-9L10.2 8 3 12.5z"/></svg>
        </button>
      </div>
      <span class="player__time player__time--end" data-player-duration>--:--</span>
    </div>

    <ol class="player__queue" aria-label="Playlist tracks" data-player-queue></ol>
  </div>
</aside>
```

*(Note: Using a downward chevron SVG on `[data-player-close]` communicates "minimize back into capsule" rather than "permanently destroy/stop music", keeping playback alive when minimized.)*

### 3.3 `assets/css/styles.css` Styling & Motion Contract

1. **Tokens & Custom Properties:**
   - Reuse `:root` tokens (`--ink`, `--ivory`, `--aubergine`, `--violet`, `--lilac`, `--font-display`, `--font-body`, `--r-s`, `--r-m`, `--r-full`, `--ease-out`, `--t-fast`, `--t-norm`, `--shadow-float`).
   - Drive dynamic playback progress via `--player-progress: 0` on `.player` (`transform: scaleX(var(--player-progress, 0))` on `.player__rail-fill`) and `--bar-h` (`24%..100%`) on each `.player__bar` via `element.style.setProperty(...)`—zero inline `style=` attributes.
2. **Spinning 45 Vinyl Disc & Turntable Sleeve:**
   - `.player__disc` renders concentric micro-grooves (`repeating-radial-gradient(circle at center, #141018 0 2px, #292131 2.5px 3.5px)`) and a centered `42%` label circle with a dark `5px` spindle hole (`::after`).
   - `@keyframes vinyl-spin { to { transform: rotate(360deg); } }` runs on `.player__disc` with `animation-play-state: paused` by default and `animation-play-state: running` when `.player.is-playing` is set.
   - Under `@media (prefers-reduced-motion: reduce)`, `*, *::before, *::after { animation: none !important; transition: none !important; }` already cleanly halts disc rotation and card transitions.
3. **28-Bar Waveform & Overlaid Range Input:**
   - `.player__wave-wrap` (`position: relative; height: 36px; display: flex; align-items: center`) stacks `.player__wave` (`28` flex-1 rounded bars) underneath `.player__seek` (`position: absolute; inset: -4px 0; width: 100%; height: 44px; opacity: 0; cursor: pointer; margin: 0`), giving a full `44px`-tall touch/drag target while `.player__wave-wrap:has(.player__seek:focus-visible)` draws the `2px solid var(--lilac)` keyboard focus ring around the waveform!
   - Bars with `.is-played` highlight in `var(--lilac)` (`#C4A1D8`); unplayed bars render in `rgb(255 255 255 / .2)`.
4. **Responsive Breakpoint (`@media (max-width: 600px)`):**
   - `.player` switches to `left: 12px; right: 12px; bottom: max(12px, env(safe-area-inset-bottom)); display: flex; justify-content: center; pointer-events: none;` with `.player__pill, .player__card { pointer-events: auto; }` and `.player__card { width: min(100%, 360px); }`.
   - `@media print` hides `.player` alongside `dialog` and `.site-header`.

### 3.4 `assets/js/main.js` Behavioral Contract (`initPlayer()`)

1. **Validation & Filtering:**
   - Reads `Array.isArray(PL.playlist) ? PL.playlist : []`, filters entries having non-empty `title` and valid local `safeUrl(t.src)` matching `/^assets\/audio\/[a-z0-9._-]+\.(m4a|mp3|ogg|opus|aac|wav)$/i`.
   - If `tracks.length === 0`, leaves `[data-player]` `hidden` and returns immediately.
   - Otherwise unhides `[data-player]` and adds `has-player` to `document.body`.
2. **Deterministic Waveform Fallback (`trackPeaks(track, index)`):**
   - Uses `track.peaks` when it is an array of `28` numbers in `[0, 1]`; otherwise derives `28` musical bar heights (`0.24..0.98`) seeded deterministically from `track.title + index` so every song has an organic, distinct contour with zero runtime Web Audio decoding overhead.
3. **Lazy Audio Loading & Seeking:**
   - Never sets `audio.src` until the visitor initiates playback or seeks (or sets `src` with `preload="none"` and calls `audio.play()` only inside a user gesture).
   - If the visitor drags `.player__seek` before pressing Play, stores the pending seek fraction (`0..1`), updates the visual waveform/elapsed readout immediately, and applies `audio.currentTime = pendingFraction * audio.duration` as soon as `loadedmetadata` fires.
4. **Expand / Minimize & Keyboard Accessibility:**
   - `[data-player-open]` hides `.player__pill`, shows `.player__card`, sets `aria-expanded="true"`, and moves focus to `[data-player-main-toggle]` when activated via keyboard (or `[data-player-close]`).
   - `[data-player-close]` (and pressing `Escape` anywhere inside `.player__card`) hides `.player__card`, shows `.player__pill`, sets `aria-expanded="false"`, and returns focus to `[data-player-open]`.
5. **Mutual Exclusion & `MediaSession`:**
   - Exposes an internal `pausePlayer()` hook invoked inside `loader()` (`assets/js/main.js` line 466) whenever a visitor clicks Play on any `#listen` or `#watch` embed.
   - Registers `navigator.mediaSession` metadata and action handlers (`play`, `pause`, `previoustrack`, `nexttrack`, `seekto`) wrapped in `try / catch` so unsupported browsers never throw.
6. **Error Recovery:**
   - On `audio` `error` event, clears `.is-playing`, resets Play button labels, and writes `"Audio unavailable"` into `[data-player-pill-sub]` / `[data-player-card-credits]` so a missing or corrupt file never leaves the disc spinning in silence.

### 3.5 `.agents/check.js` & `README.md` Contract

1. **`.agents/check.js`:**
   - Validates `PL.playlist` entries: non-empty `title`, local `assets/audio/...` path, file existence on disk, file size `<= 25 * 1024 * 1024` bytes (`25 MB` guard against uncompressed WAV masters), optional `duration` format (`/^\d{1,2}:\d{2}$/`), optional `cover` local file existence, optional `streamUrl` (`https:` URL), and optional `peaks` (`28` numbers in `[0, 1]`).
   - Verifies `<aside ... data-player>` exists in `index.html` and reports `(N playlist tracks)` in the `OK:` summary line.
2. **`README.md`:**
   - Documents `playlist` in the "Updating the site" table (`data/site-data.js` + `assets/audio/`) and notes missing band audio tracks under "What is still missing".

---

## 4. Blast Radius & File Map

| File Path | Action | Responsibility |
|---|---|---|
| `specs/004-music-player-pill/spec.md` | `create` | Agreed specification, UX states, accessibility, and verification contracts |
| `data/site-data.js` | `modify` | Add documented `playlist: []` block to `window.PL` |
| `index.html` | `modify` | Add `<aside class="player" ... hidden data-player>` markup |
| `assets/css/styles.css` | `modify` | Add `.player` floating pill, spinning 45 grooves, sleeve, 28-bar waveform, footer clearance, mobile safe-area, and print rules |
| `assets/js/main.js` | `modify` | Add `initPlayer()`, `MediaSession` binding, and `pausePlayer()` hook in `loader()` |
| `.agents/check.js` | `modify` | Validate `PL.playlist` schema, audio/cover assets, `<25 MB` size cap, and `[data-player]` markup |
| `README.md` | `modify` | Document `PL.playlist` (`assets/audio/`) in the content update table |
