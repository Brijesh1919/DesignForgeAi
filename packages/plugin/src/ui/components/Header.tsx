import React from "react";
import { useAppStore } from "../stores/appStore";


import logo from "../assets/logo.jpg";


export const Header: React.FC = () => {
  const { currentView, setView, settings } = useAppStore();

  return (
    <header className="header">
      <div className="header__logo">
        <img src={logo} alt="DesignForge AI" className="header__logo-icon" />
        <span className="header__logo-text">DesignForge AI</span>
      </div>
      <nav className="header__nav">
        <button
          onClick={() => setView("upload")}
          className={`header__nav-btn ${currentView === "upload" ? "header__nav-btn--active" : ""}`}
        >
          Upload
        </button>
        {settings.debugMode && (
          <button
            onClick={() => setView("debug")}
            className={`header__nav-btn ${currentView === "debug" ? "header__nav-btn--active" : ""}`}
          >
            Debug
          </button>
        )}
        <button
          onClick={() => setView("history")}
          className={`header__nav-btn ${currentView === "history" ? "header__nav-btn--active" : ""}`}
        >
          History
        </button>
        <button
          onClick={() => setView("settings")}
          className={`header__nav-btn ${currentView === "settings" ? "header__nav-btn--active" : ""}`}
        >
          🔧
        </button>
      </nav>
    </header>
  );
};
