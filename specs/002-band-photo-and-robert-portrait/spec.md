# Specification — Replace Band Group Photo & Add Robert Tracy Portrait #2 (`002-band-photo-and-robert-portrait`)

- **Status:** `Draft — Ready for Human Review`
- **Builds On:** `specs/001-member-profiles/spec.md` (`PR #36`, merged at `81edc77`)
- **Branch:** `claude/band-photo-and-robert-portrait`
- **Target Site:** `https://www.phantomlimbsband.com/` (zero-build static HTML/CSS/JS on Vercel)

---

## 1. Agreed "Done When" Checks

Implementation of this specification is complete when all of the following hold:

1. **Replaced `#band` Group Photo (`3:2` Landscape):** `.group-photo` in `index.html` renders the new `band-photo.png` master (`1534×1025`, `3:2` landscape) via responsive WebP + progressive JPEG derivatives (`assets/img/band-photo-{960,1534}.{webp,jpg}`) with exact `width="1534" height="1025"` layout reservation and zero upscaling.
2. **Obsolete Group/Gallery Assets Removed & `#photography` Auto-Hidden:** The superseded `assets/img/group-mural-hd-*` (4 files) and `assets/img/gallery/band-mural-pose-*` (2 files) derivatives are deleted, and `window.PL.photos` in `data/site-data.js` holds only the single new `band-photo-1534.jpg` entry (`photos.length === 1`), automatically hiding `#photography` and its nav link until a second distinct photo is supplied.
3. **Robert Tracy Multi-Photo Modal (`2` Portraits):** `Robert-Tracy-personal-2.JPG` (`4590×6877` JPEG action bass shot) is cropped to `4:5` (`robert-tracy-2-{400.webp,880.webp,880.jpg}`) with full headroom, bass body, and Fender headstock preserved, and appended to Robert's card (`data-photos="robert-tracy-1,robert-tracy-2"`). All 5 band members now display 2–3 portraits inside `<dialog class="band-member-dialog">`.
4. **Updated Reproducible Crop Pipeline & Privacy Hygiene:** `.agents/build-portraits.py` reflects the updated 12-file source folder (`11` personal portraits + `band-photo.png`), preserves EXIF orientation (`exif_transpose`), strips raw camera EXIF/GPS metadata, and cuts net repository image size by `~1.4 MB`.
5. **Static, Dimension, CSP & README Verification:** `npm test` (`.agents/check.js`) exits `0` — validating `.group-photo`, `PL.photos`, all `11` member portrait poses (`33` files), binary PNG/JPEG/WebP dimensions, copy sync, and absence of inline `style=` attributes — and `README.md` accurately describes the visible sections (`Meet the Band, Shows and Contact`).

---

## 2. Context & Scope Summary

Following `PR #36`, the source `pictures` folder was updated with two refinements:
- **`band-photo.png` (`1534 × 1025` PNG, `3:2` landscape, `2.17 MB`):** Higher-resolution master of the horizontal mural lineup, replacing both `band-photo-2.jpeg` (the previous square-cropped `#band` group shot) and `band-photo-1.png` (the `1318×879` gallery duplicate). Because `.group-photo` renders at `max-width: 696px` CSS (`1392px` at `2×` DPR), `1534px` native width provides full `>2×` Retina sharpness with zero upscaling.
- **`Robert-Tracy-personal-2.JPG` (`4590 × 6877` JPEG, `2:3` vertical, `28.9 MB`):** Action shot of Robert playing up the fretboard with eyes closed. Keeping `Robert-Tracy-personal-1.jpeg` (`robert-tracy-1`) on his `#band` card preserves the matched direct-gaze Series A row across all 5 members while unlocking his 2-photo switcher inside the enlarged member modal.

Zero JavaScript (`assets/js/main.js`) or CSS (`assets/css/styles.css`) changes are required: both `initGallery()` (`photos.length > 1`) and `initBandMemberDialog()` (`slugs.length > 1`) already handle the new state out of the box.

---

## 3. Source-to-Asset Mapping & Crop Specification

### 3.1 New Member Portrait (`Robert-Tracy-personal-2.JPG`)

