# Phantom Limbs website

The official site for the Dallas band Phantom Limbs, live at https://www.phantomlimbsband.com/.

`README.md` covers content updates, the assets still missing, local preview and hosting. Read it first. This file adds what an agent needs and the README leaves out.

## What this is

- One scrolling page of hand-written HTML, CSS and JavaScript. Nothing is compiled or bundled.
- Vercel serves the repository root as it is, with no build command. Code that needs a bundler, a framework or `node_modules` will not run in production.
- `package.json` is there only because Vercel's analytics install added it. The page loads analytics from two script tags in the head of `index.html`. Nothing imports the npm package, and no `npm install` is needed.
- A merge or push to `main` is a production release, and nothing blocks a direct push. Work on a branch.

## Code conventions

- The README's "How it is put together" section maps the files. Content that changes often is in `data/site-data.js`. Approved copy is in `index.html`.
- Colour, type, spacing, radius and motion values are variables in the `:root` block at the top of `assets/css/styles.css`. Use them in new rules.
- In `assets/js/main.js`, each feature has its own `init…` function and `init()` calls them in order. `balanceNav` and `initScroll` run last because they need to know which sections ended up visible.
- Build page content with the `el()` helper, which writes text as text. Pass every address from the content file through `safeUrl()`, or through a stricter check such as `playerUrl()`. Together they stop an entry in `data/site-data.js` from injecting markup or a script link.

## Things that fail without an error

**The content security policy.** `vercel.json` sends a policy with every response. It allows:

- styles and fonts from this site only
- scripts from this site, inline scripts, and Vercel's analytics host
- images from this site, `data:` addresses and YouTube thumbnails
- network requests to this site and Vercel's analytics hosts
- frames from any `https` address

So an inline `style=""` attribute, a `<style>` block, a hosted font, a new image host, a new script host or a request to another site is blocked in production. When a feature needs one of these, change the policy in the same pull request. `python3 -m http.server` does not send the policy, so only the Vercel preview shows the breakage. Look for policy errors in the browser console there.

**Show entries.** A date must be written `YYYY-MM-DD`. An entry with any other date format, or with no `venue`, is dropped from the page with no warning. Past dates move to "Past Performances" after midnight Central time (`America/Chicago`). After editing `shows`, load the page and confirm the row is there.

**Listen and Watch entries.** `playerUrl()` and `youtubeId()` accept Spotify, Apple Music, SoundCloud, Bandcamp embed links and YouTube links. Any other link is dropped with no warning, and a section with no valid entry stays hidden along with its nav link. A new music or video service needs a new branch in those functions.

**Copy that is written more than once.** Change every copy together:

- Member names and roles: the bio paragraph, each member card (visible text, `aria-label` and `data-initials`) and the `member` list in `initStructuredData()`.
- The opening sentence of the bio: the page, the `description` meta tag and the `og:description` meta tag.
- Genres: the bio and the `genre` list in `initStructuredData()`.

A past rename updated the visible name and left one `aria-label` and one set of initials behind.

## Decisions already made

- The bio, member names and roles are approved copy. Reword them only when the maintainer asks.
- Nothing is invented. No made-up show dates, quotes, bios, photo credits, numbers or links, and no stock or generated photo standing in for a missing one. The page already covers each missing asset: empty sections hide, portraits show initials, and the backdrop is a gradient until the hero photo arrives.
- The logo artwork is used as supplied. Resizing and new file formats are fine. Recolouring, redrawing and restyling it are not, and it never sits on a white box.
- Players and videos load only after the visitor presses play.
- Vercel Web Analytics and Speed Insights are on by the maintainer's choice. Ask before adding any other tracker, cookie, pixel or third-party request.
- The accessibility target is WCAG 2.2 AA. The menu, the enlarged member card and the photo viewer are native `<dialog>` elements, which gives them the focus trap, Escape to close and focus return. Animation is switched off for visitors who ask for reduced motion.

## Checking a change

```sh
node --check assets/js/main.js
node --check data/site-data.js
python3 -m http.server 8000   # then open http://localhost:8000
```

There are no tests, no linter and no CI. `npm test` only prints a message.

Then look at the page:

1. At a desktop width, at 960px and narrower (the nav turns into a full-screen menu) and at 600px and narrower (the phone layout).
2. With the keyboard alone: Tab through the page, open each dialog and close it with Escape.
3. With reduced motion switched on.
4. On the pull request's Vercel preview, with the browser console open.

If you cannot open a browser, say so in the pull request. Do not describe a visual change as checked when nobody has looked at it.

## Delivering a change

- Branch from `main` as `claude/<topic>` and open a pull request. One concern per pull request.
- Put the agreed "done when" checks at the top of the description. Follow them with what changed and why, how to check it by hand, and what you could not verify.
- The maintainer reviews the preview and merges.
- When a change makes a sentence in `README.md` untrue, correct the README in the same pull request.

## Working with the maintainer

- Before editing, say in two or three sentences what you understood. Then ask about anything still undecided that would change the result. Offer choices and say which you recommend.
- Do not ask what the repository or the live page can answer. Read them.
- Keep asking as the work goes on. When a new choice appears that changes what a visitor sees or what the maintainer has to keep up, raise it and wait. Do not settle it with a guess.
- Agree the "done when" checks before writing code.
- When asked for ideas, give a short ranked list first and build nothing. For each idea say what a visitor would notice, what the band has to supply and how much upkeep it adds. Rank first the ideas that cut the maintainer's upkeep or raise the craft of the page: design, motion, speed and accessibility.
- When asked to "improve" something with no target named, report what you found with the file and line, propose an order, and let the maintainer choose.
