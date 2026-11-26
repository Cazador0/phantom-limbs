# Specification — Bio Editorial Typography & Readability Polish (`003-bio-typography-polish`)

- **Status:** `Implemented`
- **Selected Direction:** Option 10 — Option 8A Desktop (`3px` Aubergine Left-Rail Opener + Asymmetric `1.38fr : 1fr` Sound Callout Deck with `Fraunces` Member Names) + Option 10 Mobile (`<=680px` Hanging Gutter Rail + Full-Bleed Sound Band)
- **Branch:** `bio-typography-polish`
- **Target Site:** `https://www.phantomlimbsband.com/` (zero-build static HTML/CSS/JS on Vercel)

---

## 1. Agreed "Done When" Checks

Implementation of this specification is complete when all of the following hold:

1. **Approved Copy Preserved Verbatim:** Every word, punctuation mark, and HTML entity across all three bio paragraphs in `index.html` remains 100% identical to the approved copy (`<p class="lede">` stays plain text in exact sync with `<meta name="description">` and `<meta property="og:description">`).
2. **Desktop Layout (`>680px`, `696px` Full-Column Alignment):**
   - **Row 1 — Left-Rail Opener (`#band .lede`):** Spans full `696px` width (`grid-column: 1 / -1`) anchored on the left by a `3px solid var(--aubergine)` vertical rail (`padding-left: 1.5rem`), set in optical-sized `Fraunces` (`clamp(1.3125rem, 1.12rem + .9vw, 1.5625rem)`, `line-height: 1.36`), aligned flush with the left edge of `.group-photo`.
   - **Row 2 Left — Lineup Story (`1.38fr`):** Warm `var(--text-muted)` (`#3A3140`, `~10.2:1` contrast) `Inter` (`1rem / 1.74`, `calt` contextual dashes/slashes) with non-breaking (`white-space: nowrap`) `500`-weight `Fraunces` member names (`<strong class="prose__name">`) matching the member cards below, plus `600`-weight aubergine `<span class="prose__act">Lovers &amp; Lunatics</span>` (`~9.2:1` contrast).
   - **Row 2 Right — Sound Callout (`1fr`, `.prose__coda`):** Tinted aubergine-ivory callout block (`background: rgb(84 42 105 / .065); border-top: 2px solid var(--aubergine); border-radius: 0 0 var(--r-s) var(--r-s); padding: 1.25rem 1.375rem`) in optical-sized `Fraunces` (`1.09375rem / 1.52`, `color: var(--ink)`), aligned flush with the right edge of `.group-photo`.
3. **Option 10 Mobile Layout (`<=680px`):**
   - Collapses to `grid-template-columns: 1fr` and hangs `#band .lede`'s `3px` vertical rail `-13px` into the left gutter (`margin-left: -13px; padding-left: 10px`) so the left text edge of `Dallas`, `Keyboardist`, and `Together` share **one exact vertical axis**.
   - Bleeds `.prose__coda` edge-to-edge across `.panel` (`margin-inline: calc(var(--s-6) * -1)` at `601–680px`, `calc(var(--s-5) * -1)` at `<=600px`) with `2px solid var(--aubergine)` top border and subtle bottom hairline, bookending the full-bleed band photo above with zero horizontal overflow down to `320px`.
4. **True Variable Font Rendering & WCAG 2.2 AA Contrast:** Uses only self-hosted `fraunces-latin.woff2` (`opsz 9..144`, `wght 400..600`) and `inter-latin.woff2` (`wght 400..600`, `calt`) upright Roman variable axes (zero synthetic italics, zero external requests), with all text contrast ratios `>9:1`.
5. **Automated Copy-Sync & CSP Verification:** `npm test` (`.agents/check.js`) exits `0`, verifying `<p class="lede">` meta sync, absence of inline `style=` attributes, and that all five `.band-member__name` values appear in `#band .prose`.

---

## 2. Technical Contracts

### 2.1 `index.html` Markup Contract (`#band .prose`)

```html
      <div class="prose">
        <p class="lede">Dallas band Phantom Limbs brings together an eclectic mix of musical influences and backgrounds, blending elements of rock, funk, R&amp;B and beyond.</p>
        <p>Keyboardist/guitarist <strong class="prose__name">Joren Cain</strong> and guitarist <strong class="prose__name">Danny Enriquez</strong>, the principal songwriters behind beloved DFW jazz group <span class="prose__act">Lovers &amp; Lunatics</span> (2018–2026), have joined forces with three accomplished musicians: vocalist <strong class="prose__name">Tiffany Baucum</strong>, drummer <strong class="prose__name">Kei Tabuchi</strong> and bassist <strong class="prose__name">Robert Tracy</strong>.</p>
        <p class="prose__coda">Together, they create a sound shaped by distinct perspectives, unexpected connections and a shared appetite for musical exploration.</p>
      </div>
```

### 2.2 `assets/css/styles.css` Typography & Responsive Grid Contract

- Desktop (`>680px`): `#band .prose` uses `grid-template-columns: minmax(0, 1.38fr) minmax(0, 1fr); gap: 1.75rem var(--s-6)`, `#band .lede` spans `1 / -1` with `border-left: 3px solid var(--aubergine); padding: 2px 0 2px var(--s-5)`, and `.prose__coda` renders the `2px` aubergine-top-bordered callout block.
- Mobile (`<=680px` & `<=600px`): `#band .prose` collapses to `1fr`, `#band .lede` uses `margin-left: -13px; padding: 1px 0 1px 10px` (`-13px + 3px border + 10px padding = 0px` net text offset!), and `#band .prose__coda` bleeds flush across `.column`'s inline padding (`--s-6` at `601–680px`, `--s-5` at `<=600px`).

### 2.3 `.agents/check.js` & `README.md` Sync

- `.agents/check.js` strips tags from `#band .prose`, decodes HTML entities, and verifies every `.band-member__name` appears in the bio paragraph.
- `README.md` updates `Meet the Band` → `The Band` to stay aligned with commit `0f657dc`.

---

## 3. Blast Radius & File Map

| File Path | Action | Responsibility |
|---|---|---|
| `index.html` | `modify` | Add `<strong class="prose__name">`, `<span class="prose__act">`, and `class="prose__coda"` in `#band .prose` |
| `assets/css/styles.css` | `modify` | Add Option 8A desktop grid + Option 10 hanging-rail & full-bleed mobile rules |
| `.agents/check.js` | `modify` | Verify every `.band-member__name` appears in `#band .prose` |
| `README.md` | `modify` | Sync `The Band` section/nav naming with commit `0f657dc` |