| Member | Display Slot | Source Filename & Native Size | Output Slug Prefix | `4:5` Crop Anchor (`x, y`) & Framing Rationale |
|---|---|---|---|---|
| **Robert Tracy**<br>`Bass` | **#1 (Card + Modal 1)** | `Robert-Tracy-personal-1.jpeg`<br>(`4912×7360` JPEG, `2:3`) | `robert-tracy-1` *(existing)* | `(0.50, 0.12)` — Series A direct-gaze mural portrait (unchanged on `#band` card) |
| **Robert Tracy** | **#2 (Modal 2 — New)** | `Robert-Tracy-personal-2.JPG`<br>(`4590×6877` JPEG, `2:3`) | `robert-tracy-2` | `(0.50, 0.06)` — Keeps `100%` of `4590px` width and top-anchors (`y = 0.06`) so all 4 tuning pegs on the top-right Fender headstock, Robert's hair, and the bottom-left bass bridge fit cleanly inside `880×1100` (`4:5`) |

Generated files under `assets/img/members/`:
- `robert-tracy-2-400.webp` (`400 × 500` px, WebP `quality=82`)
- `robert-tracy-2-880.webp` (`880 × 1100` px, WebP `quality=82`)
- `robert-tracy-2-880.jpg` (`880 × 1100` px, progressive JPEG `quality=85`)

### 3.2 Replacement Band Group Photo (`band-photo.png`)

| Source Filename & Native Size | Output Asset Paths & Exact Dimensions | Format & Quality | Usage |
|---|---|---|---|
| `band-photo.png`<br>(`1534×1025` PNG, `3:2`) | `assets/img/band-photo-1534.webp` (`1534 × 1025`)<br>`assets/img/band-photo-1534.jpg` (`1534 × 1025`)<br>`assets/img/band-photo-960.webp` (`960 × 642`)<br>`assets/img/band-photo-960.jpg` (`960 × 642`) | WebP `quality=82`<br>Progressive JPEG `quality=86` (`1534w`) / `85` (`960w`)<br>Full `3:2` uncropped frame, EXIF stripped | `#band` `.group-photo` `<picture>` + `window.PL.photos[0]` |

### 3.3 Obsolete Assets to Delete (`6` Files, `~2.21 MB`)

- `assets/img/group-mural-hd-1600.jpg`
- `assets/img/group-mural-hd-1600.webp`
- `assets/img/group-mural-hd-960.jpg`
- `assets/img/group-mural-hd-960.webp`
- `assets/img/gallery/band-mural-pose-1318.jpg`
- `assets/img/gallery/band-mural-pose-800.webp`

---

## 4. Technical Contracts

### 4.1 `index.html` Markup Updates

1. **`.group-photo` (`#band` section):**
   ```html
   <figure class="group-photo reveal">
     <picture>
       <source type="image/webp" srcset="assets/img/band-photo-960.webp 960w, assets/img/band-photo-1534.webp 1534w" sizes="(max-width: 600px) 95vw, 696px">
       <img src="assets/img/band-photo-1534.jpg" srcset="assets/img/band-photo-960.jpg 960w, assets/img/band-photo-1534.jpg 1534w" sizes="(max-width: 600px) 95vw, 696px" alt="Phantom Limbs, all five members standing outdoors with their instruments in front of a mural" width="1534" height="1025" loading="lazy" decoding="async">
     </picture>
   </figure>
   ```
2. **Robert Tracy `.band-member` Card (`#band-track`):**
   - Update `data-photos="robert-tracy-1"` to `data-photos="robert-tracy-1,robert-tracy-2"`. Primary `<picture>` (`robert-tracy-1`) and approved copy (`Robert Tracy` / `Bass`) remain unchanged.

### 4.2 `data/site-data.js` Update

Replace both previous entries in `window.PL.photos` with the single new group photo (`credit: ""` kept blank):

```js
photos: [
  { src: "assets/img/band-photo-1534.jpg", thumb: "assets/img/band-photo-960.webp", width: 1534, height: 1025, alt: "Phantom Limbs, all five members standing outdoors with their instruments in front of a mural", credit: "" }
],
```

