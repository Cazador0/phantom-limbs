# Specification — Bio Editorial Typography & Readability Polish (`003-bio-typography-polish`)

- **Status:** `Draft — Ready for Human Review`
- **Selected Direction:** Option 1 (Recommended) — Centered Serif Hook + Hairline Divider + Scannable Name Emphasis + Fraunces Closing Coda *(Alternatives 2 & 3 documented in Section 6 if preferred)*
- **Branch:** `bio-typography-polish`
- **Target Site:** `https://www.phantomlimbsband.com/` (zero-build static HTML/CSS/JS on Vercel)

---

## 1. Agreed "Done When" Checks

Implementation of this specification is complete when all of the following hold:

1. **Approved Copy Preserved Verbatim:** Every word, punctuation mark, and entity across all three bio paragraphs in `index.html` remains 100% identical to the approved copy (`<p class="lede">` stays plain text in sync with `<meta name="description">` and `<meta property="og:description">`).
2. **Three-Part Editorial Hierarchy:**
   - **Hook (`.lede`):** Centered (`max-width: 34ch; text-align: center; text-wrap: balance`) in optical-sized `Fraunces` (`clamp(1.375rem, 1.15rem + .95vw, 1.6875rem)`, `line-height: 1.42`) with a centered `48px` aubergine-tinted hairline rule (`::after`) beneath it, eliminating the orphaned 3-word tail and harmonizing with the centered heading and photo above.
   - **Lineup Story (Paragraph 2):** Comfortable `600px` reading measure in `Inter` (`line-height: 1.76`, `color: var(--text-muted)` `#3A3140`, `~10.2:1` contrast) with the five band member names subtly weighted (`<strong class="prose__name">` in `600` `var(--ink)`) and `Lovers & Lunatics` accented (`<span class="prose__act">` in `500` `var(--aubergine)`, `~9.2:1` contrast) so visitors can scan all five musicians in one glance.
   - **Closing Coda (`.prose__coda`):** Centered optical-sized `Fraunces` (`1.1875rem / 1.52`, `text-wrap: balance`, `color: var(--ink)`) separated by a soft hairline top border, giving the closing musical statement distinct cadence before `THE BAND` portrait row.
3. **True Variable Font Rendering (Zero Faux Italics, Zero External Requests):** Uses only the self-hosted `fraunces-latin.woff2` (`opsz 9..144`, `wght 400..600`) and `inter-latin.woff2` (`wght 400..600`, `calt` contextual dashes/slashes) variable axes — no synthetic `font-style: italic` and no third-party font requests.
4. **WCAG 2.2 AA Contrast & Responsive Readability:** All text roles (`--ink` `~14:1`, `--text-muted` `~10.2:1`, `--aubergine` `~9.2:1` on `--panel-solid`) exceed WCAG 2.2 AA (`4.5:1`) and AAA (`7:1`), and line lengths scale cleanly at desktop (`1280px`), tablet (`960px`), and phone (`<=600px`) widths.
5. **Automated Copy-Sync & CSP Verification:** `npm test` (`.agents/check.js`) exits `0`, verifying `<p class="lede">` meta sync, absence of inline `style=` attributes, and that all five `.band-member__name` values appear in the `#band .prose` bio paragraph.

---

## 2. Diagnosis of Current Bio Block (`main` @ `0f657dc`)

1. **Alignment clash:** `MEET PHANTOM LIMBS`, the `696px` group photo above, and `THE BAND` cards below are all centered, while `.prose` snaps hard left (`max-width: 620px`), leaving `R&B and beyond.` dangling as a 3-word orphan on line 4 of `.lede`.
2. **Uniform weight in a 40-word roll-call sentence:** Paragraph 2 introduces 5 musicians, 5 instruments, a former DFW jazz group, and a date range (`2018–2026`) in uniform `400`-weight `#1B1521` Inter, forcing the eye to parse dense prose to find the band members' names.
3. **Flat closing cadence:** Paragraph 3 (*"Together, they create a sound shaped by distinct perspectives..."*) acts as the artistic thesis of the band, yet is styled identically to the biographical roll-call above it.
4. **Font binary constraint:** Binary inspection of `assets/fonts/fraunces-latin.woff` and `inter-latin.woff` confirms both contain `fvar` variable tables (`Fraunces`: `opsz 9..144`, `wght 400..600`; `Inter`: `wght 400..600`, `GSUB` `calt`), with **upright Roman outlines only**. Styling emphasis through weight (`500`/`600`), color tokens, optical sizing, and spacing avoids browser-synthesized faux italics.

---

## 3. Technical Contracts

### 3.1 `index.html` Markup Contract (`#band .prose`)

Keep `<p class="lede">` completely unchanged (plain text, preserving exact sync with `<meta name="description">` and `<meta property="og:description">`). Add semantic `<strong class="prose__name">`, `<span class="prose__act">`, and `class="prose__coda"` on paragraphs 2 and 3 with **zero wording changes**:

```html
      <div class="prose">
        <p class="lede">Dallas band Phantom Limbs brings together an eclectic mix of musical influences and backgrounds, blending elements of rock, funk, R&amp;B and beyond.</p>
        <p>Keyboardist/guitarist <strong class="prose__name">Joren Cain</strong> and guitarist <strong class="prose__name">Danny Enriquez</strong>, the principal songwriters behind beloved DFW jazz group <span class="prose__act">Lovers &amp; Lunatics</span> (2018–2026), have joined forces with three accomplished musicians: vocalist <strong class="prose__name">Tiffany Baucum</strong>, drummer <strong class="prose__name">Kei Tabuchi</strong> and bassist <strong class="prose__name">Robert Tracy</strong>.</p>
        <p class="prose__coda">Together, they create a sound shaped by distinct perspectives, unexpected connections and a shared appetite for musical exploration.</p>
      </div>
```

