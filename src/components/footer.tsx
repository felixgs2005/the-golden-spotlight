import "../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-logo">
          <img
            src="/images/logo-standard-vieux.png"
            alt="The Golden Spotlight"
          />
        </div>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/categories">Categories</a>
          <a href="/about">About</a>
        </div>

        <div className="footer-socials">
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

      <p className="footer-copy">© 2025 The Golden Spotlight / Jessie - Félix</p>
    </footer>
  );
};

export default Footer;
