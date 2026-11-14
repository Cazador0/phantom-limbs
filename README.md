# Phantom Limbs

The official website for Phantom Limbs, a five-piece band from Dallas (phantomlimbsdallas.com).

It is one scrolling page with no build step: plain HTML, CSS and JavaScript. Open `index.html` in a browser, or serve the folder from any static host.

## Updating the site

Everything that changes lives in one file: **`data/site-data.js`**. Each block in it has instructions and an example.

| To change | Edit in `data/site-data.js` |
|---|---|
| Show dates | `shows` — one line per show (`date, venue, city, time, support, url, linkText, status`). Past dates move to "Past Performances" automatically. |
| Gallery photos | `photos` — add files under `assets/img/gallery/` and list them. The Photography section appears once there are two. |
| Social links | `social` — the Instagram, YouTube and Facebook URLs. They show in the header, the phone menu and the footer. |
| Music, videos, press kit | `listen`, `watch`, `press` (Phase 2). |
| Contact address | `contact.email` |

Anything left empty is hidden, along with its nav link. With the file as committed, the page shows Meet the Band, Shows and Contact.

The bio, member names and roles are approved copy and live in `index.html`.

## What still needs supplying

- **Hero photo.** Until it exists the backdrop is an aubergine gradient. `index.html` has a comment showing where the photo goes.
- **Member portraits** (4:5). Initials tiles stand in for now; see the comment above the members list in `index.html`.
- **Gallery photos**, with photographer credits and usage rights.
- **Contact form.** It opens the visitor's own email app with the message filled in, addressed to phantomlimbs62@gmail.com. No email service or server code is involved. Visitors with no email app set up can copy the message and paste it into webmail. The form also carries a hidden trap field named `website`.
- **Favicon.** The current icons in `assets/img/icons/` and `favicon.ico` are provisional, made from the logo on aubergine. Replace them with the final design when it exists, keeping the file names.
- **An SVG master of the logo.**
- **Photographer credit and rights** for the group photo in Meet the Band.

## Running it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Hosting

The site is set up for **Vercel**. `vercel.json` needs no build: it serves the folder as it is, adds security headers (including a content security policy that only allows this site's own files, YouTube thumbnails and, once added, embedded players), and lets browsers keep images and fonts.

To put it live:

1. In Vercel, choose **Add New → Project** and import this repository.
2. Leave the framework preset on **Other**, with no build command and no output directory.
3. Deploy. Every push to `main` then publishes the site, and every pull request gets its own preview link.
4. Add `phantomlimbsdallas.com` under the project's **Domains** and point the domain's DNS at Vercel as it instructs.

Search and sharing currently point at `https://phantom-limbs.vercel.app/`. Once phantomlimbsdallas.com is connected, replace that address in four places: the canonical and `og:` tags in `index.html`, `robots.txt` and `sitemap.xml`. The band and show data for search engines follows the canonical link on its own.

## How it is put together

```
index.html            page structure and approved copy
vercel.json           hosting settings
assets/css/styles.css design tokens at the top, then one block per section
assets/js/main.js     behaviour: scroll wash, nav, shows list, gallery viewer, form
data/site-data.js     the content you edit
assets/img/           logo, group photo, share image, icons
```

Design notes:

- A fixed backdrop and logo sit behind the whole page. An ivory wash fades in over them as you scroll, and content sits on frosted ivory panels in one centered column.
- The nav links sit together at the top of the page, then part to show the logo once you scroll past the hero. Under 960px wide they move into a full-screen menu.
- Shows is a list of upcoming dates, with past dates in a collapsible "Past Performances" block.
- Players and videos load only when a visitor presses play, so no third-party content loads with the page. There is no analytics or tracking. Fonts (Fraunces, Inter) are served from the site itself (`assets/fonts/`, Latin characters only, OFL licence alongside), so the page makes no requests to other sites.
- Content panels are solid until a hero photo is added, then turn into frosted glass over it.
- Motion is switched off for visitors who ask their device for reduced motion.
- Search engines get band and show details as structured data, generated from `data/site-data.js`.
