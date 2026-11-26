# Phantom Limbs

The official website for Phantom Limbs, a five-piece band from Dallas (phantomlimbsband.com).

It is one scrolling page with no build step: plain HTML, CSS and JavaScript. Open `index.html` in a browser, or serve the folder from any static host.

## Updating the site

Everything that changes lives in one file: **`data/site-data.js`**. Each block in it has instructions and an example.

| To change | Edit in `data/site-data.js` |
|---|---|
| Show dates | `shows` — one line per show (`date, venue, city, time, support, url, linkText, status`). Past dates move to "Past Performances" automatically. |
| Gallery photos | `photos` — add files under `assets/img/gallery/` and list them. The Photography section appears once there are two. |
| Social links | `social` — the Instagram, YouTube and Facebook URLs. They show in the header, the phone menu and the footer. |
| Floating music player | `playlist` — put compressed `.m4a` or `.mp3` files under `assets/audio/` and list them. The floating Spinning 45 player appears once there is one entry. |
| Music, videos, press kit | `listen` and `watch` take ordinary share links from Spotify, Apple Music, SoundCloud, Bandcamp (its embed link) and YouTube (standard videos appear in a `16:9` grid; `/shorts/` links — or `reel: true` — appear in a vertical `9:16` Reels row); `press` takes the PDF's path. Each section appears once it has an entry. |
| Contact address | `contact.email` |

Anything left empty is hidden, along with its nav link. With the file as committed, the page shows The Band, Shows and Contact.

The bio, member names and roles are approved copy and live in `index.html`. Member portraits (`assets/img/members/`) are declared on each `.band-member__portrait` via `<picture>` and optional `data-photos` slugs, generated with `python3 .agents/build-portraits.py --src <dir>` and checked by `npm test`.

## What still needs supplying

- **Hero photo.** Until it exists the backdrop is an aubergine gradient. `index.html` has a comment showing where the photo goes.
- **Songs for the floating music player** (compressed `.m4a` or `.mp3` files in `assets/audio/`, listed in `playlist` in `data/site-data.js`).
- **Gallery photos**, with photographer credits and usage rights (one mural group photo is in `data/site-data.js`; the Photography section appears once a second photo is added).
- **Contact form.** It opens the visitor's own email app with the message filled in, addressed to phantomlimbs62@gmail.com. No email service or server code is involved. Visitors with no email app set up can copy the message and paste it into webmail. The form also carries a hidden trap field named `website`.
- **An SVG master of the logo.**
- **Photographer credit and rights** for the mural shoot photos in The Band.

## Running it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Hosting

The site is set up for **Vercel**. `vercel.json` needs no build: it serves the folder as it is, adds security headers (including a content security policy that only allows this site's own files, Vercel's analytics, YouTube thumbnails and, once added, embedded players), and lets browsers keep images and fonts.

To put it live:

1. In Vercel, choose **Add New → Project** and import this repository.
2. Leave the framework preset on **Other**, with no build command and no output directory.
3. Deploy. Every push to `main` then publishes the site, and every pull request gets its own preview link.
4. Add `www.phantomlimbsband.com` (and `phantomlimbsband.com`, redirecting to it) under the project's **Domains** and point the domain's DNS at Vercel as it instructs.

Search and sharing point at `https://www.phantomlimbsband.com/`. If the address ever changes, update it in `index.html` (the canonical, `og:`, `twitter:` and `#schema-json` tags), `robots.txt` and `sitemap.xml`. The dynamic show data for search engines follows the canonical link on its own.

## How it is put together

```
index.html            page structure and approved copy
vercel.json           hosting settings
assets/css/styles.css design tokens at the top, then one block per section
assets/js/main.js     behaviour: scroll wash, nav, floating music player, shows list, gallery viewer, form
data/site-data.js     the content you edit
assets/audio/         playlist audio files (.m4a / .mp3, optional)
assets/img/           logo, group photo, share image, icons (browser tab: the logo itself; phone home screen: the logo on aubergine)
```

Design notes:

- A fixed backdrop and logo sit behind the whole page. An ivory wash fades in over them as you scroll, and content sits on frosted ivory panels in one centered column.
- The nav links sit together at the top of the page, then part to show the logo once you scroll past the hero. Under 960px wide they move into a full-screen menu.
- Shows is a list of upcoming dates, with past dates in a collapsible "Past Performances" block.
- Players and videos load only when a visitor presses play, so no third-party content loads with the page. Vercel Web Analytics and Speed Insights are switched on (the two script tags in the head of `index.html`); nothing else tracks visitors. Fonts (Fraunces, Inter) are served from the site itself (`assets/fonts/`, Latin characters only, OFL licence alongside), so they need no request to another site.
- Content panels are solid until a hero photo is added, then turn into frosted glass over it.
- Motion is switched off for visitors who ask their device for reduced motion.
- Search engines get band and show details as structured data, generated from `data/site-data.js`.
