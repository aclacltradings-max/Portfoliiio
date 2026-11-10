/* =========================================================
   AROMIRE KEHINDE — Portfolio interactions
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------- Year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Header state ---------- */
  const header = document.getElementById("header");
  const toTop = document.getElementById("toTop");
  const progressBar = document.querySelector(".scroll-progress span");

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("scrolled", y > 20);
    if (toTop) toTop.classList.toggle("show", y > 500);

    if (progressBar) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
    updateActiveLink(y);
  }

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  function closeNav() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));

    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("open")) return;
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) closeNav();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Active nav link ---------- */
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const linkMap = new Map();
  document.querySelectorAll(".nav-link").forEach((a) => {
    const id = (a.getAttribute("href") || "").replace("#", "");
    if (id) linkMap.set(id, a);
  });

  function updateActiveLink(y) {
    if (!sections.length) return;
    const probe = y + window.innerHeight * 0.32;
    let current = sections[0].id;
    for (const s of sections) {
      if (s.offsetTop <= probe) current = s.id;
    }
    linkMap.forEach((a, id) => a.classList.toggle("active", id === current));
  }

  /* ---------- Smooth scroll (with header offset fallback) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 14;
      window.scrollTo({ top: Math.max(top, 0), behavior: prefersReduced ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => {
      const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal")) : [];
      const idx = siblings.indexOf(el);
      el.style.setProperty("--rd", Math.min(idx < 0 ? 0 : idx, 6) * 0.08 + "s");
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  function runCounter(el) {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const suffix = el.getAttribute("data-suffix");
    const end = suffix === null ? "+" : suffix;
    if (prefersReduced) { el.textContent = target + end; return; }
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? end : "");
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Skill bars ---------- */
  const bars = document.querySelectorAll(".bar-fill");
  if ("IntersectionObserver" in window) {
    const bio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const fill = entry.target.getAttribute("data-fill");
          entry.target.style.width = fill;
          bio.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    bars.forEach((b) => bio.observe(b));
  } else {
    bars.forEach((b) => (b.style.width = b.getAttribute("data-fill")));
  }

  /* ---------- 3D tilt + glow follow ---------- */
  if (!isTouch && !prefersReduced) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      let raf = null;

      function handleMove(e) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;

        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");

        const max = card.classList.contains("avatar-card") ? 9 : 7;
        const rx = (0.5 - py) * max * 2;
        const ry = (px - 0.5) * max * 2;

        if (raf) return;
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
          raf = null;
        });
      }

      function reset() {
        card.style.transform = "";
      }

      card.addEventListener("mousemove", handleMove);
      card.addEventListener("mouseleave", reset);
    });
  }

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector(".cursor-glow");
  if (glow && !isTouch && !prefersReduced) {
    let gx = 0, gy = 0, cx = 0, cy = 0;
    let active = false;

    window.addEventListener("mousemove", (e) => {
      gx = e.clientX;
      gy = e.clientY;
      if (!active) {
        active = true;
        document.body.classList.add("has-cursor");
        cx = gx; cy = gy;
        loop();
      }
    });

    document.addEventListener("mouseleave", () => {
      document.body.classList.remove("has-cursor");
      active = false;
    });

    function loop() {
      if (!active) return;
      cx += (gx - cx) * 0.14;
      cy += (gy - cy) * 0.14;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    }
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");

  if (form) {
    const nameInput = form.elements.namedItem("name");
    const emailInput = form.elements.namedItem("email");
    const subjectInput = form.elements.namedItem("subject");
    const messageInput = form.elements.namedItem("message");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const subject = subjectInput.value.trim() || "Project Enquiry";
      const message = messageInput.value.trim();

      form.querySelectorAll(".field").forEach((f) => f.classList.remove("invalid"));

      let ok = true;
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      if (!name) { nameInput.closest(".field").classList.add("invalid"); ok = false; }
      if (!emailOk) { emailInput.closest(".field").classList.add("invalid"); ok = false; }
      if (!message) { messageInput.closest(".field").classList.add("invalid"); ok = false; }

      if (!ok) {
        note.textContent = "Please fill in your name, a valid email and a message.";
        note.classList.add("error");
        return;
      }

      note.classList.remove("error");
      note.textContent = "Opening your email app…";

      const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
      const mailto =
        "mailto:heisbale@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.location.href = mailto;

      setTimeout(() => {
        note.textContent = "Thanks, " + name + "! Your message is ready to send.";
        form.reset();
      }, 700);
    });

    form.querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("input", () => {
        const field = el.closest(".field");
        if (field) field.classList.remove("invalid");
      });
    });
  }

  /* ---------- Init ---------- */
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => updateActiveLink(window.scrollY));
  onScroll();
})();
