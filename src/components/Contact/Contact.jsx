import "./Contact.css";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";

function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="container">

        <div className="contact-title text-center">
          <span className="section-tag">CONTACT</span>

          <h2>Get In Touch</h2>

          <p>
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="row g-4 align-items-center">

          {/* Left Side */}

          <div className="col-lg-4">

            <div className="contact-info">

              <div className="info-box">
                <FaMapMarkerAlt className="info-icon" />
                <div>
                  <h5>Location</h5>
                  <p>Your College Campus</p>
                </div>
              </div>

              <div className="info-box">
                <FaEnvelope className="info-icon email-icon" />
                <div>
                  <h5>Email</h5>
                  <p>campusexchange@gmail.com</p>
                </div>
              </div>

              <div className="info-box">
                <FaPhoneAlt className="info-icon" />
                <div>
                  <h5>Phone</h5>
                  <p>+91 9876543210</p>
                </div>
              </div>

            </div>

          </div>

          {/* Right Side */}

          <div className="col-lg-8">

            <div className="contact-form">

              <form>

                <div className="row">

                  <div className="col-md-6 mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="College Email"
                    />
                  </div>

                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Subject"
                  />
                </div>

                <div className="mb-4">
                  <textarea
                    rows="5"
                    className="form-control"
                    placeholder="Your Message"
                  ></textarea>
                </div>

                <button className="send-btn">
                  Send Message
                </button>

              </form>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default Contact;