### 3.2 `assets/css/styles.css` Typography Contract

Scope editorial enhancements cleanly so `.prose` / `.lede` tokens remain reusable while `#band`'s 3-part bio gets tailored rhythm:

```css
.prose {
  max-width: 600px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.375rem;
  color: var(--text-muted); line-height: 1.76;
  font-feature-settings: "calt" 1;
}
.prose p { text-wrap: pretty; }
.lede {
  max-width: 34ch; margin: 0 auto;
  color: var(--ink); text-align: center; text-wrap: balance;
  font: 400 clamp(1.375rem, 1.15rem + .95vw, 1.6875rem)/1.42 var(--font-display);
  letter-spacing: -.005em; font-optical-sizing: auto;
}
.lede::after {
  content: ""; display: block; width: 48px; height: 1px;
  margin: var(--s-5) auto var(--s-1);
  background: color-mix(in srgb, var(--aubergine) 45%, var(--hairline));
}
.prose__name { font-weight: 600; color: var(--ink); }
.prose__act { font-weight: 500; color: var(--aubergine); }
.prose__coda {
  margin-top: var(--s-1); padding-top: 1.125rem;
  border-top: 1px solid color-mix(in srgb, var(--hairline) 65%, transparent);
  color: var(--ink); text-align: center; text-wrap: balance;
  font: 400 clamp(1.0625rem, 1rem + .25vw, 1.1875rem)/1.52 var(--font-display);
  font-optical-sizing: auto;
}
```

At `@media (max-width: 600px)`:
- `.prose` inherits `font-size: 1rem` (`16px` body) with `line-height: 1.72`, keeping paragraph 2 comfortable on narrow `320px–390px` screens while `.lede` (`~1.375rem`) and `.prose__coda` (`~1.0625rem`) stay balanced without awkward 1-word orphans.

### 3.3 `.agents/check.js` & `README.md` Sync

1. **`.agents/check.js`:**
   - Keep the existing `<p class="lede">` == `<meta name="description">` == `<meta property="og:description">` check intact.
   - Add a member-name bio sync check (enforcing `CLAUDE.md`'s rule *"Member names and roles: the bio paragraph and each member card"*): strip HTML tags from `#band .prose`, decode entities, and verify every `.band-member__name` from `#band-track` appears in the bio paragraph.
2. **`README.md`:**
   - Sync `Meet the Band` → `The Band` where referencing the visible navigation label updated in commit `0f657dc`.

---

## 4. Acceptance Scenarios & Boundary Cases

1. **Given** a desktop (`1280px`) or tablet (`960px`) viewport, **When** `#band` renders, **Then** `.lede` centers cleanly across balanced lines with no 1–2 word orphan tail, followed by the `48px` hairline rule, scannable member names in paragraph 2, and the centered `Fraunces` `.prose__coda` paragraph above `THE BAND`.
2. **Given** a narrow mobile viewport (`375px` / `320px`), **When** `#band .prose` wraps, **Then** no horizontal overflow occurs, inline `<strong class="prose__name">` names wrap naturally at normal word boundaries, and `.lede` / `.prose__coda` scale smoothly via `clamp(...)`.
3. **Given** a future maintainer renames a member card in `index.html` without updating `.prose`, **When** `npm test` runs, **Then** `.agents/check.js` fails immediately naming the out-of-sync member.

---

## 5. Explicit Exclusions (Out of Scope)

- **No wording, spelling, or punctuation edits** to the approved bio copy.
- **No new font files, italic subsets, or external CDN requests** (`assets/fonts/` stays untouched).
- **No JavaScript changes** (`assets/js/main.js` and `data/site-data.js` untouched).

---

## 6. Alternative Directions Considered (Easy Swaps Before Execution)

If after reviewing the visual renders you prefer one of the alternatives over Option 1:
- **Alternative A (Option 2 — Classic Magazine Drop-Cap + All-Fraunces Book Serif):** Left-aligned `560px` column set entirely in optical-sized `Fraunces` (`1.125rem / 1.72`) with a 2-line aubergine `::first-letter` drop cap `"D"` on `.lede` and `600`-weight member names.
- **Alternative B (Option 3 — Frosted Liner-Note Card + 2-Column Desktop Grid):** Places `.prose` inside a `rgb(255 255 255 / .45)` hairline card (`max-width: 696px`, matching `.group-photo` width), with the centered `Fraunces` `.lede` spanning both columns over a hairline divider and paragraphs 2 & 3 side-by-side on `>680px` screens.

---

## 7. Blast Radius & File Map

| File Path | Action | Responsibility |
|---|---|---|
| `index.html` | `modify` | Add `<strong class="prose__name">`, `<span class="prose__act">`, and `class="prose__coda"` in `#band .prose` (zero word changes) |
| `assets/css/styles.css` | `modify` | Update `.prose` / `.lede` and add `.lede::after`, `.prose__name`, `.prose__act`, `.prose__coda` (~22 LOC) |
| `.agents/check.js` | `modify` | Verify every `.band-member__name` appears in `#band .prose` text |
| `README.md` | `modify` | Sync `The Band` section/nav naming with commit `0f657dc` |
