/* ══════════════════════════════════════════════════
   ANIMATED DRIP STRIPES BACKGROUND — Light Theme
   - Longer, deeper dripping paint canopy matching reference design
   - Continuous smooth extension & retraction breathing cycle (zero popping)
   - Rich, saturated vibrant paint palette with high opacity
   - DPR-aware 60fps canvas loop with theme-observer
   ══════════════════════════════════════════════════ */
(function initAnimatedDripsBg() {
  "use strict";

  let canvas = null;
  let ctx = null;
  let raf = 0;
  let stripes = [];
  let width = 0;
  let height = 0;
  let visible = true;
  let inView = true;

  // Rich, vibrant, deeply saturated paint palette (matching reference design)
  const RICH_PALETTE = [
    [2, 132, 199],    // Ocean Blue (#0284c7)
    [16, 185, 129],   // Emerald Green (#10b981)
    [225, 29, 72],    // Crimson Rose (#e11d48)
    [234, 88, 12],    // Vivid Orange (#ea580c)
    [124, 58, 237],   // Royal Violet (#7c3aed)
    [13, 148, 136],   // Deep Teal (#0d9488)
    [217, 119, 6],    // Amber Gold (#d97706)
    [79, 70, 229],    // Electric Indigo (#4f46e5)
    [219, 39, 119],   // Deep Pink (#db2777)
    [101, 163, 13],   // Lime Green (#65a30d)
    [6, 182, 212],    // Bright Cyan (#06b6d4)
    [180, 83, 9],     // Dark Amber (#b45309)
    [37, 99, 235],    // Cobalt Blue (#2563eb)
    [147, 51, 234],   // Purple (#9333ea)
    [202, 138, 4],    // Goldenrod (#ca8a04)
    [236, 72, 153],   // Flamingo Pink (#ec4899)
  ];

  const CONFIG = {
    radius: 7.5,           // Stripe radius (column width = 15px)
    spacing: 1.5,          // Spacing between columns
    speedMin: 0.6,         // Drip animation speed
    speedMax: 2.0,
    baseOpacity: 0.72,     // Rich, visible paint opacity
  };

  function isLightTheme() {
    return (
      document.documentElement.classList.contains("light-theme") ||
      document.body.classList.contains("light-theme") ||
      localStorage.getItem("theme") === "light"
    );
  }

  class Stripe {
    constructor(i, totalCols) {
      this.i = i;
      this.radius = CONFIG.radius;
      this.colWidth = this.radius * 2 + CONFIG.spacing;
      this.x = (i + 0.5) * this.colWidth;
      
      // Longer baseline minimum reach for dramatic drip canopy
      this.minReach = 110 + Math.sin(i * 0.35) * 55 + (i % 3) * 30 + Math.random() * 40;
      this.maxReach = Math.min(height * 0.96, height * (0.62 + Math.random() * 0.34));
      this.speed = Math.random() * (CONFIG.speedMax - CONFIG.speedMin) + CONFIG.speedMin;
      this.colorIdx = Math.floor(Math.random() * RICH_PALETTE.length);
      
      // Start with staggered longer lengths across the canopy
      this.currentLength = this.minReach + Math.random() * (this.maxReach - this.minReach);
      this.state = Math.random() > 0.5 ? "growing" : "retracting";
      this.pauseTicks = Math.floor(Math.random() * 80 + 20);
      this.alpha = CONFIG.baseOpacity * (0.85 + Math.random() * 0.25);
    }

    update() {
      if (this.state === "growing") {
        this.currentLength += this.speed;
        if (this.currentLength >= this.maxReach) {
          this.currentLength = this.maxReach;
          if (this.pauseTicks > 0) {
            this.pauseTicks--;
          } else {
            this.state = "retracting";
            this.pauseTicks = Math.floor(Math.random() * 60 + 20);
          }
        }
      } else if (this.state === "retracting") {
        this.currentLength -= this.speed * 0.75;
        if (this.currentLength <= this.minReach) {
          this.currentLength = this.minReach;
          if (this.pauseTicks > 0) {
            this.pauseTicks--;
          } else {
            // Pick a new vibrant color and longer reach for the next drip cycle
            this.colorIdx = Math.floor(Math.random() * RICH_PALETTE.length);
            this.maxReach = Math.min(height * 0.96, height * (0.58 + Math.random() * 0.38));
            this.speed = Math.random() * (CONFIG.speedMax - CONFIG.speedMin) + CONFIG.speedMin;
            this.state = "growing";
            this.pauseTicks = Math.floor(Math.random() * 80 + 20);
          }
        }
      }
    }

    draw() {
      const tipY = Math.max(this.radius, Math.min(this.currentLength, height + this.radius));
      const [r, g, b] = RICH_PALETTE[this.colorIdx];

      ctx.save();
      ctx.globalAlpha = this.alpha;

      // Rich gradient with vertical depth
      const grad = ctx.createLinearGradient(this.x, 0, this.x, tipY);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.98)`);
      grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.90)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.80)`);
      ctx.fillStyle = grad;

      // Draw solid hanging vertical stripe from top to tipY with rounded bottom cap
      ctx.beginPath();
      ctx.moveTo(this.x - this.radius, 0);
      ctx.lineTo(this.x - this.radius, tipY);
      ctx.arc(this.x, tipY, this.radius, Math.PI, 0, true);
      ctx.lineTo(this.x + this.radius, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  function createCanvas() {
    if (document.getElementById("animated-dots-canvas")) {
      canvas = document.getElementById("animated-dots-canvas");
    } else {
      canvas = document.createElement("canvas");
      canvas.id = "animated-dots-canvas";
      document.body.insertBefore(canvas, document.body.firstChild);
    }
    ctx = canvas.getContext("2d");
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    initStripes();
  }

  function initStripes() {
    stripes = [];
    const colWidth = CONFIG.radius * 2 + CONFIG.spacing;
    const cols = Math.ceil(width / colWidth);
    for (let i = 0; i < cols; i++) {
      stripes.push(new Stripe(i, cols));
    }
  }

  function render() {
    raf = 0;
    if (!isLightTheme() || !visible || !inView) return;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < stripes.length; i++) {
      stripes[i].update();
      stripes[i].draw();
    }

    raf = requestAnimationFrame(render);
  }

  function start() {
    if (!canvas) createCanvas();
    resizeCanvas();
    if (raf === 0 && isLightTheme()) {
      raf = requestAnimationFrame(render);
    }
  }

  function stop() {
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (ctx && width && height) {
      ctx.clearRect(0, 0, width, height);
    }
  }

  function onThemeChange() {
    if (isLightTheme()) {
      start();
    } else {
      stop();
    }
  }

  // ── Auto Boot ──────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    createCanvas();

    const bodyObserver = new MutationObserver(onThemeChange);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const htmlObserver = new MutationObserver(onThemeChange);
    htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", function () {
      if (isLightTheme()) {
        resizeCanvas();
      }
    });

    document.addEventListener("visibilitychange", function () {
      visible = document.visibilityState === "visible";
      if (visible && isLightTheme()) {
        start();
      } else {
        stop();
      }
    });

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(function (entries) {
        const entry = entries[0];
        inView = entry ? entry.isIntersecting : true;
        if (inView && isLightTheme()) {
          start();
        } else {
          stop();
        }
      });
      observer.observe(canvas);
    }

    if (isLightTheme()) {
      start();
    }
  }
})();
