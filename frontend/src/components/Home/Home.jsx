import "./Home.css";
import { FaGraduationCap, FaExchangeAlt, FaShieldAlt, FaShoppingBag } from "react-icons/fa";
import { Link } from "react-router-dom";
import HeroImg from "../../assets/hero.png";

function Home() {
  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="row align-items-center">

          {/* Left Side */}
          <div className="col-lg-6 col-md-6 col-12">
            <div className="hero-left">

              <h1>
                Give it a new home.
                <br />
                Get what you actually
                <br />
                need.
              </h1>

              <p>
                Buy, sell, donate and exchange academic and personal
                resources within your college campus safely and
                conveniently.
              </p>

              <div className="hero-buttons">
                <a href="#contact" className="primary-btn">
                  Contact Us
                  </a>
                

                <a href="#about" className="secondary-btn">
                  Learn More
                </a>
              </div>

            </div>
          </div>

          {/* Right Side */}
          <div className="col-lg-6 col-md-6 col-12">
            <div className="hero-right">
              <div className="hero-glow"></div>
              <div className="hero-ring"></div>

              <div className="hero-image-float">
                <div className="hero-image">
                  <img src={HeroImg} alt="Hero" className="img-fluid" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Home;