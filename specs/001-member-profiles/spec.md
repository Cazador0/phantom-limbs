# Specification — Member Profile Portraits & Multi-Photo Modal (`001-member-profiles`)

- **Status:** `Implemented`
- **Architecture:** Option 1 — Cohesive Mural Row + Multi-Photo Member Modal + Unlocked `#photography`
- **Branch:** `claude/member-profiles`
- **Target Site:** `https://www.phantomlimbsband.com/` (zero-build static HTML/CSS/JS on Vercel)

---

## 1. Agreed "Done When" Checks

Implementation of this specification is complete when all of the following hold:

1. **Cohesive `#band` Portrait Row:** All five member cards in `index.html` render crisp `4:5` Series A (Mural + Instrument) `<picture>` portraits (`400w` + `880w` WebP with `880w` JPEG fallback) in place of the initials tiles, with **no** multi-photo badges or extra chrome on the card surface.
2. **Multi-Photo Enlarged Member Modal:** Clicking any member card opens `<dialog class="band-member-dialog">` with the existing FLIP zoom animation. Members with multiple photos (Tiffany: 3; Joren, Danny, Kei: 2) show an accessible thumbnail switcher inside the modal (`44×55` px targets, `ArrowUp`/`ArrowDown` or click/tap to switch photos), while single-photo members (Robert: 1) show **no** switcher chrome.
3. **`#photography` Section Unlocked:** `band-photo-1.png` is exported to `assets/img/gallery/` (`1318×879` JPEG + `800×534` WebP thumb) and added as entry #2 in `window.PL.photos` (`data/site-data.js`), automatically unhiding the `Photography` nav link, 2-column gallery, and `<dialog class="viewer">` lightbox.
4. **Reproducible Crop Pipeline & Privacy Hygiene:** `.agents/build-portraits.py` deterministically generates all web derivatives from a local source folder (`--src <dir>`), preserves orientation (`exif_transpose`), strips raw camera EXIF/GPS metadata, keeps total added repo weight under `3 MB` (`~2.7 MB` measured vs. `244 MB` raw masters), and adds zero `npm` dependencies.
5. **CSP, Copy Sync & Automated Verification:** `npm test` (`.agents/check.js`) exits `0`, verifying JS syntax, `data-photos` slug validity, primary-portrait sync, local asset existence, binary image pixel dimensions, `PL.photos` integrity, zero inline `style=""` attributes in `index.html` (`vercel.json` `style-src 'self'`), and updated `README.md` accuracy.
6. **Manual / Preview Checks:** Keyboard-only navigation (`Tab`, `Enter`/`Space`, `ArrowLeft`/`ArrowRight`, `ArrowUp`/`ArrowDown`, `Escape`), `prefers-reduced-motion: reduce`, responsive layouts (`>=961px`, `<=960px`, `<=600px`), and zero CSP errors in the browser console.

---

## 2. Context & Architectural Summary

The band photo shoot comprises **10 personal member portraits** and **2 full-band group takes** (~244 MB raw). Every member has a portrait in **Series A (Mural + Instrument)**, while four of the five members also have **Series B (Downtown Solo)** portraits (and Tiffany has three total portraits).

Rather than crowding the main `#band` row or leaving Robert Tracy's 1-photo card visually asymmetric on hover, **Option 1**:
- Places the matched 5-of-5 **Series A** portraits on the `#band` cards so the band row reads as one unified editorial set.
- Lazily hydrates `2..3` alternate portraits inside the existing `<dialog class="band-member-dialog">` (`PR #31`) only when a visitor opens a member's card.
- Adds the alternate horizontal mural group pose (`band-photo-1.png`) as the second entry in `window.PL.photos` to unlock `#photography`, while keeping `.backdrop__photo` on the sharp aubergine gradient (avoiding upscaling `1318×879` across `2400w` desktop viewports).

---

## 3. Source-to-Asset Mapping & Crop Specification

All member portrait derivatives use canonical **display-order** slugs (`<member-slug>-<index>`) under `assets/img/members/` at exact `4:5` aspect ratio:
- `<slug>-400.webp` (`400 × 500` px, WebP `quality=82`)
- `<slug>-880.webp` (`880 × 1100` px, WebP `quality=82` — 2× Retina for the `440px` modal)
- `<slug>-880.jpg` (`880 × 1100` px, progressive JPEG `quality=85` fallback)

