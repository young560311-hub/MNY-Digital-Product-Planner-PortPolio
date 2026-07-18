// Smooth scroll for in-page anchor links (fallback for browsers without CSS scroll-behavior)
document.addEventListener("click", function (e) {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const targetId = link.getAttribute("href");
  if (targetId.length < 2) return;
  const target = document.querySelector(targetId);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

(function () {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- 1. Scroll-reveal for cards / sections / rows ---------- */
  const revealSelectors = [
    ".about-card",
    ".core-card",
    ".project-row",
    ".tool-item",
    ".hl-card",
    ".p-block",
    ".retro-block",
    ".contact-item",
    ".po-block",
  ].join(",");
  const revealEls = Array.from(document.querySelectorAll(revealSelectors));

  revealEls.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = reduceMotion ? "0ms" : `${(i % 4) * 90}ms`;
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => revealIO.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- 2. Hero / page-header load-in ---------- */
  const heroEls = Array.from(
    document.querySelectorAll(".hero .container > *, .p-hero .container > *")
  );
  heroEls.forEach((el, i) => {
    el.classList.add("hero-reveal");
    el.style.transitionDelay = reduceMotion ? "0ms" : `${i * 90}ms`;
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroEls.forEach((el) => el.classList.add("hero-in"));
    });
  });

  /* ---------- 3. Count-up animation for stat numbers (e.g. 660%, 14.29%) ---------- */
  function animateCount(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
    if (!match) return;
    const numPart = match[1].replace(/,/g, "");
    const suffix = match[2] || "";
    const target = parseFloat(numPart);
    if (isNaN(target)) return;
    const isDecimal = numPart.includes(".");
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent =
        (isDecimal
          ? val.toFixed(numPart.split(".")[1].length)
          : Math.round(val).toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    }
    requestAnimationFrame(tick);
  }

  const countEls = Array.from(
    document.querySelectorAll(".p-highlights .hl-card .big")
  );
  if (countEls.length && !reduceMotion) {
    if ("IntersectionObserver" in window) {
      const countIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              countIO.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      countEls.forEach((el) => countIO.observe(el));
    }
  }

  /* ---------- 4. Animated contribution bars ---------- */
  const barEls = Array.from(document.querySelectorAll(".bar-fill"));
  if (barEls.length) {
    barEls.forEach((bar) => {
      bar.dataset.target = bar.style.width || "0%";
      bar.style.width = "0%";
    });
    if ("IntersectionObserver" in window) {
      const barIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const bar = entry.target;
              requestAnimationFrame(() => {
                bar.style.width = bar.dataset.target;
              });
              barIO.unobserve(bar);
            }
          });
        },
        { threshold: 0.4 }
      );
      barEls.forEach((bar) => barIO.observe(bar));
    } else {
      barEls.forEach((bar) => (bar.style.width = bar.dataset.target));
    }
  }

  /* ---------- 5. Scroll progress bar ---------- */
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  document.body.appendChild(progress);
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = pct + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ---------- 6. Back-to-top button ---------- */
  const toTop = document.createElement("button");
  toTop.className = "back-to-top";
  toTop.type = "button";
  toTop.setAttribute("aria-label", "맨 위로 이동");
  toTop.textContent = "↑";
  document.body.appendChild(toTop);
  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  window.addEventListener(
    "scroll",
    () => {
      toTop.classList.toggle("visible", window.scrollY > 480);
    },
    { passive: true }
  );

  /* ---------- 7b. Typewriter heading cycle ---------- */
  document.querySelectorAll(".type-cycle").forEach((el) => {
    const words = (el.dataset.words || "").split("|").filter(Boolean);
    if (!words.length) return;
    if (reduceMotion) {
      el.textContent = words[0];
      return;
    }
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;
    const typeSpeed = 75;
    const deleteSpeed = 40;
    const holdTime = 1700;
    const gapTime = 400;

    function tick() {
      const current = words[wordIndex];
      if (!deleting) {
        charIndex++;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, holdTime);
          return;
        }
        setTimeout(tick, typeSpeed);
      } else {
        charIndex--;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(tick, gapTime);
          return;
        }
        setTimeout(tick, deleteSpeed);
      }
    }
    setTimeout(tick, 500);
  });

  /* ---------- 7. Spotlight cursor-glow on cards ---------- */
  const spotlightEls = Array.from(
    document.querySelectorAll(".hl-card, .about-card, .core-card, .tool-item")
  );
  spotlightEls.forEach((card) => {
    card.classList.add("spotlight");
    if (card.closest(".core") || card.closest(".tools")) {
      card.classList.add("on-dark");
    }
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--sx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--sy", `${e.clientY - rect.top}px`);
    });
  });
})();