### 4.3 `.agents/build-portraits.py` & `.agents/check.js` Updates

1. **`.agents/build-portraits.py`:**
   - Add `("Robert-Tracy-personal-2.JPG", "robert-tracy-2", (0.50, 0.06))` to `PORTRAITS` (`11` total poses).
   - Replace `GALLERY_GROUP` (`band-photo-1.png` → `assets/img/gallery/`) with `GROUP_PHOTO = ("band-photo.png", "band-photo", (1534, 1025), (960, 642))` outputting directly to `assets/img/band-photo-{960,1534}.{webp,jpg}` with EXIF stripped.
2. **`.agents/check.js` (`npm test`):**
   - Add a `.group-photo` check verifying that every `<source srcset>` and `<img src/srcset>` inside `<figure class="group-photo">` resolves to an existing local file and that `<img width height>` matches the binary dimensions of `src` (`1534×1025`) — preventing silent broken group-photo paths or CLS dimension mismatches.

### 4.4 `README.md` Sync

- Update line 19 back to: *"With the file as committed, the page shows Meet the Band, Shows and Contact."*
- Update "What still needs supplying" so gallery photos note that one mural group shot is in `data/site-data.js` and `#photography` will appear automatically once a second photo is added.

---

## 5. Acceptance Scenarios & Boundary Cases

1. **Given** a visitor loads the page on desktop (`>=961px`) or phone (`<=600px`), **When** `#band` renders, **Then** `.group-photo` displays `band-photo` at `3:2` (`1534×1025` / `960×642`) with zero layout shift, and the `Photography` nav link and `#photography` section remain hidden (`PL.photos.length === 1`).
2. **Given** a visitor opens Robert Tracy's card (`4 of 5`) in `<dialog class="band-member-dialog">`, **When** the dialog opens, **Then** `robert-tracy-1` displays first alongside 2 `44×55` px thumbnail buttons, and clicking thumbnail #2 or pressing `ArrowDown` switches to `robert-tracy-2` (`alt="Robert Tracy, photo 2 of 2"`).
3. **Given** any member modal is open and focus is on a photo thumbnail, **When** the visitor steps across all 5 members with `ArrowLeft`/`ArrowRight`, **Then** focus stays on the first thumbnail of each member (`1..5` all have `2..3` photos) with zero console or CSP violations.

---

## 6. Explicit Exclusions (Out of Scope)

- **No changes to `assets/js/main.js` or `assets/css/styles.css`** (existing `001` multi-photo modal and gallery visibility logic already cover all cases).
- **No changes to `assets/img/og.jpg`** (social share card intentionally displays the Phantom Limbs logo).
- **No Hero backdrop (`.backdrop__photo`) changes** or invented photographer credits.

---

## 7. Blast Radius & File Map

| File Path | Action | Responsibility |
|---|---|---|
| `.agents/build-portraits.py` | `modify` | Add `robert-tracy-2` (`(0.50, 0.06)`) and build `assets/img/band-photo-{960,1534}.{webp,jpg}` from `band-photo.png` |
| `assets/img/band-photo-*` | `create` | 4 responsive group-photo derivatives (`960w` + `1534w` in WebP + JPEG) |
| `assets/img/members/robert-tracy-2-*` | `create` | 3 portrait derivatives (`400.webp`, `880.webp`, `880.jpg`) |
| `assets/img/group-mural-hd-*` | `delete` | Remove 4 superseded group-photo files |
| `assets/img/gallery/band-mural-pose-*` | `delete` | Remove 2 superseded gallery files |
| `index.html` | `modify` | Update `.group-photo` `<picture>` to `band-photo-{960,1534}` (`1534×1025`) and Robert's `data-photos` to include `robert-tracy-2` |
| `data/site-data.js` | `modify` | Set `PL.photos` to single `band-photo-1534.jpg` entry (auto-hiding `#photography`) |
| `.agents/check.js` | `modify` | Add `.group-photo` asset existence + binary `width`/`height` check |
| `README.md` | `modify` | Sync visible sections (`Meet the Band, Shows and Contact`) and gallery status |
