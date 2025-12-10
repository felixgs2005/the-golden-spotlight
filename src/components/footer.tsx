import "../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left section: logo + mobile socials */}
        <div className="footer-left">
          <span></span>
          <div className="footer-logo">
            <a href="/">
              <img src="/images/logo-standard-vieux.png" alt="The Golden Spotlight" />
            </a>
          </div>

          {/* Socials for MOBILE (hidden on desktop) */}
          <div className="footer-socials footer-socials--mobile">
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </div>

        {/* Middle section: links */}
        <div className="footer-middle">
          <a href="/">Home</a>
          <a href="/category">Categories</a>
          <a href="/about">About</a>
        </div>

        {/* Right section: socials for DESKTOP (hidden on mobile) */}
        <div className="footer-right">
          <span></span>
          <div className="footer-socials footer-socials--desktop">
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </div>
      </div>

      <p className="footer-copy">© 2025 Jessie – Félix</p>
    </footer>
  );
};

export default Footer;
