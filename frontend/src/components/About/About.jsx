import "./About.css";
import {
  FaExchangeAlt,
  FaShieldAlt,
  FaRecycle,
  FaUsers,
} from "react-icons/fa";

function About() {
  return (
    <section className="about" id="about">
      <div className="container">

        <div className="about-title text-center">
          <span>ABOUT US</span>

          <h2>Built for Students. Trusted on Campus.</h2>

          <p>
            A secure marketplace where verified students can buy, sell,
            donate and exchange academic and personal resources within
            their college campus.
          </p>
        </div>

        <div className="row mt-5 g-4">

          <div className="col-lg-3 col-md-6">
            <div className="about-card">
              <FaExchangeAlt className="about-icon" />
              <h4>Buy & Sell</h4>
              <p>Exchange useful items easily within your campus.</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="about-card">
              <FaShieldAlt className="about-icon" />
              <h4>Verified Users</h4>
              <p>Only verified college students can access the platform.</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="about-card">
              <FaRecycle className="about-icon" />
              <h4>Donate & Exchange</h4>
              <p>Give unused resources a second life instead of wasting them.</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="about-card">
              <FaUsers className="about-icon" />
              <h4>Campus Community</h4>
              <p>Connect with classmates through a trusted marketplace.</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default About;