### 3.1 Personal Member Portraits (`10` Source Files → `30` Web Derivatives)

| Member (Approved Copy) | Display Slot | Source Filename & Native Size | Output Slug Prefix | `4:5` Crop Anchor (`x, y`) & Framing Rationale |
|---|---|---|---|---|
| **Tiffany Baucum**<br>`Lead vocals` | **#1 (Card + Modal 1)** | `Tiffany-Baucum-personal-3.jpeg`<br>(`4912×7360` JPEG, `2:3`) | `tiffany-baucum-1` | `(0.50, 0.12)` — Series A 36MP mural master; keeps full headroom and fur sleeve detail |
| **Tiffany Baucum** | **#2 (Modal 2)** | `Tiffany-Baucum-personal-1.png`<br>(`1025×1535` PNG, `2:3`) | `tiffany-baucum-2` | `(0.50, 0.12)` — Windswept hair-in-motion mural pose (`1025×1281` native crop → `880×1100`, zero upscaling) |
| **Tiffany Baucum** | **#3 (Modal 3)** | `Tiffany-Baucum-personal-2.png`<br>(`1320×1274` PNG, `~1:1`) | `tiffany-baucum-3` | `(0.50, 0.20)` — Series B Arts District stairs (`1019×1274` native crop → `880×1100`, zero upscaling) |
| **Joren Cain**<br>`Keyboards / guitar` | **#1 (Card + Modal 1)** | `Joren-Cain-personal-1.jpeg`<br>(`4755×7125` JPEG, `2:3`) | `joren-cain-1` | `(0.50, 0.08)` — Series A mural; top-weighted anchor preserves headroom + full red keyboard |
| **Joren Cain** | **#2 (Modal 2)** | `Joren-Cain-personal-2.jpeg`<br>(`4144×6210` JPEG, `2:3`) | `joren-cain-2` | `(0.50, 0.15)` — Series B downtown skyscraper portrait (arms crossed) |
| **Danny Enriquez**<br>`Guitar / vocals` | **#1 (Card + Modal 1)** | `Danny-Enriquez-personal-1.jpeg`<br>(`4912×7360` JPEG, `2:3`) | `danny-enriquez-1` | `(0.50, 0.10)` — Series A mural; keeps headroom + full gold electric guitar |
| **Danny Enriquez** | **#2 (Modal 2)** | `Danny-Enriquez-personal-2.jpeg`<br>(`4912×7360` JPEG, `2:3`) | `danny-enriquez-2` | `(0.50, 0.12)` — Series B downtown skyscraper portrait (denim jacket) |
| **Robert Tracy**<br>`Bass` | **#1 (Card + Modal 1)** | `Robert-Tracy-personal-1.jpeg`<br>(`4912×7360` JPEG, `2:3`) | `robert-tracy-1` | `(0.50, 0.12)` — Series A mural; keeps headroom + full sunburst P-bass body/neck |
| **Kei Tabuchi**<br>`Drums` | **#1 (Card + Modal 1)** | `Kei-Tabuchi-personal-2.jpeg`<br>(`4599×6891` JPEG, `2:3`) | `kei-tabuchi-1` | `(0.50, 0.10)` — Series A mural (`personal-2` in source); keeps headroom + snare drum |
| **Kei Tabuchi** | **#2 (Modal 2)** | `Kei-Tabuchi-personal-1.jpeg`<br>(`4819×7221` JPEG, `2:3`) | `kei-tabuchi-2` | `(0.50, 0.12)` — Series B downtown skyscraper portrait (`personal-1` in source, sunglasses) |

### 3.2 Group / Band Photos (`2` Source Files)

| Source Filename & Native Size | Action | Repo Asset Paths & Dimensions | Placement |
|---|---|---|---|
| `band-photo-2.jpeg` (`4703×6416` JPEG) | **Keep existing** (`PR #35`) | `assets/img/group-mural-hd-{960,1600}.{webp,jpg}` (`1600×1504`) | `#band` `.group-photo` + `PL.photos[0]` |
| `band-photo-1.png` (`1318×879` PNG, `3:2`) | **Generate new** (native size, no upscaling) | `assets/img/gallery/band-mural-pose-1318.jpg` (`1318×879`, JPEG `q=86`)<br>`assets/img/gallery/band-mural-pose-800.webp` (`800×534`, WebP `q=82`) | `PL.photos[1]` in `data/site-data.js` (unlocks `#photography`) |

