// Builds every page from the files in content/.
// To change what's on the site, use the Pages CMS editor (or edit content/*.json) — not this file.
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var page = document.body.getAttribute("data-page");
  var site = {}, about = {}, writing = [], pages = [];

  // ---------- Helpers ----------

  // File paths: allow "media/x.jpg", "/media/x.jpg" or full https:// URLs.
  function asset(path) {
    if (!path) return "";
    if (/^(https?:)?\/\//i.test(path) || /^data:/i.test(path)) return path;
    return String(path).replace(/^\/+/, "");
  }

  // Links: forgive "scholar.google.com/..." (no https://), bare DOIs and email addresses.
  function href(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(url) || /^[\w-]+\.html([?#].*)?$/i.test(url)) return url;
    if (/^doi:\s*/i.test(url)) url = url.replace(/^doi:\s*/i, "");
    if (/^10\.\d{4,}\//.test(url)) return "https://doi.org/" + url;
    if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(url)) return "mailto:" + url;
    return "https://" + url;
  }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  function setField(field, value) {
    document.querySelectorAll('[data-field="' + field + '"]').forEach(function (node) {
      node.textContent = value || "";
    });
  }

  function external(a) {
    if (/^https?:/i.test(a.href) && a.host !== location.host) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }

  function slugify(s) {
    return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function setTitle(prefix) {
    document.title = prefix ? prefix + " — " + (site.name || "") : (site.name || "");
  }

  // Rich-text from the editor: fix up uploaded image paths and open outside links in a new tab.
  function setRichText(node, html) {
    node.innerHTML = html || "";
    node.querySelectorAll("img").forEach(function (img) { img.src = asset(img.getAttribute("src")); });
    node.querySelectorAll("a[href]").forEach(function (a) {
      a.setAttribute("href", href(a.getAttribute("href")));
      external(a);
    });
  }

  // ---------- Shared: menu and footer ----------

  function renderNav() {
    var items = [{ label: "About", url: "about.html", key: "about" },
                 { label: "Writing", url: "writing.html", key: "writing" }];
    pages.forEach(function (p) {
      if (p && p.title) items.push({ label: p.title, url: "page.html?p=" + slugify(p.title), key: "page:" + slugify(p.title) });
    });
    items.push({ label: "Contact", url: "contact.html", key: "contact" });

    var current = page === "custom" ? "page:" + new URLSearchParams(location.search).get("p") : page;
    var nav = $("#nav");
    nav.innerHTML = "";
    var inner = el("div", { class: "wrap nav-inner" });
    inner.appendChild(el("a", { class: "nav-name", href: "index.html" }, site.name || ""));

    var btn = el("button", { class: "menu-btn", type: "button", "aria-expanded": "false", "aria-controls": "nav-links" }, "Menu");
    var ul = el("ul", { class: "nav-links", id: "nav-links" });
    items.forEach(function (it) {
      var li = el("li");
      var a = el("a", { href: it.url }, it.label);
      if (it.key === current) a.setAttribute("aria-current", "page");
      li.appendChild(a);
      ul.appendChild(li);
    });
    var navEl = el("nav", { "aria-label": "Main" });
    navEl.appendChild(btn);
    navEl.appendChild(ul);
    inner.appendChild(navEl);
    nav.appendChild(inner);

    function setOpen(open) {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    }
    btn.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  function renderFooter() {
    var f = $("#footer");
    f.innerHTML = "";
    f.appendChild(el("span", null, "© " + new Date().getFullYear() + " " + (site.name || "")));
    var cv = asset(site.cv);
    var links = el("span", { class: "footer-links" });
    if (cv) links.appendChild(el("a", { href: cv, target: "_blank", rel: "noopener" }, "CV"));
    links.appendChild(el("a", { href: "contact.html" }, "Contact"));
    f.appendChild(links);
  }

  function renderPhoto() {
    document.querySelectorAll("[data-photo]").forEach(function (img) {
      if (site.photo) {
        img.src = asset(site.photo);
        img.alt = "Photo of " + (site.name || "");
      }
      img.closest("[data-photo-wrap]").hidden = !site.photo;
    });
    var aboutBox = $(".about");
    if (aboutBox) aboutBox.classList.toggle("no-photo", !site.photo);
  }

  // ---------- Writing list ----------

  // Newest first. A non-number year such as "Forthcoming" or "In press" goes at the top.
  function sortPubs(list) {
    function key(p) {
      var y = String(p.year || "").trim();
      if (!y) return -Infinity;
      var n = parseInt(y, 10);
      return isNaN(n) ? Infinity : n;
    }
    return list
      .map(function (p, i) { return { p: p, i: i, k: key(p) }; })
      .sort(function (a, b) { return b.k - a.k || a.i - b.i; })
      .map(function (x) { return x.p; });
  }

  function pubItem(p, i) {
    var li = el("li", { class: "pub", style: "animation-delay:" + Math.min(i, 8) * 40 + "ms" });
    li.appendChild(el("div", { class: "pub-year" }, p.year || ""));

    var body = el("div", { class: "pub-body" });
    var kicker = [p.type, p.year].filter(Boolean);
    if (kicker.length) {
      var k = el("p", { class: "pub-type" });
      if (p.type) k.appendChild(el("span", null, p.type));
      if (p.year) k.appendChild(el("span", { class: "pub-year-inline" }, (p.type ? " · " : "") + p.year));
      body.appendChild(k);
    }

    var link = href(p.link);
    var pdf = asset(p.pdf);
    var title = el("h3", { class: "pub-title" });
    if (link || pdf) title.appendChild(external(el("a", { href: link || pdf }, p.title)));
    else title.textContent = p.title;
    body.appendChild(title);

    if (p.authors || p.venue) {
      var cite = el("p", { class: "pub-cite" });
      if (p.authors) cite.appendChild(document.createTextNode(p.authors + (p.venue ? ". " : "")));
      if (p.venue) cite.appendChild(el("em", null, p.venue));
      body.appendChild(cite);
    }

    if (p.summary) {
      var det = el("details", { class: "pub-summary" });
      det.appendChild(el("summary", null, "Summary"));
      det.appendChild(el("p", null, p.summary));
      body.appendChild(det);
    }

    if (link || pdf) {
      var actions = el("div", { class: "pub-actions" });
      if (link) actions.appendChild(external(el("a", { href: link }, "Read online ↗")));
      if (pdf) actions.appendChild(el("a", { href: pdf, target: "_blank", rel: "noopener" }, "PDF ↓"));
      body.appendChild(actions);
    }
    li.appendChild(body);

    if (p.image) {
      li.classList.add("has-cover");
      li.appendChild(el("img", { class: "pub-cover", src: asset(p.image), alt: "Cover of " + p.title, loading: "lazy" }));
    }
    return li;
  }

  function renderPubList(list, items) {
    list.innerHTML = "";
    if (!items.length) {
      list.appendChild(el("li", { class: "empty" }, "Nothing here yet."));
      return;
    }
    items.forEach(function (p, i) { list.appendChild(pubItem(p, i)); });
  }

  function renderWriting() {
    var list = $("#pubs");
    if (!list) return;
    var all = sortPubs((writing || []).filter(function (p) { return p && p.title; }));

    if (list.hasAttribute("data-home")) {
      var featured = all.filter(function (p) { return p.featured; });
      var items = (featured.length ? featured : all).slice(0, 3);
      renderPubList(list, items);
      list.closest("section").hidden = !items.length;
      return;
    }

    var box = $("#filters");
    var types = [];
    all.forEach(function (p) {
      var t = (p.type || "").trim();
      if (t && types.indexOf(t) === -1) types.push(t);
    });
    box.innerHTML = "";
    box.hidden = types.length < 2;
    if (!box.hidden) {
      ["All"].concat(types).forEach(function (t) {
        var b = el("button", { type: "button", class: "chip", "aria-pressed": t === "All" ? "true" : "false" }, t);
        b.addEventListener("click", function () {
          box.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          renderPubList(list, all.filter(function (p) { return t === "All" || (p.type || "").trim() === t; }));
        });
        box.appendChild(b);
      });
    }
    renderPubList(list, all);
  }

  // ---------- Page-specific ----------

  function renderHome() {
    setTitle("");
    if (site.position) document.title += " — " + site.position;
    setField("position", site.position);
    setField("name", site.name);
    setField("intro", site.intro);
    var cv = asset(site.cv);
    document.querySelectorAll("[data-cv]").forEach(function (a) {
      a.hidden = !cv;
      if (cv) a.href = cv;
    });
  }

  function renderAbout() {
    setTitle("About");
    setRichText($("#about-body"), about.about);
    var list = $("#interests");
    list.innerHTML = "";
    (about.interests || []).forEach(function (t) {
      if (t && String(t).trim()) list.appendChild(el("li", null, String(t).trim()));
    });
    $("#interests-wrap").hidden = !list.children.length;
  }

  function renderContact() {
    setTitle("Contact");
    setField("contactHeading", site.contactHeading || "Get in touch");
    var email = (site.email || "").trim();
    var a = $("#contact-email");
    a.hidden = !email;
    a.textContent = email;
    a.href = email ? "mailto:" + email : "#";

    var list = $("#socials");
    list.innerHTML = "";
    var cv = asset(site.cv);
    if (cv) {
      var cvLi = el("li");
      cvLi.appendChild(el("a", { href: cv, target: "_blank", rel: "noopener" }, "CV ↓"));
      list.appendChild(cvLi);
    }
    (site.links || []).forEach(function (l) {
      if (!l || !String(l.url || "").trim()) return;
      var li = el("li");
      li.appendChild(el("a", { href: href(l.url), target: "_blank", rel: "noopener" }, (l.label || l.url) + " ↗"));
      list.appendChild(li);
    });
    list.hidden = !list.children.length;
  }

  function renderCustomPage() {
    var slug = new URLSearchParams(location.search).get("p") || "";
    var p = pages.filter(function (x) { return x && x.title && slugify(x.title) === slug; })[0];
    if (!p) {
      setTitle("Page not found");
      $("#page-title").textContent = "Page not found";
      setRichText($("#page-body"), '<p>Sorry, that page doesn\'t exist. <a href="index.html">Go to the home page</a>.</p>');
      return;
    }
    setTitle(p.title);
    $("#page-title").textContent = p.title;
    setRichText($("#page-body"), p.body);
  }

  // ---------- Nav border on scroll ----------

  function onScroll() { $("#nav").classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- Load ----------

  // "no-cache" makes the browser check for a newer version each visit,
  // so edits show up as soon as GitHub has published them.
  function load(name, fallback) {
    return fetch("content/" + name + ".json", { cache: "no-cache" })
      .then(function (res) { if (!res.ok) throw new Error(name + ": HTTP " + res.status); return res.json(); })
      .catch(function (err) { console.error("Could not load content/" + name + ".json:", err); return fallback; });
  }

  Promise.all([load("site", {}), load("about", {}), load("writing", []), load("pages", [])])
    .then(function (r) {
      site = r[0] || {}; about = r[1] || {};
      writing = Array.isArray(r[2]) ? r[2] : []; pages = Array.isArray(r[3]) ? r[3] : [];
      renderNav();
      renderFooter();
      renderPhoto();
      onScroll();
      if (page === "home") renderHome();
      else if (page === "about") renderAbout();
      else if (page === "contact") renderContact();
      else if (page === "custom") renderCustomPage();
      if (page === "writing") setTitle("Writing");
      renderWriting();
    })
    .catch(function (err) { console.error(err); })
    .then(function () { document.documentElement.classList.remove("loading"); });
})();
