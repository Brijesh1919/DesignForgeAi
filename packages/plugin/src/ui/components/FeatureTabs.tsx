/**
 * DesignForge AI — Feature Tabs Navigation Bar
 *
 * Features:
 * - Fixed height with flex-shrink: 0 (never squishes or collapses regardless of active view)
 * - Smooth horizontal mouse-wheel scrolling (deltaY -> scrollLeft)
 * - Interactive left/right scroll chevron controls
 * - Visual "more tabs" indicators
 * - Auto-scroll active tab into center view
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAppStore } from "../stores/appStore";

interface TabItem {
  id: "screenshot" | "html-css" | "generate-ai" | "website-url" | "agent-bridge" | "export-code" | "responsive";
  icon: string;
  label: string;
}

const TABS: TabItem[] = [
  { id: "screenshot", icon: "📸", label: "Photo" },
  { id: "html-css", icon: "📄", label: "Code" },
  { id: "generate-ai", icon: "✨", label: "AI" },
  { id: "website-url", icon: "🌐", label: "URL" },
  { id: "agent-bridge", icon: "🔌", label: "Agent" },
  { id: "export-code", icon: "</>", label: "Export" },
  { id: "responsive", icon: "📱", label: "Responsive" },
];

export const FeatureTabs: React.FC = () => {
  const { inputMode, setInputMode } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag-to-scroll tracking
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Check scroll position to show/hide indicators
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  // Center active tab whenever inputMode changes
  useEffect(() => {
    const activeEl = document.getElementById(`tab-${inputMode}`);
    if (activeEl && scrollRef.current) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setTimeout(updateScrollState, 300);
    }
  }, [inputMode, updateScrollState]);

  // Native non-passive wheel listener for butter-smooth horizontal scrolling
  // Converts both mouse wheel (deltaY) and touchpad swipe (deltaX) to horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta !== 0) {
        e.preventDefault();
        el.scrollLeft += delta * 0.85;
        updateScrollState();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [updateScrollState]);

  // Window-level drag-to-scroll listeners: works reliably even if pointer moves outside the 42px bar
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const el = scrollRef.current;
      if (!el) return;
      const x = e.pageX - el.getBoundingClientRect().left;
      const walk = (x - startXRef.current) * 1.25;
      if (Math.abs(walk) > 3) {
        hasMovedRef.current = true;
      }
      el.scrollLeft = scrollLeftRef.current - walk;
      updateScrollState();
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, updateScrollState]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.getBoundingClientRect().left;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleTabClick = (tabId: TabItem["id"]) => {
    // If user dragged to scroll, do not select the tab
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    setInputMode(tabId);
  };

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -160, behavior: "smooth" });
    setTimeout(updateScrollState, 250);
  };

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 160, behavior: "smooth" });
    setTimeout(updateScrollState, 250);
  };

  return (
    <div className="feature-tabs-container">
      {/* Scroll Left Chevron */}
      {canScrollLeft && (
        <button
          className="tabs-nav-btn tabs-nav-btn--left"
          onClick={handleScrollLeft}
          title="Scroll tabs left"
          aria-label="Scroll left"
        >
          ‹
        </button>
      )}

      {/* Scrollable Tabs Track */}
      <div
        ref={scrollRef}
        className={`feature-tabs-track ${isDragging ? "feature-tabs-track--dragging" : ""}`}
        role="tablist"
        onScroll={updateScrollState}
        onMouseDown={handleMouseDown}
      >
        {TABS.map((tab) => {
          const isActive = inputMode === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              className={`feature-tab ${isActive ? "feature-tab--active" : ""}`}
            >
              <span className="feature-tab__icon">{tab.icon}</span>
              <span className="feature-tab__label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Chevron / More Indicator */}
      {canScrollRight && (
        <button
          className="tabs-nav-btn tabs-nav-btn--right"
          onClick={handleScrollRight}
          title="More tabs (Responsive) →"
          aria-label="Scroll right"
        >
          ›
        </button>
      )}
    </div>
  );
};
