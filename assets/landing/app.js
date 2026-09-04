/**
 * Numo Landing Page Animation Architecture
 * Built strictly adhering to GreenSock (GSAP) official AI Skills:
 * - gsap-core: Transforms, autoAlpha, camelCase, robust eases, gsap.matchMedia()
 * - gsap-timeline: Coordinated sequencing, defaults, position parameters
 * - gsap-scrolltrigger: Pinning, scrub, ScrollTrigger.batch(), containerAnimation (ease: none)
 * - gsap-performance: gsap.quickTo() for high-frequency physics, zero layout thrashing
 */

// 1. Register Plugins
gsap.registerPlugin(ScrollTrigger);

// Global State & Elements
const state = {
  theme: 'dark',
  timerRunning: false,
  timerSeconds: 25 * 60,
  timerInterval: null,
  tasks: [
    { id: 1, title: 'Read Operating Systems Ch. 4', course: 'CS 301', priority: 'High', completed: false },
    { id: 2, title: 'Calculus III Problem Set 5', course: 'MATH 240', priority: 'Med', completed: true },
    { id: 3, title: 'Draft Physics Lab Conclusion', course: 'PHYS 102', priority: 'Low', completed: false }
  ]
};

// 2. DOM Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Setup Responsive & Reduced Motion Handlers via gsap.matchMedia()
  setupMatchMediaAnimations();

  // Setup High-Performance Mouse Interactions (quickTo)
  setupMouseSpotlight();

  // Setup Interactive Hero Quick-Add Simulator
  setupQuickAddSimulator();

  // Setup Interactive Mobile Mockup (Pomodoro & Task List)
  setupPhoneInteractive();

  // Setup Theme Switcher
  setupThemeSwitcher();

  // Setup FAQ Accordion
  setupFaqAccordion();

  // Refresh ScrollTrigger after initial render
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
});

/**
 * 3. Master Animation Controller with gsap.matchMedia()
 */
