# Specification — Bio Editorial Typography & Readability Polish (`003-bio-typography-polish`)

- **Status:** `Draft — Ready for Human Review`
- **Selected Direction:** Option 8 Hybrid — Option 6 `3px` Aubergine Left-Rail Opener + Option 7 Asymmetric `1.38fr : 1fr` "Sound Callout" Deck (`8A` clean `Fraunces` names default; `8B` highlighter-ribbon variant optional)
- **Branch:** `bio-typography-polish`
- **Target Site:** `https://www.phantomlimbsband.com/` (zero-build static HTML/CSS/JS on Vercel)

---

## 1. Agreed "Done When" Checks

Implementation of this specification is complete when all of the following hold:

1. **Approved Copy Preserved Verbatim:** Every word, punctuation mark, and HTML entity across all three bio paragraphs in `index.html` remains 100% identical to the approved copy (`<p class="lede">` stays plain text in exact sync with `<meta name="description">` and `<meta property="og:description">`).
2. **Option 8 Hybrid Layout (`696px` Full-Column Alignment):**
   - **Row 1 — Left-Rail Opener (`#band .lede`):** Spans full `696px` width (`grid-column: 1 / -1`) anchored on the left by a `3px solid var(--aubergine)` vertical rail (`padding-left: 1.5rem`), set in optical-sized `Fraunces` (`clamp(1.375rem, 1.15rem + .9vw, 1.5625rem)`, `line-height: 1.36`), aligned flush with the left edge of `.group-photo`.
   - **Row 2 Left — Lineup Story (`1.38fr`):** Warm `var(--text-muted)` (`#3A3140`, `~10.2:1` contrast) `Inter` (`1rem / 1.74`, `calt` contextual dashes/slashes) with non-breaking (`white-space: nowrap`) emphasized member names (`<strong class="prose__name">`) and `600`-weight aubergine `<span class="prose__act">Lovers &amp; Lunatics</span>` (`~9.2:1` contrast).
   - **Row 2 Right — Sound Callout (`1fr`, `.prose__coda`):** Tinted aubergine-ivory callout block (`background: rgb(84 42 105 / .065); border-top: 2px solid var(--aubergine); border-radius: 0 0 var(--r-s) var(--r-s); padding: 1.25rem 1.375rem`) in optical-sized `Fraunces` (`1.09375rem / 1.52`, `color: var(--ink)`), aligned flush with the right edge of `.group-photo`.
3. **Responsive Phone Stack (`<=680px`):** Collapses cleanly to a single column (`grid-template-columns: 1fr`) while retaining both the `3px` vertical left rail on `.lede` and the `2px` top-bordered callout box on `.prose__coda`, with zero horizontal overflow at `320px–390px`.
4. **True Variable Font Rendering & WCAG 2.2 AA Contrast:** Uses only self-hosted `fraunces-latin.woff2` (`opsz 9..144`, `wght 400..600`) and `inter-latin.woff2` (`wght 400..600`, `calt`) upright Roman variable axes (zero synthetic italics, zero external requests), with all text contrast ratios `>9:1`.
5. **Automated Copy-Sync & CSP Verification:** `npm test` (`.agents/check.js`) exits `0`, verifying `<p class="lede">` meta sync, absence of inline `style=` attributes, and that all five `.band-member__name` values appear in `#band .prose`.

---

## 2. Technical Contracts

### 2.1 `index.html` Markup Contract (`#band .prose`)

Keep `<p class="lede">` untouched plain text. Add `<strong class="prose__name">`, `<span class="prose__act">`, and `class="prose__coda"` on paragraphs 2 and 3 with **zero wording changes**:

```html
      <div class="prose">
        <p class="lede">Dallas band Phantom Limbs brings together an eclectic mix of musical influences and backgrounds, blending elements of rock, funk, R&amp;B and beyond.</p>
        <p>Keyboardist/guitarist <strong class="prose__name">Joren Cain</strong> and guitarist <strong class="prose__name">Danny Enriquez</strong>, the principal songwriters behind beloved DFW jazz group <span class="prose__act">Lovers &amp; Lunatics</span> (2018–2026), have joined forces with three accomplished musicians: vocalist <strong class="prose__name">Tiffany Baucum</strong>, drummer <strong class="prose__name">Kei Tabuchi</strong> and bassist <strong class="prose__name">Robert Tracy</strong>.</p>
        <p class="prose__coda">Together, they create a sound shaped by distinct perspectives, unexpected connections and a shared appetite for musical exploration.</p>
      </div>
```

