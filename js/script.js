// ============================================================
// Footer year
// ============================================================
const yearEl = document.querySelector("#year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ============================================================
// Scroll progress "playhead" bar
// ============================================================
const initScrollPlayhead = () => {
  const bar = document.querySelector("#scrollPlayhead");
  if (!bar) return;

  let ticking = false;

  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(Math.max(pct, 0), 100)}%`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
};

initScrollPlayhead();

// ============================================================
// Mobile nav
// ============================================================
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector("#mobile-menu");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const expanded = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", String(!expanded));
    navLinks.classList.toggle("show");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuBtn.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("show");
    });
  });
}

// ============================================================
// Scroll reveal
// ============================================================
const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
  );
  revealElements.forEach((el, idx) => {
    el.style.transitionDelay = `${Math.min(idx * 60, 240)}ms`;
    revealObserver.observe(el);
  });
} else {
  revealElements.forEach((el) => el.classList.add("is-visible"));
}

// ============================================================
// Hero monitor: clip switching, scrub bar, timecode, sound
// ============================================================
const initMonitor = () => {
  const video = document.querySelector("#monitorVideo");
  const frame = document.querySelector(".monitor-frame");
  const clips = document.querySelectorAll(".clip");
  const track = document.querySelector("#track");
  const scrub = document.querySelector("#scrub");
  const scrubFill = document.querySelector("#scrubFill");
  const scrubHead = document.querySelector("#scrubHead");
  const timecode = document.querySelector("#timecode");
  const soundToggle = document.querySelector("#soundToggle");
  const note = document.querySelector("#monitorNote");
  const clipTitle = document.querySelector("#clipTitle");
  const clipDesc = document.querySelector("#clipDesc");
  const clipAudioBadge = document.querySelector("#clipAudioBadge");

  if (!video || !track) return;

  const FPS = 30;

  const formatTimecode = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds - Math.floor(seconds)) * FPS);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
  };

  const updateScrub = () => {
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    scrubFill.style.width = `${pct}%`;
    scrubHead.style.left = `${pct}%`;
    if (timecode) timecode.textContent = formatTimecode(video.currentTime);
  };

  const applyNativeRatio = () => {
    if (!frame || !video.videoWidth || !video.videoHeight) return;
    const ratio = video.videoWidth / video.videoHeight;
    const wrap = frame.parentElement;
    const availableWidth = wrap ? wrap.clientWidth : frame.clientWidth;
    const maxHeight = Math.min(window.innerHeight * 0.72, 640);

    let width = availableWidth;
    let height = width / ratio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    frame.style.width = `${Math.round(width)}px`;
    frame.style.height = `${Math.round(height)}px`;
  };

  window.addEventListener("resize", () => {
    clearTimeout(window.__monitorResizeT);
    window.__monitorResizeT = setTimeout(applyNativeRatio, 120);
  });

  video.addEventListener("timeupdate", updateScrub);
  video.addEventListener("loadedmetadata", () => {
    updateScrub();
    applyNativeRatio();
  });

  video.addEventListener("error", () => {
    if (note) note.textContent = "Clip failed to load — check assets/videos.";
  });
  video.addEventListener("loadeddata", () => {
    if (note) note.textContent = "";
  });

  // scrub bar seeking
  let scrubbing = false;

  const seekFromEvent = (clientX) => {
    const rect = scrub.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    if (video.duration) {
      video.currentTime = pct * video.duration;
      updateScrub();
    }
  };

  scrub.addEventListener("pointerdown", (e) => {
    scrubbing = true;
    seekFromEvent(e.clientX);
  });
  window.addEventListener("pointermove", (e) => {
    if (scrubbing) seekFromEvent(e.clientX);
  });
  window.addEventListener("pointerup", () => {
    scrubbing = false;
  });

  // clip switching
  const activateClip = (clip) => {
    clips.forEach((c) => {
      c.classList.remove("is-active");
      c.setAttribute("aria-selected", "false");
    });
    clip.classList.add("is-active");
    clip.setAttribute("aria-selected", "true");

    const src = clip.dataset.src;
    const poster = clip.dataset.poster;
    if (video.getAttribute("src") !== src) {
      video.setAttribute("poster", poster);
      video.src = src;
      video.load();
      video.play().catch(() => {});
    }

    if (clipTitle) clipTitle.textContent = clip.dataset.title || "";
    if (clipDesc) clipDesc.textContent = clip.dataset.desc || "";
    if (clipAudioBadge) {
      const audio = clip.dataset.audio || "";
      clipAudioBadge.textContent = audio;
      clipAudioBadge.hidden = !audio;
    }
  };

  clips.forEach((clip) => {
    clip.addEventListener("click", () => activateClip(clip));
  });

  // keyboard support for the tab-like track
  track.addEventListener("keydown", (e) => {
    const list = Array.from(clips);
    const currentIndex = list.findIndex((c) => c.classList.contains("is-active"));
    if (e.key === "ArrowRight") {
      e.preventDefault();
      activateClip(list[(currentIndex + 1) % list.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      activateClip(list[(currentIndex - 1 + list.length) % list.length]);
    }
  });

  // sound toggle
  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      video.muted = !video.muted;
      soundToggle.setAttribute("aria-pressed", String(!video.muted));
    });
  }

  // pause hero video when scrolled out of view to save resources
  if ("IntersectionObserver" in window) {
    const monitorObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );
    monitorObserver.observe(video);
  }
};

initMonitor();

// ============================================================
// Animated stat counters
// ============================================================
const initCounters = () => {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const formatValue = (el, value) => {
    const format = el.dataset.format || "number";
    if (format === "kplus") {
      return `${Math.floor(value)}K+`;
    }
    if (format === "year") {
      return `${Math.floor(value)}`;
    }
    return String(Math.floor(value));
  };

  const animateCounter = (el) => {
    const target = Number(el.dataset.counter || 0);
    if (!target) {
      el.textContent = "0";
      return;
    }
    if (reducedMotion) {
      el.textContent = formatValue(el, target);
      return;
    }

    const duration = 1100;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = eased * target;
      el.textContent = formatValue(el, value);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = formatValue(el, target);
      }
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach((counter) => animateCounter(counter));
  }
};

initCounters();
