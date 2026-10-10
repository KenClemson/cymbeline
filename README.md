# Cymbeline B King — website

A simple academic website, hosted free on GitHub Pages.

**Live site:** https://kenclemson.github.io/cymbeline/ (moving to https://cymbelinebking.com once the domain is set up)

## Editing the site (no code needed)

Use the **Pages CMS** editor at **https://app.pagescms.org** (on a computer or
phone). Sign in with the email address you were invited with, then open
**cymbeline**. The menu on the left has one section per part of the site:

- **Home page & contact**: your name, position, welcome text, photo, CV,
  email and links (Google Scholar, ORCID, etc.). A link with an empty web
  address is hidden.
- **About page**: your bio (with headings, links, lists and pictures) and your
  research interests.
- **Writing**: your publications. Use *Add an entry* for each one. You can add a
  DOI or web link, upload a PDF, add a cover image and a short summary. The site
  sorts them newest first. Tick **Show on home page** to feature one under
  "Recent writing".
- **Extra pages**: add whole new pages (Teaching, Talks, Projects...). Each one
  appears in the menu automatically, in the order listed.

Press **Save**. The live site updates about a minute later. Refresh the page to
see it.

Tips:
- A year like "Forthcoming" or "In press" puts that item at the top of the list.
- Photos straight from a phone are fine. Very large files (over ~10 MB) make the
  page slow.
- Uploaded files (photos, PDFs, CV) are kept in the **Media** section.

## One-time setup (for Ken)

1. Go to https://app.pagescms.org, sign in with GitHub, and install the
   Pages CMS GitHub App on the `KenClemson/cymbeline` repository only.
2. Open the repo in Pages CMS, go to **Collaborators**, and invite Cymbeline by
   email. She doesn't need a GitHub account.

## How it's put together

| File | What it is |
| --- | --- |
| `content/site.json` | Name, position, intro, photo, CV, contact details |
| `content/about.json` | About text and research interests |
| `content/writing.json` | Publications list |
| `content/pages.json` | Extra pages (shown at `page.html?p=<title>`) |
| `media/` | Uploaded pictures and files |
| `.pages.yml` | Tells Pages CMS which fields to show in the editor |
| `index.html`, `about.html`, `writing.html`, `contact.html`, `page.html` | The pages |
| `styles.css`, `script.js` | Shared look and behaviour. The script builds the menu and fills each page from `content/` |

Every save in the editor is a commit to `main`, and GitHub Pages republishes
automatically. There's no build step.

To preview locally, serve the folder over HTTP (opening the HTML files directly
won't load the content):

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

### Custom domain

`cymbelinebking.com` will point here. Once it's bought:
1. At the registrar, add four `A` records for `@`: 185.199.108.153,
   185.199.109.153, 185.199.110.153 and 185.199.111.153. Then add a `CNAME`
   record for `www` pointing to `kenclemson.github.io`.
2. In the repo go to **Settings → Pages → Custom domain**, enter
   `cymbelinebking.com`, and tick **Enforce HTTPS** once it's available.