---

## 4. Technical Contracts

### 4.1 `index.html` Markup Contract

1. **Member Cards (`#band-track`):**
   - Each `.band-member__portrait` keeps `data-initials="<XX>"` as a CSS fallback and receives its primary Series A `<picture>`:
     ```html
     <div class="band-member__portrait" data-initials="TB" data-photos="tiffany-baucum-1,tiffany-baucum-2,tiffany-baucum-3">
       <picture>
         <source type="image/webp" srcset="assets/img/members/tiffany-baucum-1-400.webp 400w, assets/img/members/tiffany-baucum-1-880.webp 880w" sizes="(max-width: 600px) 68vw, (max-width: 819px) 216px, 150px">
         <img src="assets/img/members/tiffany-baucum-1-880.jpg" alt="" width="880" height="1100" loading="lazy" decoding="async">
       </picture>
     </div>
     ```
   - `alt=""` remains empty on the card `<img>` because the wrapping `<button>` already carries `aria-label="Enlarge <Member Name>"` and visible name/role text.
   - Multi-photo members declare `data-photos="<slug-1>,<slug-2>[,<slug-3>]"` in display order. Single-photo members (Robert Tracy) may either omit `data-photos` or set `data-photos="robert-tracy-1"`; both produce identical single-photo behavior.
   - Remove the stale `PORTRAITS (pending)` comment block once portraits are in place (or condense it to a 2-line maintenance note documenting `data-photos` + `.agents/build-portraits.py`).

2. **Enlarged Member Dialog (`[data-band-member-dialog]`):**
   - Insert a thumbnail switcher container directly between `[data-band-member-portrait]` and `[data-band-member-name]`:
     ```html
     <div class="band-member-dialog__photos" role="group" aria-label="Member photos" hidden data-band-member-photos></div>
     ```

### 4.2 `assets/js/main.js` Behavior Contract (`initBandMemberDialog`)

1. **Slug Parsing & Trust Boundary Validation:**
   - Parse `data-photos` on `.band-member__portrait` by splitting on `,`, trimming whitespace, and keeping only slugs matching `/^[a-z0-9-]+$/`.
   - If valid slugs exist, build portrait descriptors pointing to `assets/img/members/<slug>-{400.webp,880.webp,880.jpg}`; otherwise fall back to cloning the card's existing `<picture>`/`<img>` (preserving `PR #31` compatibility).
   - Construct all DOM elements via `el()` and `safeUrl()` — never `innerHTML` with data strings and never inline `style` attributes.

2. **Lazy Hydration & Rendering (`paint` / `paintPhoto`):**
   - Secondary portraits (`-2`, `-3`) are never requested during initial page load; `<picture>`/`<img>` elements for the modal switcher are created only when the user opens or steps to that member in `<dialog class="band-member-dialog">`.
   - When `memberPhotos.length > 1`:
     - Unhide `[data-band-member-photos]` and render one `<button type="button" class="band-member-dialog__thumb">` per photo containing `<img src="assets/img/members/<slug>-400.webp" alt="" width="400" height="500" decoding="async">`.
     - Set `aria-label="Photo X of N"` on each thumbnail button and `aria-current="true"` on the active photo button.
     - Set the main dialog portrait `<img>` `alt` to `"<Name>, photo <X> of <N>"` (`sizes="(max-width: 520px) 90vw, 440px"`).
   - When `memberPhotos.length === 1` (Robert Tracy):
     - Set `[data-band-member-photos].hidden = true`, clear its children, and set main portrait `<img>` `alt` to `"<Name>"`.

3. **Navigation, Keyboard & Touch Rules:**
   - **Stepping between members (`prev`/`next` buttons, `ArrowLeft`/`ArrowRight`, horizontal swipe on card):** Advances `index` across the 5 members and resets `photoIndex = 0` (always opening each member on their Series A primary portrait).
   - **Switching photos within a member (`memberPhotos.length > 1`):**
     - Clicking/tapping a `.band-member-dialog__thumb` sets `photoIndex` to that photo.
     - Pressing `ArrowUp` or `ArrowDown` while the dialog is open (`e.preventDefault()`) cycles `photoIndex` backward/forward (`(photoIndex + step + len) % len`) through the active member's photos.
     - If `!reduceMotion && portrait.animate`, run a subtle `180ms` opacity crossfade (`opacity: .55 -> 1`) on `[data-band-member-portrait]` when switching photos; under `prefers-reduced-motion: reduce`, swap immediately with no animation.

