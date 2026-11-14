# Phantom Limbs

The official website for Phantom Limbs, a five-piece band from Dallas (phantomlimbsdallas.com).

It is one scrolling page with no build step: plain HTML, CSS and JavaScript. Open `index.html` in a browser, or serve the folder from any static host.

## Updating the site

Everything that changes lives in one file: **`data/site-data.js`**. Each block in it has instructions and an example.

| To change | Edit in `data/site-data.js` |
|---|---|
| Show dates | `shows` — one line per show (`date, venue, city, time, url, status`). Past dates move to "Past Performances" automatically. |
| Gallery photos | `photos` — add files under `assets/img/gallery/` and list them. |
| Social links | `social` — paste the verified profile URLs. |
| Music, videos, press kit | `listen`, `watch`, `press` (Phase 2). |
| Contact form delivery | `contact.endpoint` |

Anything left empty is hidden, along with its nav link. With the file as committed, the page shows Meet the Band, Shows, Photography (one photo so far) and Contact.

The bio, member names and roles are approved copy and live in `index.html`.

## What still needs supplying

- **Hero photo.** Until it exists the backdrop is an aubergine gradient. `index.html` has a comment showing where the photo goes.
- **Member portraits** (4:5). Initials tiles stand in for now; see the comment above the members list in `index.html`.
- **Gallery photos**, with photographer credits and usage rights.
- **Verified social URLs** for Instagram, YouTube and Facebook.
- **Show dates.**
- **Contact form service.** With no `contact.endpoint`, the form opens the visitor's own email app with the message filled in. To have messages delivered directly to phantomlimbs62@gmail.com, create a form endpoint (Formspree, Basin, Netlify Forms or similar), paste its URL into `contact.endpoint`, and turn on that service's spam filtering. The form also carries a hidden trap field named `website`.
- **Favicon**, and an SVG master of the logo.
- **Photographer credit and rights** for the group photo in Meet the Band.
- **Empty-state wording.** "No upcoming shows right now." is placeholder microcopy, not approved copy.

## Running it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Hosting

The site is set up for **Vercel**. `vercel.json` needs no build: it serves the folder as it is, adds a few security headers, and lets browsers keep images for a day.

To put it live:

1. In Vercel, choose **Add New → Project** and import this repository.
2. Leave the framework preset on **Other**, with no build command and no output directory.
3. Deploy. Every push to `main` then publishes the site, and every pull request gets its own preview link.
4. Add `phantomlimbsdallas.com` under the project's **Domains** and point the domain's DNS at Vercel as it instructs.

`robots.txt`, `sitemap.xml`, the canonical link and the share-image tags assume the site is served from `https://phantomlimbsdallas.com/`; change them if that differs.

## How it is put together

```
index.html            page structure and approved copy
vercel.json           hosting settings
assets/css/styles.css design tokens at the top, then one block per section
assets/js/main.js     behaviour: scroll wash, nav, shows + calendar, gallery viewer, form
data/site-data.js     the content you edit
assets/img/           logo, group photo, share image
```

Design notes:

- A fixed backdrop and logo sit behind the whole page. An ivory wash fades in over them as you scroll, and content sits on frosted ivory panels in one centered column.
- The nav links sit together at the top of the page, then part to show the logo once you scroll past the hero. Under 960px wide they move into a full-screen menu.
- The calendar appears on screens wider than 720px; phones get the list.
- Players and videos load only when a visitor presses play, so no third-party content loads with the page. There is no analytics or tracking. Fonts (Fraunces, Inter) load from Google Fonts.
- Motion is switched off for visitors who ask their device for reduced motion.
- Search engines get band and show details as structured data, generated from `data/site-data.js`.
