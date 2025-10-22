import React, { useState } from "react";
import "../styles/header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo">
            <img
              src="/images/logo-standard-vieux.png"
              alt="The Golden Spotlight"
            />
          </a>

          <nav className="nav-links">
            <a href="/categories">Categories</a>
            <a href="/about">About</a>
          </nav>

          <div className="icons">
            <a className="icone-desktop" href="https://instagram.com" target="_blank" rel="noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
            <a className="icone-desktop" href="https://facebook.com" target="_blank" rel="noreferrer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a className="icone-desktop" href="https://twitter.com" target="_blank" rel="noreferrer">
              <i className="fab fa-twitter"></i>
            </a>

            <button
              className={`burger ${menuOpen ? "open" : ""}`}
              onClick={toggleMenu}
              aria-label="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && <div className="overlay" onClick={closeMenu}></div>}

      <div className={`mobile-menu ${menuOpen ? "show" : ""}`}>
        <button className="close-btn" onClick={closeMenu} aria-label="Fermer">
          &times;
        </button>

        <a className="mobile-texte-a" href="/" onClick={closeMenu}>
          Home
        </a>
        <a className="mobile-texte-a" href="/categories" onClick={closeMenu}>
          Categories
        </a>
        <a className="mobile-texte-a" href="/about" onClick={closeMenu}>
          About
        </a>

        <div className="mobile-icons">
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">
            <i className="fab fa-twitter"></i>
          </a>
        </div>
      </div>
    </>
  );
};

export default Header;
