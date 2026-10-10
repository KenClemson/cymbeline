// Builds the page from content/site.json.
// To change what's on the site, edit content/site.json (or use the Pages CMS editor) — not this file.
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var site = {};
  var allWork = [];
  var shown = [];
  var current = 0;
  var lastFocus = null;

  // Image paths: allow "images/x.jpg", "/images/x.jpg" or full https:// URLs.
  function asset(path) {
    if (!path) return "";
    if (/^(https?:)?\/\//i.test(path) || /^data:/i.test(path)) return path;
    return String(path).replace(/^\/+/, "");
  }

  // Links: forgive "instagram.com/me" (no https://) and bare email addresses.
  function href(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(url)) return url;
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

  function metaLine(item) {
    return [item.category, item.year].filter(Boolean).join(" · ");
  }

  // ---------- Render ----------

  function render() {
    var name = site.name || "";
    setField("name", name);
    setField("tagline", site.tagline);
    setField("intro", site.intro);
    setField("contactHeading", site.contactHeading || "Get in touch");
    document.title = name + (site.tagline ? " — " + site.tagline : "");
    $("#year").textContent = new Date().getFullYear();

    allWork = (site.work || []).filter(function (w) { return w && (w.image || w.title); });
    renderFilters();
    renderGrid("All");
    renderAbout();
    renderContact();
  }

  function renderFilters() {
    var box = $("#filters");
    box.innerHTML = "";
    var cats = [];
    allWork.forEach(function (w) {
      var c = (w.category || "").trim();
      if (c && cats.indexOf(c) === -1) cats.push(c);
    });
    if (cats.length < 2) { box.hidden = true; return; }
    box.hidden = false;
    ["All"].concat(cats).forEach(function (c) {
      var b = el("button", { type: "button", class: "chip", "aria-pressed": c === "All" ? "true" : "false" }, c);
      b.addEventListener("click", function () {
        box.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        renderGrid(c);
      });
      box.appendChild(b);
    });
  }

  function renderGrid(category) {
    var grid = $("#grid");
    grid.innerHTML = "";
    shown = allWork.filter(function (w) {
      return category === "All" || (w.category || "").trim() === category;
    });
    if (!shown.length) {
      grid.appendChild(el("li", { class: "empty" }, "No pieces yet — add some in the editor."));
      return;
    }
    shown.forEach(function (item, i) {
      var li = el("li", { class: "card", style: "animation-delay:" + Math.min(i, 8) * 40 + "ms" });
      var btn = el("button", { type: "button", class: "card-btn", "aria-label": "Open " + (item.title || "picture") });
      var media = el("div", { class: "card-media" });
      if (item.image) {
        var img = el("img", { src: asset(item.image), alt: item.title || "", loading: "lazy", decoding: "async" });
        media.appendChild(img);
      }
      btn.appendChild(media);
      if (item.title) btn.appendChild(el("span", { class: "card-title" }, item.title));
      var meta = metaLine(item);
      if (meta) btn.appendChild(el("span", { class: "card-meta" }, meta));
      btn.addEventListener("click", function () { openLightbox(i); });
      li.appendChild(btn);
      grid.appendChild(li);
    });
  }

  function renderAbout() {
    var photo = $("#about-photo");
    if (site.aboutPhoto) {
      photo.src = asset(site.aboutPhoto);
      photo.alt = "Photo of " + (site.name || "the artist");
      photo.parentElement.hidden = false;
    } else {
      photo.parentElement.hidden = true;
    }
    $("#about").classList.toggle("no-photo", !site.aboutPhoto);

    // The About text comes from the editor's rich-text box (HTML).
    var body = $("#about-body");
    body.innerHTML = site.about || "";
    body.querySelectorAll("img").forEach(function (img) { img.src = asset(img.getAttribute("src")); });
    body.querySelectorAll("a[href]").forEach(function (a) {
      a.setAttribute("href", href(a.getAttribute("href")));
      if (/^https?:/i.test(a.href) && a.host !== location.host) { a.target = "_blank"; a.rel = "noopener"; }
    });

    var facts = $("#facts");
    facts.innerHTML = "";
    (site.facts || []).forEach(function (f) {
      if (!f || !(f.label || f.value)) return;
      var row = el("div", { class: "fact" });
      row.appendChild(el("dt", null, f.label || ""));
      row.appendChild(el("dd", null, f.value || ""));
      facts.appendChild(row);
    });
    facts.hidden = !facts.children.length;
  }

  function renderContact() {
    var email = (site.email || "").trim();
    var a = $("#contact-email");
    a.hidden = !email;
    a.textContent = email;
    a.href = email ? "mailto:" + email : "#";

    var list = $("#socials");
    list.innerHTML = "";
    (site.links || []).forEach(function (l) {
      if (!l || !String(l.url || "").trim()) return;
      var li = el("li");
      var link = el("a", { href: href(l.url), target: "_blank", rel: "noopener" }, (l.label || l.url) + " ↗");
      li.appendChild(link);
      list.appendChild(li);
    });
    list.hidden = !list.children.length;
  }

  // ---------- Lightbox ----------

  var lb = $("#lightbox");

  function showItem(i) {
    current = (i + shown.length) % shown.length;
    var item = shown[current];
    var img = $("#lb-img");
    img.src = asset(item.image);
    img.alt = item.title || "";
    $("#lb-title").textContent = item.title || "";
    $("#lb-sub").textContent = metaLine(item);
    $("#lb-desc").textContent = item.description || "";
    $("#lb-desc").hidden = !item.description;
    var link = $("#lb-link");
    if (item.link && String(item.link).trim()) {
      link.href = href(item.link);
      link.textContent = (item.linkText || "Learn more") + " →";
      link.hidden = false;
    } else {
      link.hidden = true;
    }
    $("#lb-count").textContent = shown.length > 1 ? (current + 1) + " / " + shown.length : "";
    var multi = shown.length > 1;
    $("#lb-prev").hidden = !multi;
    $("#lb-next").hidden = !multi;
    // Warm up the neighbours so arrowing through feels instant.
    [current + 1, current - 1].forEach(function (n) {
      var w = shown[(n + shown.length) % shown.length];
      if (w && w.image) new Image().src = asset(w.image);
    });
  }

  function openLightbox(i) {
    lastFocus = document.activeElement;
    showItem(i);
    lb.hidden = false;
    document.documentElement.classList.add("lb-open");
    $("#lb-close").focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    document.documentElement.classList.remove("lb-open");
    if (lastFocus) lastFocus.focus();
  }

  $("#lb-close").addEventListener("click", closeLightbox);
  $("#lb-prev").addEventListener("click", function () { showItem(current - 1); });
  $("#lb-next").addEventListener("click", function () { showItem(current + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") showItem(current - 1);
    else if (e.key === "ArrowRight") showItem(current + 1);
    else if (e.key === "Tab") {
      var focusables = Array.prototype.filter.call(
        lb.querySelectorAll("button, a[href]"),
        function (n) { return !n.hidden; }
      );
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipe left/right on phones.
  var touchX = null, touchY = null;
  lb.addEventListener("touchstart", function (e) {
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX == null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showItem(current + (dx < 0 ? 1 : -1));
    touchX = touchY = null;
  }, { passive: true });

  // ---------- Nav ----------

  var nav = $("#nav");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Load ----------

  // "no-cache" makes the browser check for a newer version each visit,
  // so edits show up as soon as GitHub has published them.
  fetch("content/site.json", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) { site = data || {}; render(); })
    .catch(function (err) {
      console.error("Could not load content/site.json:", err);
      setField("intro", "Sorry — this page couldn't load its content. Please try refreshing.");
    })
    .then(function () { document.documentElement.classList.remove("loading"); });
})();