### 4.3 `assets/css/styles.css` Styling Contract

- **Zero card-surface changes:** `.band-member__card` on the main page stays clean with no badges or extra dots.
- **Thumbnail switcher (`.band-member-dialog__photos`):**
  - Centered flex row (`display: flex; justify-content: center; gap: var(--s-2)`).
  - `.band-member-dialog__thumb`: `width: 44px; height: 55px` (`4:5` aspect ratio, meeting WCAG 2.2 AA 2.5.8 target size and matching the site's 44px touch-target floor), `padding: 0`, `border-radius: var(--r-s)`, `border: 2px solid transparent`, `overflow: hidden`, `background: var(--ink)`, `opacity: .68`, `cursor: pointer`.
  - `.band-member-dialog__thumb[aria-current="true"]`: `border-color: var(--aubergine); opacity: 1; box-shadow: 0 0 0 1px var(--aubergine)`.
  - `.band-member-dialog__thumb:focus-visible`: `outline: 2px solid var(--violet); outline-offset: 2px`.
- **Short-Viewport Fit Guard:**
  - `.band-member-dialog__card` currently caps width via `width: min(440px, 100%, calc((100dvh - 240px) * .8))` so the `4:5` portrait + text fit inside `100dvh`.
  - Add `.band-member-dialog__card:has(.band-member-dialog__photos:not([hidden])) { width: min(440px, 100%, calc((100dvh - 308px) * .8)); }` so the extra `~68px` thumbnail row never causes vertical overflow or scrollbars inside the modal on laptop screens (`720px–820px` height).

### 4.4 `data/site-data.js` Gallery Contract

Append `band-photo-1` as the second entry in `window.PL.photos` with blank `credit: ""` (no invented photographer credit):

```js
photos: [
  { src: "assets/img/group-mural-hd-1600.jpg", thumb: "assets/img/group-mural-hd-960.webp", width: 1600, height: 1504, alt: "Phantom Limbs, all five members standing outdoors with their instruments in front of a mural", credit: "" },
  { src: "assets/img/gallery/band-mural-pose-1318.jpg", thumb: "assets/img/gallery/band-mural-pose-800.webp", width: 1318, height: 879, alt: "Phantom Limbs, all five members standing in front of an outdoor mural holding their instruments horizontally", credit: "" }
],
```

### 4.5 Offline Crop Script & Static Verification (`.agents/`)

1. **`.agents/build-portraits.py`:**
   - Standard-library Python 3 + Pillow CLI invoked locally via `python3 .agents/build-portraits.py --src <path-to-drive-pictures>`.
   - Encodes the exact 10-portrait + 1-gallery manifest from Section 3 (filenames, target slugs, `(x, y)` crop anchors, output sizes/qualities).
   - Runs `ImageOps.exif_transpose()` before cropping and saves derivatives **without** EXIF/GPS blocks.
   - Fails fast with a non-zero exit code if any expected source file is missing or smaller than `880×1100` (for portraits) / `1318×879` (for `band-photo-1.png`).

2. **`.agents/check.js` (`npm test` — zero npm dependencies):**
   - Extend the `.band-member` check loop to validate `data-photos`:
     - Every comma-separated slug matches `/^[a-z0-9-]+$/` with no duplicates.
     - Slug `#1` matches the `<picture>` filename prefix rendered inside that member's `.band-member__portrait`.
     - `assets/img/members/<slug>-400.webp` (`400×500`), `-880.webp` (`880×1100`), and `-880.jpg` (`880×1100`) all exist and match exact pixel dimensions (read directly from PNG/JPEG/WebP binary headers using Node `Buffer`).
   - Verify `PL.photos` image files match their declared `width` and `height`.
   - Fail if `index.html` contains any inline `style=` attribute (catching `vercel.json` CSP violations locally).

---

## 5. Acceptance Scenarios & Boundary Cases

### Acceptance Scenarios
1. **Given** a visitor loads the page on mobile or desktop, **When** `#band` scrolls into view, **Then** all 5 member cards render matched Series A portraits (`loading="lazy"`, `400w` or `880w` WebP) and zero secondary modal portraits (`-2`, `-3`) are requested over the network.
2. **Given** a visitor clicks "Tiffany Baucum" on `#band`, **When** `<dialog class="band-member-dialog">` animates open, **Then** `tiffany-baucum-1` is displayed with 3 thumbnail buttons (`aria-current="true"` on #1), and clicking thumbnail #2 or pressing `ArrowDown` switches the main portrait to `tiffany-baucum-2` and updates `alt` to `"Tiffany Baucum, photo 2 of 3"`.
3. **Given** Tiffany's modal is open on photo #3, **When** the visitor clicks "Next member" or presses `ArrowRight` until reaching "Robert Tracy" (`4 of 5`), **Then** the thumbnail bar hides cleanly (`hidden`) and Robert's single portrait fills the card with zero empty controls.
4. **Given** `PL.photos` now contains 2 entries, **When** `init()` runs, **Then** `Photography` un-hides in both the desktop balanced nav (`balanceNav()`) and mobile `<dialog class="menu">`, and clicking either gallery tile opens `<dialog class="viewer">` (`Photo 1 of 2` / `Photo 2 of 2`).

### Boundary & Failure Cases
1. **Missing or malformed `data-photos` attribute:** If a future edit omits `data-photos` on a new member card that still has `<picture>`, `initBandMemberDialog()` falls back cleanly to single-photo mode using the card's `<picture>`, and `npm test` flags any malformed slug or missing derivative before deploy.
2. **Short viewport (`100dvh <= 700px`, e.g., landscape phone or compact laptop):** `.band-member-dialog__card:has(.band-member-dialog__photos:not([hidden]))` scales card width down proportionally so portrait + thumbnails + name + member nav remain visible without clipping the close button.
3. **Reduced motion (`prefers-reduced-motion: reduce`):** Both the FLIP card zoom and intra-member photo crossfade are bypassed instantaneously.

---

## 6. Explicit Exclusions (Out of Scope)

- **No card-surface badges, dots, or hover crossfades** on `#band` cards.
- **No Hero backdrop (`.backdrop__photo`) changes** (`band-photo-1.png` is `1318×879` px and would upscale on wide desktop monitors; hero stays on the aubergine gradient until a high-res landscape hero master is supplied).
- **No photographer credit text** invented or displayed (`credit: ""` kept blank until supplied by the band).
- **No per-member bio paragraphs or `schema.org` `Person.image` changes** (approved copy in `index.html` remains untouched).
- **No `npm` packages, bundlers, or build steps** added to `package.json` or Vercel deployment.

---

## 7. Blast Radius & File Map

| File Path | Action | Responsibility |
|---|---|---|
| `.agents/build-portraits.py` | `create` | Repeatable local CLI cropping 10 personal + 1 band photo into EXIF-stripped WebP/JPEG derivatives |
| `assets/img/members/*` | `create` | 30 portrait derivatives (`10` poses × `{400.webp, 880.webp, 880.jpg}`, ~1.6 MB total) |
| `assets/img/gallery/band-mural-pose-*` | `create` | `band-mural-pose-1318.jpg` + `band-mural-pose-800.webp` from `band-photo-1.png` (~260 KB total) |
| `index.html` | `modify` | Add `<picture>` + `data-photos` to 5 `.band-member__portrait` blocks; add `[data-band-member-photos]` container in modal |
| `assets/js/main.js` | `modify` | Extend `initBandMemberDialog()` (~30 LOC) for lazy `1..N` member photo switching + `ArrowUp`/`ArrowDown` |
| `assets/css/styles.css` | `modify` | Style `.band-member-dialog__photos` / `__thumb` (~22 LOC) + `:has()` short-viewport height cap |
| `data/site-data.js` | `modify` | Append `band-mural-pose-1318.jpg` as `PL.photos[1]` to unlock `#photography` |
| `.agents/check.js` | `modify` | Validate `data-photos` slugs, binary image dimensions, and absence of inline `style=` in `index.html` |
| `README.md` | `modify` | Update "Updating the site" & "What still needs supplying" so README stays true (`CLAUDE.md` rule) |