function setupMatchMediaAnimations() {
  const mm = gsap.matchMedia();

  mm.add({
    isDesktop: "(min-width: 1024px)",
    isMobile: "(max-width: 1023px)",
    reduceMotion: "(prefers-reduced-motion: reduce)"
  }, (context) => {
    const { isDesktop, reduceMotion } = context.conditions;

    const baseDuration = reduceMotion ? 0 : 0.8;
    const baseEase = "power3.out";

    // --- Hero Intro Timeline ---
    const heroTl = gsap.timeline({
      defaults: { duration: baseDuration, ease: baseEase }
    });

    heroTl
      .from(".nav-bar", { y: -40, autoAlpha: 0, duration: reduceMotion ? 0 : 1 })
      .from(".hero-badge", { y: 20, autoAlpha: 0, scale: 0.9 }, "-=0.6")
      .from(".hero-title-line", { y: 40, autoAlpha: 0, stagger: 0.15 }, "-=0.5")
      .from(".hero-subtitle", { y: 25, autoAlpha: 0 }, "-=0.4")
      .from(".hero-cta-group > *", { y: 20, autoAlpha: 0, stagger: 0.1 }, "-=0.4")
      .from(".quick-add-simulator", { y: 30, autoAlpha: 0, scale: 0.96 }, "-=0.3")
      .from(".phone-device", { y: 60, autoAlpha: 0, scale: 0.94, duration: reduceMotion ? 0 : 1.1 }, "-=0.5")
      .from(".floating-telemetry-card", {
        scale: 0.8,
        autoAlpha: 0,
        y: 20,
        stagger: 0.15,
        ease: "back.out(1.7)"
      }, "-=0.4");

    // --- Floating Telemetry Cards Idle Levitation (Desktop only) ---
    if (isDesktop && !reduceMotion) {
      gsap.to(".card-pos-1", {
        y: "-=12",
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".card-pos-2", {
        y: "+=14",
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.5
      });

      gsap.to(".card-pos-3", {
        y: "-=10",
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1
      });
    }

    // --- Pinned Features Section ScrollTrigger ---
    if (isDesktop && !reduceMotion) {
      const pinnedSteps = gsap.utils.toArray(".feature-step-card");
      const visualPanels = gsap.utils.toArray(".visual-panel");

      const pinTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".pinned-features-section",
          start: "top top",
          end: "+=2400",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          onUpdate: (self) => {
            const stepIndex = Math.min(
              pinnedSteps.length - 1,
              Math.floor(self.progress * pinnedSteps.length)
            );
            
            pinnedSteps.forEach((step, idx) => {
              if (idx === stepIndex) {
                step.classList.add("active");
              } else {
                step.classList.remove("active");
              }
            });

            visualPanels.forEach((panel, idx) => {
              if (idx === stepIndex) {
                panel.classList.add("active");
              } else {
                panel.classList.remove("active");
              }
            });
          }
        }
      });
    }

    // --- Horizontal Feature Stream with containerAnimation (ease: 'none' strictly required) ---
    if (isDesktop && !reduceMotion) {
      const track = document.querySelector(".horizontal-track");
      if (track) {
        const getScrollDistance = () => track.scrollWidth - window.innerWidth + 120;

        const horizontalTween = gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: "none", // REQUIRED by GSAP official ScrollTrigger guidelines
          scrollTrigger: {
            trigger: ".horizontal-flow-section",
            start: "top top",
            end: () => `+=${getScrollDistance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true
          }
        });

        // Trigger item reveals tied to the horizontal containerAnimation
        gsap.utils.toArray(".horizontal-card").forEach((card) => {
          gsap.from(card, {
            y: 30,
            autoAlpha: 0.6,
            duration: 0.6,
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontalTween,
              start: "left 85%",
              toggleActions: "play none none reverse"
            }
          });
        });
      }
    }

    // --- ScrollTrigger.batch() for Grid Items & Stats ---
    ScrollTrigger.batch(".batch-reveal", {
      start: "top 85%",
      interval: 0.1,
      batchMax: 3,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 35,
          autoAlpha: 0,
          stagger: 0.12,
          duration: reduceMotion ? 0 : 0.7,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    });

    // --- Animated Number Counters ---
    ScrollTrigger.batch(".stat-counter", {
      start: "top 90%",
      once: true,
      onEnter: (batch) => {
        batch.forEach((el) => {
          const target = parseFloat(el.getAttribute("data-target") || "0");
          const isDecimal = el.getAttribute("data-decimal") === "true";
          const suffix = el.getAttribute("data-suffix") || "";

          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: reduceMotion ? 0 : 1.8,
            ease: "power3.out",
            onUpdate: () => {
              el.innerText = isDecimal ? obj.val.toFixed(1) + suffix : Math.floor(obj.val) + suffix;
            }
          });
        });
      }
    });

  });
}

/**
 * 4. High-Performance Mouse Follower & 3D Tilt via gsap.quickTo()
 */
function setupMouseSpotlight() {
  const spotlight = document.querySelector(".cursor-spotlight");
  if (!spotlight) return;

  // Use gsap.quickTo for silky smooth 60fps tracking without garbage collection overhead
  const xTo = gsap.quickTo(spotlight, "x", { duration: 0.4, ease: "power3" });
  const yTo = gsap.quickTo(spotlight, "y", { duration: 0.4, ease: "power3" });
  const alphaTo = gsap.quickTo(spotlight, "autoAlpha", { duration: 0.3 });

  window.addEventListener("mousemove", (e) => {
    alphaTo(1);
    xTo(e.clientX);
    yTo(e.clientY);
  });

  document.addEventListener("mouseleave", () => {
    alphaTo(0);
  });

  // Phone Mockup 3D Tilt Micro-Interaction
  const phone = document.querySelector(".phone-device");
  const mockupWrapper = document.querySelector(".phone-mockup-wrapper");

  if (phone && mockupWrapper) {
    const rotXTo = gsap.quickTo(phone, "rotationX", { duration: 0.6, ease: "power2.out" });
    const rotYTo = gsap.quickTo(phone, "rotationY", { duration: 0.6, ease: "power2.out" });

    mockupWrapper.addEventListener("mousemove", (e) => {
      const rect = mockupWrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      rotYTo(deltaX * 10);
      rotXTo(-deltaY * 8);
    });

    mockupWrapper.addEventListener("mouseleave", () => {
      rotXTo(0);
      rotYTo(0);
    });
  }
}

/**
 * 5. Interactive Natural Language Quick-Add Simulator
 */
function setupQuickAddSimulator() {
  const inputEl = document.querySelector(".sim-input-text");
  const tagsContainer = document.querySelector(".sim-parsed-tags");
  if (!inputEl || !tagsContainer) return;

  const phrase = "HW 3 tomorrow 5pm p1 #math";
  let charIndex = 0;
  let isDeleting = false;

  function typeStep() {
    if (!isDeleting) {
      charIndex++;
      inputEl.textContent = phrase.slice(0, charIndex);

      if (charIndex === phrase.length) {
        // Trigger Chip Reveal
        revealSimTags();
        setTimeout(() => {
          isDeleting = true;
          setTimeout(typeStep, 3500);
        }, 1500);
        return;
      }
      setTimeout(typeStep, 65 + Math.random() * 40);
    } else {
      charIndex--;
      inputEl.textContent = phrase.slice(0, charIndex);

      if (charIndex === 0) {
        isDeleting = false;
        tagsContainer.innerHTML = '';
        setTimeout(typeStep, 1000);
        return;
      }
      setTimeout(typeStep, 30);
    }
  }

  function revealSimTags() {
    tagsContainer.innerHTML = `
      <span class="parsed-chip chip-date"><i data-lucide="calendar" style="width:12px;height:12px;"></i> Tomorrow 5:00 PM</span>
      <span class="parsed-chip chip-priority"><i data-lucide="alert-circle" style="width:12px;height:12px;"></i> P1 (High)</span>
      <span class="parsed-chip chip-course"><i data-lucide="book-open" style="width:12px;height:12px;"></i> #math</span>
      <span class="parsed-chip chip-sqlite"><i data-lucide="database" style="width:12px;height:12px;"></i> Written to SQLite (0.2ms)</span>
    `;
    if (window.lucide) window.lucide.createIcons();

    gsap.from(".parsed-chip", {
      y: 10,
      scale: 0.85,
      autoAlpha: 0,
      stagger: 0.1,
      duration: 0.4,
      ease: "back.out(1.8)"
    });
  }

  // Start typing loop
  setTimeout(typeStep, 1200);
}

/**
 * 6. Interactive Phone Mockup Focus Timer & Task List
 */
function setupPhoneInteractive() {
  const timerReadout = document.querySelector(".timer-time-text");
  const progressRing = document.querySelector(".timer-circle-progress");
  const startBtn = document.querySelector("#timer-start-btn");
  const resetBtn = document.querySelector("#timer-reset-btn");
  const modeButtons = document.querySelectorAll(".timer-mode-btn");

  const circumference = 2 * Math.PI * 65; // radius = 65 -> ~408.4px
  if (progressRing) {
    progressRing.style.strokeDasharray = circumference;
  }

  let totalDuration = 25 * 60;
  let remainingTime = totalDuration;

  function updateTimerDisplay() {
    const mins = Math.floor(remainingTime / 60);
    const secs = remainingTime % 60;
    if (timerReadout) {
      timerReadout.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    if (progressRing) {
      const offset = circumference - (remainingTime / totalDuration) * circumference;
      gsap.to(progressRing, {
        strokeDashoffset: offset,
        duration: 0.5,
        ease: "power1.out"
      });
    }
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      state.timerRunning = !state.timerRunning;
      if (state.timerRunning) {
        startBtn.innerHTML = `<i data-lucide="pause" style="width:14px;height:14px;"></i> Pause`;
        startBtn.classList.add("active");
        
        state.timerInterval = setInterval(() => {
          if (remainingTime > 0) {
            remainingTime--;
            updateTimerDisplay();
          } else {
            clearInterval(state.timerInterval);
            state.timerRunning = false;
            startBtn.innerHTML = `<i data-lucide="play" style="width:14px;height:14px;"></i> Start`;
            startBtn.classList.remove("active");
            triggerCompletionAnimation();
          }
        }, 1000);
      } else {
        clearInterval(state.timerInterval);
        startBtn.innerHTML = `<i data-lucide="play" style="width:14px;height:14px;"></i> Start`;
        startBtn.classList.remove("active");
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      remainingTime = totalDuration;
      if (startBtn) {
        startBtn.innerHTML = `<i data-lucide="play" style="width:14px;height:14px;"></i> Start`;
        startBtn.classList.remove("active");
      }
      updateTimerDisplay();
      if (window.lucide) window.lucide.createIcons();
    });
  }

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const durationMins = parseInt(btn.getAttribute("data-mins") || "25");
      totalDuration = durationMins * 60;
      remainingTime = totalDuration;
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      if (startBtn) {
        startBtn.innerHTML = `<i data-lucide="play" style="width:14px;height:14px;"></i> Start`;
        startBtn.classList.remove("active");
      }
      updateTimerDisplay();
      if (window.lucide) window.lucide.createIcons();
    });
  });

  function triggerCompletionAnimation() {
    gsap.timeline()
      .to(".focus-timer-card", { scale: 1.04, duration: 0.15, yoyo: true, repeat: 3 })
      .to(".timer-time-text", { color: "#10b981", duration: 0.3 })
      .to(".timer-time-text", { color: "var(--text-primary)", duration: 0.5, delay: 1 });
  }

  // Interactive Task Item Toggles
  const taskItems = document.querySelectorAll(".phone-task-item");
  taskItems.forEach(item => {
    item.addEventListener("click", () => {
      const isCompleted = item.classList.toggle("completed");
      const checkIcon = item.querySelector(".task-checkbox i");
      
      if (isCompleted) {
        gsap.fromTo(item.querySelector(".task-checkbox"), 
          { scale: 0.6 }, 
          { scale: 1.1, duration: 0.25, yoyo: true, repeat: 1, ease: "back.out(2)" }
        );
      }
    });
  });
}

/**
 * 7. Dark / Light Theme Switcher with GSAP Color Transitions
 */
function setupThemeSwitcher() {
  const themeToggleBtn = document.querySelector("#theme-toggle-btn");
  if (!themeToggleBtn) return;

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    
    // Seamless GSAP transition on html canvas
    document.documentElement.setAttribute("data-theme", nextTheme);
    state.theme = nextTheme;

    // Rotate Theme Icon with GSAP
    gsap.fromTo(themeToggleBtn, 
      { rotation: 0, scale: 0.8 }, 
      { rotation: 180, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
    );

    // Update Icon
    themeToggleBtn.innerHTML = nextTheme === "dark" 
      ? `<i data-lucide="sun" style="width:18px;height:18px;"></i>` 
      : `<i data-lucide="moon" style="width:18px;height:18px;"></i>`;
      
    if (window.lucide) window.lucide.createIcons();
  });
}

/**
 * 8. FAQ Accordion Animation
 */
function setupFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach(item => {
    const questionBtn = item.querySelector(".faq-question");
    const answerEl = item.querySelector(".faq-answer");

    if (questionBtn && answerEl) {
      questionBtn.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");

        // Close other items
        faqItems.forEach(other => {
          if (other !== item && other.classList.contains("open")) {
            other.classList.remove("open");
            gsap.to(other.querySelector(".faq-answer"), {
              height: 0,
              autoAlpha: 0,
              paddingTop: 0,
              paddingBottom: 0,
              duration: 0.35,
              ease: "power2.inOut"
            });
          }
        });

        if (isOpen) {
          item.classList.remove("open");
          gsap.to(answerEl, {
            height: 0,
            autoAlpha: 0,
            paddingTop: 0,
            paddingBottom: 0,
            duration: 0.35,
            ease: "power2.inOut"
          });
        } else {
          item.classList.add("open");
          gsap.set(answerEl, { height: "auto" });
          const targetHeight = answerEl.offsetHeight + 16;
          gsap.fromTo(answerEl, 
            { height: 0, autoAlpha: 0, paddingTop: 0, paddingBottom: 0 },
            { 
              height: targetHeight, 
              autoAlpha: 1, 
              paddingTop: "4px", 
              paddingBottom: "20px", 
              duration: 0.4, 
              ease: "power2.out" 
            }
          );
        }
      });
    }
  });
}
