import "./Contact.css";
import { useState } from "react";
import { sendContactMessage } from "../../services/contactService"; // adjust path if needed
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "error", text }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear this field's error (and any old banner) as soon as the user edits
    setErrors((errs) => (errs[name] ? { ...errs, [name]: "" } : errs));
    if (status) setStatus(null);
  };

  const validate = () => {
    const errs = {};

    if (!form.name.trim()) {
      errs.name = "Name is required.";
    }

    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errs.email = "Enter a valid email address.";
    }

    if (!form.subject.trim()) {
      errs.subject = "Subject is required.";
    }

    if (form.message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters.";
    } else if (form.message.length > 2000) {
      errs.message = "Message must be under 2000 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending || !validate()) return;

    setSending(true);
    try {
      const res = await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setStatus({
        type: "success",
        text: res?.message || "Thanks for reaching out! We'll get back to you soon.",
      });
      setForm(EMPTY_FORM);
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error.response?.data?.message ||
          "Couldn't send your message. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

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

              <form onSubmit={handleSubmit} noValidate>

                <div className="row">

                  <div className="col-md-6 mb-3">
                    <input
                      type="text"
                      name="name"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      placeholder="Full Name"
                      value={form.name}
                      onChange={handleChange}
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      placeholder="College Email"
                      value={form.email}
                      onChange={handleChange}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>

                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    name="subject"
                    className={`form-control ${errors.subject ? "is-invalid" : ""}`}
                    placeholder="Subject"
                    value={form.subject}
                    onChange={handleChange}
                  />
                  {errors.subject && (
                    <div className="invalid-feedback">{errors.subject}</div>
                  )}
                </div>

                <div className="mb-4">
                  <textarea
                    rows="5"
                    name="message"
                    className={`form-control ${errors.message ? "is-invalid" : ""}`}
                    placeholder="Your Message"
                    value={form.message}
                    onChange={handleChange}
                  ></textarea>
                  {errors.message && (
                    <div className="invalid-feedback">{errors.message}</div>
                  )}
                </div>

                {status && (
                  <p
                    className={`contact-status ${
                      status.type === "error"
                        ? "contact-status-error"
                        : "contact-status-success"
                    }`}
                  >
                    {status.text}
                  </p>
                )}

                <button className="send-btn" type="submit" disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
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