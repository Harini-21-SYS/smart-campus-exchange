import { useState } from "react";
import "./Navbar.css";
import { FaExchangeAlt, FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <nav className="navbar">

      <Link to="/" className="logo" onClick={closeMenu}>
        <div className="logo-icon">
          <FaExchangeAlt />
        </div>
        <h2>
          Campus <span>Xchange</span>
        </h2>
      </Link>

      <button
        className="nav-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        {open ? <FaTimes /> : <FaBars />}
      </button>

      <ul className={`nav-links ${open ? "nav-open" : ""}`}>
        <li><a href="#home" onClick={closeMenu}>Home</a></li>
        <li><a href="#about" onClick={closeMenu}>About</a></li>
        <li><a href="#features" onClick={closeMenu}>Features</a></li>
        <li><a href="#contact" onClick={closeMenu}>Contact</a></li>
        <li className="nav-links-cta">
          <Link to="/auth" className="login-btn" onClick={closeMenu}>
            Get Started
          </Link>
        </li>
      </ul>

    </nav>
  );
}

export default Navbar;