# Cymbeline's website

A simple portfolio site, hosted free on GitHub Pages.

**Live site:** https://kenclemson.github.io/cymbeline/

## Editing the site (no code needed)

All the words, pictures and links live in one file, `content/site.json`.
You don't have to open it: the **Pages CMS** editor gives you a form for it.

1. Go to **https://app.pagescms.org** (on a computer or phone) and sign in
   with the email address you were invited with.
2. Open **cymbeline**, then **My website**.
3. Change whatever you like:
   - **Your name / Tagline / Welcome text**: the top of the page.
   - **Gallery**: one entry per piece. *Add an entry* to add a new piece, then
     choose a picture (you can upload straight from your phone). Drag entries to
     reorder them. Remove a piece with its delete button.
   - **About me photo / About me**: the About section. The About box lets you
     make text bold or italic and add links.
   - **Quick facts**: the small facts under About.
   - **Contact heading / Email address / Links**: the Contact section.
     A link with an empty web address is hidden.
4. Press **Save**. The live site updates about a minute later. Refresh the page
   to see it.

Tips:
- Photos straight from a phone are fine. Very large files (over ~10 MB) make the
  page slow, so if a photo is huge, use the "Medium"/"Large" size when you share
  or export it.
- The **Category** on each gallery piece (e.g. Painting, Drawing) creates the
  filter buttons above the gallery automatically.
- Uploaded pictures are kept in the **Media** section of the editor.

## One-time setup (for Ken)

1. Go to https://app.pagescms.org, sign in with GitHub, and install the
   Pages CMS GitHub App on the `KenClemson/cymbeline` repository only.
2. Open the repo in Pages CMS, then go to **Collaborators** and invite
   Cymbeline by email. She doesn't need a GitHub account.

## How it's put together

| File | What it is |
| --- | --- |
| `content/site.json` | All the site's text, pictures and links (edited by Pages CMS) |
| `images/` | Uploaded pictures |
| `.pages.yml` | Tells Pages CMS which fields to show in the editor |
| `index.html`, `styles.css`, `script.js` | The page layout, look and behaviour |

Every save in the editor is a commit to `main`, and GitHub Pages republishes
automatically. There's no build step.

To preview locally, serve the folder over HTTP (opening `index.html` directly
won't load the content file):

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

### Custom domain (optional)

Buy a domain (e.g. from Cloudflare or Namecheap), then in the GitHub repo go to
**Settings → Pages → Custom domain** and follow GitHub's DNS instructions.
