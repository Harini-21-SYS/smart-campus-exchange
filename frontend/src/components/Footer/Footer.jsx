 import "./Footer.css";
import { FaExchangeAlt } from "react-icons/fa";
import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">

      <div className="container">

        <div className="footer-content">

          <div className="footer-logo">

            <div className="footer-icon">
              <FaExchangeAlt />
            </div>

            <h3>
              Campus <span>Xchange</span>
            </h3>

          </div>

          <p>
            Buy • Sell • Donate • Exchange within your campus.
          </p>

          <div className="footer-social">

            <a href="#">
              <FaGithub />
            </a>

            <a href="#">
              <FaLinkedin />
            </a>

            <a href="#">
              <FaInstagram />
            </a>

          </div>

          <hr />

          <p className="copyright">
           ❤️Built by Students for Students.
          </p>

        </div>

      </div>

    </footer>
  );
}

export default Footer;