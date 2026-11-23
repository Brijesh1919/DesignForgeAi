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

  // Handle standard desktop mouse wheel on the tab bar
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (e.deltaY !== 0) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      updateScrollState();
    }
  };

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -140, behavior: "smooth" });
    setTimeout(updateScrollState, 250);
  };

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 140, behavior: "smooth" });
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
        className="feature-tabs-track"
        role="tablist"
        onWheel={handleWheel}
        onScroll={updateScrollState}
      >
        {TABS.map((tab) => {
          const isActive = inputMode === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => setInputMode(tab.id)}
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
