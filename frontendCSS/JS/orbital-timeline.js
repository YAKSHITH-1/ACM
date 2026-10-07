/* ══════════════════════════════════════════════════
   RADIAL ORBITAL TIMELINE — Vanilla JS
   A port of the React RadialOrbitalTimeline component.
   Auto-rotating orbital nodes with expand-on-click,
   energy bars, connected-node navigation, and
   ACM JIT theming.
   ══════════════════════════════════════════════════ */

(function initOrbitalTimeline() {
  "use strict";

  /* ── SVG icon templates (Lucide-style) ─────────── */
  const ICONS = {
    calendar: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    fileText: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    code: `<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    user: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    zap: `<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    link: `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    arrowRight: `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    globe: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    star: `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    rocket: `<svg viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
    download: `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  };

  /* ── ACM JIT Community Hub Timeline Data ────────── */
  const timelineData = [
    {
      id: 1,
      title: "Resources",
      date: "Always Available",
      content: "Curated notes, starter repositories, lab references, and practice packs that help students move faster without feeling lost.",
      category: "Resources",
      icon: "fileText",
      relatedIds: [2, 3],
      status: "completed",
    },
    {
      id: 2,
      title: "Student Blogs",
      date: "Updated Weekly",
      content: "Member-written reflections, build stories, explainers, and honest learning notes from people sitting in the same classrooms.",
      category: "Blogs",
      icon: "user",
      relatedIds: [1, 3],
      status: "in-progress",
    },
    {
      id: 3,
      title: "Technical Guides",
      date: "Core Knowledge",
      content: "Compact guides for tools, frameworks, coding practices, interview prep, deployment, and the small details that unlock progress.",
      category: "Guides",
      icon: "code",
      relatedIds: [1, 2],
      status: "completed",
    },
  ];

  /* ── State ──────────────────────────────────────── */
  let rotationAngle = 0;
  let autoRotate = true;
  let activeNodeId = null;
  let animFrame = null;
  const ORBIT_RADIUS_DESKTOP = 175;
  const ORBIT_RADIUS_TABLET = 130;
  const ORBIT_RADIUS_MOBILE = 100;

  function getOrbitRadius() {
    const w = window.innerWidth;
    if (w <= 380) return 65;
    if (w <= 480) return 90;
    if (w <= 768) return 130;
    return ORBIT_RADIUS_DESKTOP;
  }

  /* ── DOM References ─────────────────────────────── */
  const container = document.getElementById("orbital-timeline");
  if (!container) return; // Not on a page with the timeline

  /* ── Student Material Modal Setup ────────────────── */
  let modalBackdrop = document.getElementById("studyMaterialModal");
  if (!modalBackdrop) {
    modalBackdrop = document.createElement("div");
    modalBackdrop.className = "orbital-modal-backdrop";
    modalBackdrop.id = "studyMaterialModal";
    modalBackdrop.innerHTML = `
      <div class="orbital-modal-card">
        <div class="orbital-modal-header">
          <div>
            <span class="orbital-modal-badge">Workshop Resource</span>
            <h3 class="orbital-modal-title">Student Material</h3>
            <p class="orbital-modal-subtitle">Essential technical handbook & guide for workshop participants</p>
          </div>
          <button type="button" class="orbital-modal-close" id="closeStudyModal" aria-label="Close modal">&times;</button>
        </div>
        <div class="orbital-material-preview-card">
          <div class="orbital-material-meta">
            <span class="orbital-material-tag">Guide</span>
            <span class="orbital-material-format">PDF &bull; 364 KB</span>
          </div>
          <h4 class="orbital-material-heading">Git &amp; GitHub &mdash; Student Workshop Guide</h4>
          <p class="orbital-material-desc">Comprehensive reference covering repository setup, branching workflows, pull requests, merge conflict resolution, and best practices.</p>
          <a href="assets/Resources/githandout.pdf" download="Git & GitHub — Student Workshop Guide.pdf" class="orbital-download-btn" id="studyModalDownload">
            ${ICONS.download}
            <span>Download PDF</span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(modalBackdrop);
  }

  function openStudyMaterialModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }

  function closeStudyMaterialModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop || e.target.closest("#closeStudyModal")) {
        closeStudyMaterialModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalBackdrop.classList.contains("open")) {
        closeStudyMaterialModal();
      }
    });
  }

  const orbitArea = container.querySelector(".orbital-orbit-area");
  const nodes = {};

  /* ── Build node DOM ─────────────────────────────── */
  timelineData.forEach((item) => {
    const node = document.createElement("div");
    node.className = `orbital-node orbital-node-${item.id}`;
    node.dataset.id = item.id;

    // Dot
    const dot = document.createElement("div");
    dot.className = "orbital-node-dot";
    dot.innerHTML = ICONS[item.icon] || ICONS.star;
    node.appendChild(dot);

    // Label
    const label = document.createElement("div");
    label.className = "orbital-node-label";
    label.textContent = item.title;
    node.appendChild(label);

    // Detail card
    const card = document.createElement("div");
    card.className = "orbital-detail-card";
    card.innerHTML = buildCardHTML(item);
    node.appendChild(card);

    // Click handler
    node.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleItem(item.id);
    });

    // Handle clicks inside detail card (triggers and connection buttons)
    card.addEventListener("click", (e) => {
      const modalTrigger = e.target.closest(".orbital-modal-trigger");
      if (modalTrigger) {
        e.stopPropagation();
        openStudyMaterialModal();
        return;
      }

      const connectionBtn = e.target.closest(".orbital-connection-btn");
      if (connectionBtn) {
        e.stopPropagation();
        const targetId = parseInt(connectionBtn.dataset.target);
        if (targetId) toggleItem(targetId);
        return;
      }

      e.stopPropagation();
    });

    orbitArea.appendChild(node);
    nodes[item.id] = node;
  });

  /* ── Build card HTML ────────────────────────────── */
  function buildCardHTML(item) {
    const statusLabel =
      item.status === "completed"
        ? "COMPLETE"
        : item.status === "in-progress"
          ? "IN PROGRESS"
          : "PENDING";

    let connectionsHTML = "";
    if (item.relatedIds.length > 0) {
      const btns = item.relatedIds
        .map((relId) => {
          const rel = timelineData.find((d) => d.id === relId);
          if (!rel) return "";
          return `<button class="orbital-connection-btn" data-target="${relId}">${rel.title} ${ICONS.arrowRight}</button>`;
        })
        .join("");

      connectionsHTML = `
        <div class="orbital-connections-section">
          <div class="orbital-connections-title">
            ${ICONS.link} Connected Nodes
          </div>
          <div class="orbital-connections-list">${btns}</div>
        </div>`;
    }

    let resourcesHTML = "";
    if (item.id === 3) {
      resourcesHTML = `
        <div class="orbital-connections-section">
          <div class="orbital-connections-title">
            ${ICONS.fileText} Student Material
          </div>
          <div class="orbital-connections-list">
            <button type="button" class="orbital-connection-btn orbital-modal-trigger" title="Open Git & GitHub Student Workshop Guide">
              Student Workshop Guide ${ICONS.arrowRight}
            </button>
          </div>
        </div>`;
    }

    return `
      <div class="orbital-card-header">
        <span class="orbital-status-badge ${item.status}">${statusLabel}</span>
        <span class="orbital-card-date">${item.date}</span>
      </div>
      <div class="orbital-card-title">${item.title}</div>
      <div class="orbital-card-content">${item.content}</div>
      ${resourcesHTML}
      ${connectionsHTML}
    `;
  }

  /* ── Toggle expanded state ──────────────────────── */
  function toggleItem(id) {
    if (activeNodeId === id) {
      // Collapse
      activeNodeId = null;
      autoRotate = true;
      updateNodeClasses();
    } else {
      // Expand this, collapse others
      activeNodeId = id;
      autoRotate = false;
      centerViewOnNode(id);
      updateNodeClasses();
    }
  }

  function updateNodeClasses() {
    const relatedIds = activeNodeId
      ? (timelineData.find((d) => d.id === activeNodeId) || {}).relatedIds || []
      : [];

    Object.keys(nodes).forEach((nid) => {
      const nodeEl = nodes[nid];
      const numId = parseInt(nid);
      nodeEl.classList.toggle("is-active", numId === activeNodeId);
      nodeEl.classList.toggle(
        "is-related",
        activeNodeId !== null && relatedIds.includes(numId) && numId !== activeNodeId
      );
    });
  }

  /* ── Connected-node button delegation ───────────── */
  container.addEventListener("click", (e) => {
    const modalTrigger = e.target.closest(".orbital-modal-trigger");
    if (modalTrigger) {
      e.stopPropagation();
      openStudyMaterialModal();
      return;
    }

    const btn = e.target.closest(".orbital-connection-btn");
    if (btn) {
      e.stopPropagation();
      const targetId = parseInt(btn.dataset.target);
      if (targetId) toggleItem(targetId);
      return;
    }

    // Click on empty area → collapse
    if (
      e.target === container ||
      e.target.classList.contains("orbital-orbit-area") ||
      e.target.classList.contains("orbital-ring") ||
      e.target.classList.contains("orbital-planet") || e.target.classList.contains("orbital-planet-body") ||
      e.target.classList.contains("orbital-planet-terminator") || e.target.classList.contains("orbital-planet-highlight") || e.target.classList.contains("orbital-planet-glow") || e.target.classList.contains("orbital-planet-ring") || e.target.classList.contains("orbital-planet-orbit") || e.target.classList.contains("orbital-planet-moon")
    ) {
      activeNodeId = null;
      autoRotate = true;
      updateNodeClasses();
    }
  });

  /* ── Center view on a node ──────────────────────── */
  function centerViewOnNode(nodeId) {
    const nodeIndex = timelineData.findIndex((d) => d.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    rotationAngle = 270 - targetAngle; // Place at top
  }

  /* ── Position calculation ───────────────────────── */
  function calculateNodePosition(index, total) {
    const radius = getOrbitRadius();
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));

    return { x, y, angle, zIndex, opacity };
  }

  /* ── Render loop ────────────────────────────────── */
  function render() {
    if (autoRotate) {
      rotationAngle = (rotationAngle + 0.7) % 360;
    }

    const total = timelineData.length;
    timelineData.forEach((item, index) => {
      const pos = calculateNodePosition(index, total);
      const nodeEl = nodes[item.id];
      const isActive = item.id === activeNodeId;

      nodeEl.style.transform = `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`;
      nodeEl.style.zIndex = isActive ? 200 : pos.zIndex;
      nodeEl.style.opacity = isActive ? 1 : pos.opacity;
    });

    animFrame = requestAnimationFrame(render);
  }

  /* ── Start ──────────────────────────────────────── */
  render();

  // Handle initial URL hash if pointing to a node
  const initialHash = window.location.hash.toLowerCase();
  if (initialHash === "#technical-guides" || initialHash === "#guides") {
    toggleItem(3);
  } else if (initialHash === "#resources" || initialHash === "#study-material") {
    toggleItem(1);
  } else if (initialHash === "#student-blogs" || initialHash === "#blogs") {
    toggleItem(2);
  }

  // Pause when tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animFrame);
    } else {
      animFrame = requestAnimationFrame(render);
    }
  });
})();