### 2.2 `assets/css/styles.css` Typography & Grid Contract

Scope the asymmetric 2-column hybrid layout to `#band .prose` so generic `.prose` remains a safe single-column default if reused elsewhere:

```css
.prose { max-width: 620px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--s-5); font-feature-settings: "calt" 1; }
.prose p { text-wrap: pretty; }
.lede { font: 400 var(--fs-lede)/1.4 var(--font-display); font-optical-sizing: auto; }

#band .prose {
  max-width: none; width: 100%;
  display: grid; grid-template-columns: minmax(0, 1.38fr) minmax(0, 1fr);
  gap: 1.75rem var(--s-6); align-items: stretch;
  color: var(--text-muted); font-size: 1rem; line-height: 1.74;
}
#band .lede {
  grid-column: 1 / -1;
  padding: 2px 0 2px var(--s-5);
  border-left: 3px solid var(--aubergine);
  color: var(--ink);
  font-size: clamp(1.375rem, 1.15rem + .9vw, 1.5625rem); line-height: 1.36; letter-spacing: -.008em;
}
.prose__name { font: 500 1.075rem/1 var(--font-display); color: var(--ink); white-space: nowrap; }
.prose__act { font-weight: 600; color: var(--aubergine); white-space: nowrap; }
.prose__coda {
  display: flex; align-items: center;
  padding: 1.25rem 1.375rem;
  border-top: 2px solid var(--aubergine); border-radius: 0 0 var(--r-s) var(--r-s);
  background: rgb(84 42 105 / .065); color: var(--ink);
  font: 400 1.09375rem/1.52 var(--font-display); font-optical-sizing: auto;
}
@media (max-width: 680px) {
  #band .prose { grid-template-columns: 1fr; gap: 1.375rem; }
  #band .lede { padding-left: 1.125rem; }
}
```

*(Note — Optional `8B` Highlighter-Ribbon Swap: If `8B` is preferred over `8A`, `.prose__name` uses `font-weight: 600; color: var(--ink); white-space: nowrap; background: linear-gradient(transparent 60%, rgb(84 42 105 / .16) 60%); padding: 0 2px; border-radius: 2px;` instead of `Fraunces`.)*

### 2.3 `.agents/check.js` & `README.md` Sync

1. **`.agents/check.js`:** Strip HTML tags from `#band .prose`, decode entities, and verify every `.band-member__name` from `#band-track` appears in the bio paragraph (catching any future card/bio name drift).
2. **`README.md`:** Sync `Meet the Band` → `The Band` where referencing the visible navigation label updated in commit `0f657dc`.

---

## 3. Acceptance Scenarios & Boundary Cases

1. **Given** a desktop (`1280px`) or tablet (`960px`) viewport, **When** `#band` renders, **Then** `#band .lede`'s `3px` left rail aligns flush with the left edge of `.group-photo`, and `.prose__coda`'s right edge aligns flush with the right edge of `.group-photo` (`696px` span).
2. **Given** a phone viewport (`<=680px`, tested down to `320px`), **When** `#band .prose` collapses to `1fr`, **Then** `.lede`, the lineup paragraph, and `.prose__coda` stack cleanly with zero horizontal overflow (`white-space: nowrap` keeps each 2-word musician name intact without exceeding `280px` inner width).
3. **Given** a future edit renames a member card without updating `#band .prose`, **When** `npm test` runs, **Then** `.agents/check.js` exits non-zero naming the missing member.

---

## 4. Explicit Exclusions (Out of Scope)

- **No wording, spelling, or punctuation edits** to the approved bio copy.
- **No font file, JavaScript (`main.js`), or `site-data.js` changes.**

---

## 5. Blast Radius & File Map

| File Path | Action | Responsibility |
|---|---|---|
| `index.html` | `modify` | Add `<strong class="prose__name">`, `<span class="prose__act">`, and `class="prose__coda"` in `#band .prose` |
| `assets/css/styles.css` | `modify` | Add `#band .prose` `1.38fr : 1fr` grid, `3px` `.lede` left rail, `.prose__name` / `.prose__act`, `.prose__coda` callout, and `<=680px` stack (~24 LOC) |
| `.agents/check.js` | `modify` | Verify every `.band-member__name` appears in `#band .prose` |
| `README.md` | `modify` | Sync `The Band` nav/section naming with commit `0f657dc` |
