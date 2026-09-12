/**
 * Native VitePress Mermaid Diagram Fullscreen Lightbox
 * Provides zero-dependency fullscreen view, pan-and-drag, wheel-zoom, and touch gestures.
 */

interface ModalState {
  scale: number;
  initialFitScale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  startX: number;
  startY: number;
  initialPinchDistance: number | null;
  initialPinchScale: number;
}

let activeModal: HTMLElement | null = null;
let currentCleanup: (() => void) | null = null;

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function getPinchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export function openMermaidModal(sourceSvg: SVGElement) {
  if (typeof document === "undefined") return;
  if (activeModal) closeMermaidModal();

  // Determine intrinsic dimensions from viewBox or bounding box
  let origW = 800;
  let origH = 500;

  const viewBox = sourceSvg.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/);
    if (parts.length >= 4) {
      const parsedW = parseFloat(parts[2]);
      const parsedH = parseFloat(parts[3]);
      if (parsedW > 0 && parsedH > 0) {
        origW = parsedW;
        origH = parsedH;
      }
    }
  } else {
    const bbox = sourceSvg.getBoundingClientRect();
    if (bbox.width > 0 && bbox.height > 0) {
      origW = bbox.width;
      origH = bbox.height;
    }
  }

  const state: ModalState = {
    scale: 1,
    initialFitScale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPinchDistance: null,
    initialPinchScale: 1,
  };

  // Lock body scroll
  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  // Create backdrop & dialog
  const backdrop = document.createElement("div");
  backdrop.className = "mermaid-modal-backdrop";

  const card = document.createElement("div");
  card.className = "mermaid-modal-card";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "Diagram Fullscreen View");

  // Header toolbar
  const header = document.createElement("div");
  header.className = "mermaid-modal-header";

  const title = document.createElement("div");
  title.className = "mermaid-modal-title";
  title.textContent = "Diagram View";

  const toolbar = document.createElement("div");
  toolbar.className = "mermaid-modal-toolbar";

  // Zoom controls
  const zoomOutBtn = document.createElement("button");
  zoomOutBtn.className = "mermaid-modal-btn";
  zoomOutBtn.title = "Zoom Out";
  zoomOutBtn.setAttribute("aria-label", "Zoom Out");
  zoomOutBtn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  `;

  const zoomLevel = document.createElement("span");
  zoomLevel.className = "mermaid-modal-zoom-text";
  zoomLevel.textContent = "100%";

  const zoomInBtn = document.createElement("button");
  zoomInBtn.className = "mermaid-modal-btn";
  zoomInBtn.title = "Zoom In";
  zoomInBtn.setAttribute("aria-label", "Zoom In");
  zoomInBtn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  `;

  const resetBtn = document.createElement("button");
  resetBtn.className = "mermaid-modal-btn";
  resetBtn.title = "Reset View";
  resetBtn.setAttribute("aria-label", "Reset View");
  resetBtn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  `;

  const closeBtn = document.createElement("button");
  closeBtn.className = "mermaid-modal-btn mermaid-modal-btn-close";
  closeBtn.title = "Close (Esc)";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;

  toolbar.appendChild(zoomOutBtn);
  toolbar.appendChild(zoomLevel);
  toolbar.appendChild(zoomInBtn);
  toolbar.appendChild(resetBtn);
  toolbar.appendChild(closeBtn);

  header.appendChild(title);
  header.appendChild(toolbar);

  // Stage & Viewport
  const stage = document.createElement("div");
  stage.className = "mermaid-modal-stage";

  const viewport = document.createElement("div");
  viewport.className = "mermaid-modal-viewport";
  viewport.style.width = `${origW}px`;
  viewport.style.height = `${origH}px`;

  // Clone SVG, preserving IDs, markers, styles, and defs
  const clonedSvg = sourceSvg.cloneNode(true) as SVGElement;
  clonedSvg.classList.add("mermaid-modal-svg");
  clonedSvg.style.width = "100%";
  clonedSvg.style.height = "100%";
  clonedSvg.style.display = "block";
  clonedSvg.style.removeProperty("max-width");
  clonedSvg.style.removeProperty("min-width");

  if (!clonedSvg.getAttribute("viewBox")) {
    clonedSvg.setAttribute("viewBox", `0 0 ${origW} ${origH}`);
  }

  viewport.appendChild(clonedSvg);
  stage.appendChild(viewport);

  // Footer hint
  const footer = document.createElement("div");
  footer.className = "mermaid-modal-footer";
  footer.innerHTML = `<span>Drag to pan &bull; Mouse wheel to zoom &bull; Double-click to reset &bull; Press <kbd>Esc</kbd> to close</span>`;

  card.appendChild(header);
  card.appendChild(stage);
  card.appendChild(footer);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  activeModal = backdrop;

  // Calculate best fit scale based on rendered stage dimensions
  const stageRect = stage.getBoundingClientRect();
  const availableW = Math.max(stageRect.width * 0.88, 300);
  const availableH = Math.max(stageRect.height * 0.82, 200);
  const fitScale = Math.min(availableW / origW, availableH / origH);
  const initialScale = clamp(fitScale, 0.4, 2.5);

  state.scale = initialScale;
  state.initialFitScale = initialScale;

  // Transform update helper
  const updateTransform = () => {
    viewport.style.transform = `translate3d(${state.translateX}px, ${state.translateY}px, 0) scale(${state.scale})`;
    zoomLevel.textContent = `${Math.round(state.scale * 100)}%`;
  };

  updateTransform();

  const applyZoom = (delta: number, originX?: number, originY?: number) => {
    const prevScale = state.scale;
    const newScale = clamp(prevScale * delta, 0.25, 6.0);
    if (newScale === prevScale) return;

    if (originX !== undefined && originY !== undefined) {
      const rect = stage.getBoundingClientRect();
      const cx = originX - (rect.left + rect.width / 2);
      const cy = originY - (rect.top + rect.height / 2);
      state.translateX -= (cx - state.translateX) * (newScale / prevScale - 1);
      state.translateY -= (cy - state.translateY) * (newScale / prevScale - 1);
    }
    state.scale = newScale;
    updateTransform();
  };

  const resetView = () => {
    state.scale = state.initialFitScale;
    state.translateX = 0;
    state.translateY = 0;
    updateTransform();
  };

  // Button Listeners
  zoomInBtn.addEventListener("click", () => applyZoom(1.25));
  zoomOutBtn.addEventListener("click", () => applyZoom(0.8));
  resetBtn.addEventListener("click", resetView);
  closeBtn.addEventListener("click", closeMermaidModal);

  // Backdrop click closes (only when clicking directly on backdrop)
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeMermaidModal();
  });

  // Mouse drag listeners
  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    state.isDragging = true;
    state.startX = e.clientX - state.translateX;
    state.startY = e.clientY - state.translateY;
    stage.classList.add("is-dragging");
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!state.isDragging) return;
    state.translateX = e.clientX - state.startX;
    state.translateY = e.clientY - state.startY;
    updateTransform();
  };

  const onMouseUp = () => {
    state.isDragging = false;
    stage.classList.remove("is-dragging");
  };

  stage.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  // Wheel zoom
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    applyZoom(factor, e.clientX, e.clientY);
  };
  stage.addEventListener("wheel", onWheel, { passive: false });

  // Double click to reset / toggle zoom
  stage.addEventListener("dblclick", (e) => {
    e.preventDefault();
    if (Math.abs(state.scale - state.initialFitScale) > 0.05) {
      resetView();
    } else {
      applyZoom(1.8, e.clientX, e.clientY);
    }
  });

  // Touch support: Pan & Pinch-to-zoom
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      state.isDragging = true;
      state.startX = e.touches[0].clientX - state.translateX;
      state.startY = e.touches[0].clientY - state.translateY;
    } else if (e.touches.length === 2) {
      state.isDragging = false;
      state.initialPinchDistance = getPinchDistance(e.touches);
      state.initialPinchScale = state.scale;
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1 && state.isDragging) {
      e.preventDefault();
      state.translateX = e.touches[0].clientX - state.startX;
      state.translateY = e.touches[0].clientY - state.startY;
      updateTransform();
    } else if (e.touches.length === 2 && state.initialPinchDistance) {
      e.preventDefault();
      const currentDist = getPinchDistance(e.touches);
      const ratio = currentDist / state.initialPinchDistance;
      state.scale = clamp(state.initialPinchScale * ratio, 0.25, 6.0);
      updateTransform();
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) {
      state.isDragging = false;
      state.initialPinchDistance = null;
    } else if (e.touches.length === 1) {
      state.initialPinchDistance = null;
      state.isDragging = true;
      state.startX = e.touches[0].clientX - state.translateX;
      state.startY = e.touches[0].clientY - state.translateY;
    }
  };

  stage.addEventListener("touchstart", onTouchStart, { passive: false });
  stage.addEventListener("touchmove", onTouchMove, { passive: false });
  stage.addEventListener("touchend", onTouchEnd);

  // Keyboard Escape listener
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMermaidModal();
    }
  };
  window.addEventListener("keydown", onKeyDown);

  // Cleanup handler
  currentCleanup = () => {
    document.body.style.overflow = prevBodyOverflow;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("keydown", onKeyDown);
    backdrop.remove();
    activeModal = null;
    currentCleanup = null;
  };
}

export function closeMermaidModal() {
  if (currentCleanup) {
    currentCleanup();
  }
}

/**
 * Attaches hover expand button to all rendered Mermaid containers.
 */
export function setupMermaidFullscreen() {
  if (typeof window === "undefined") return;

  const scanAndAttach = () => {
    const containers = document.querySelectorAll<HTMLElement>("div.mermaid");
    containers.forEach((container) => {
      if (container.querySelector(".mermaid-expand-trigger")) return;

      const svg = container.querySelector<SVGElement>("svg");
      if (!svg) {
        const observer = new MutationObserver((mutations, obs) => {
          const renderedSvg = container.querySelector<SVGElement>("svg");
          if (renderedSvg && !container.querySelector(".mermaid-expand-trigger")) {
            obs.disconnect();
            createTriggerButton(container, renderedSvg);
          }
        });
        observer.observe(container, { childList: true });
        return;
      }

      createTriggerButton(container, svg);
    });
  };

  const createTriggerButton = (container: HTMLElement, svg: SVGElement) => {
    if (container.querySelector(".mermaid-expand-trigger")) return;

    container.style.position = "relative";

    const btn = document.createElement("button");
    btn.className = "mermaid-expand-trigger";
    btn.type = "button";
    btn.title = "View diagram fullscreen";
    btn.setAttribute("aria-label", "View diagram fullscreen");
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
      <span>Fullscreen</span>
    `;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentSvg = container.querySelector<SVGElement>("svg") || svg;
      openMermaidModal(currentSvg);
    });

    container.appendChild(btn);
  };

  // Run on initial scan
  scanAndAttach();

  // Watch body for new diagrams added during client-side navigation
  const bodyObserver = new MutationObserver(() => {
    scanAndAttach();
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
}
