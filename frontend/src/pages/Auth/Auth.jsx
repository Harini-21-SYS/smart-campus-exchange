import "./Auth.css";
import AuthImg from "../../assets/auth.jpg";

import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTimes } from "react-icons/fa";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const navigate = useNavigate();

  const otpInputRefs = useRef([]);

  const openOtpModal = (e) => {
    e.preventDefault(); // prevent form refresh
    setShowOtpModal(true);
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
  };

  const verifyOtp = () => {
    setShowOtpModal(false);

    // Temporary navigation
    navigate("/products");
  };

  // Keeps only the last typed digit, then jumps focus to the next box.
  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(-1);
    e.target.value = value;

    if (value && index < otpInputRefs.current.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace on an empty box moves focus back to the previous one.
  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div
      className="auth-container"
      style={{ backgroundImage: `url(${AuthImg})` }}
    >
      {/* Static dark overlay for legibility over the photo */}
      <div className="auth-overlay"></div>

      {/* Back to Home */}
      <Link to="/" className="back-home">
        <FaArrowLeft />
        Back to Home
      </Link>

      {/* Authentication Card */}
      <div className="auth-card">
        <h2>Welcome to Campus Xchange</h2>
        <p>
          {isLogin
            ? "Login to continue"
            : "Create your account"}
        </p>

        {/* Login/Register Tabs */}
        <div className="tab-buttons">
          <div
            className={`tab-slider ${isLogin ? "left" : "right"}`}
          ></div>

          <button
            className={isLogin ? "active" : ""}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>

          <button
            className={!isLogin ? "active" : ""}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form className="auth-form">
            <input
              type="email"
              placeholder="College Email"
            />

            <input
              type="password"
              placeholder="Password"
            />

            <button
              className="login-btn"
              type="submit"
            >
              Login
            </button>
          </form>
        ) : (
          /* Register Form */
          <form className="auth-form">
            <input
              type="text"
              placeholder="Full Name"
            />

            <input
              type="email"
              placeholder="College Email"
            />

            <input
              type="text"
              placeholder="Register Number"
            />

            <select defaultValue="">
              <option value="" disabled>
                Select Department
              </option>

              <option>Computer Science</option>
              <option>Computer Application</option>
              <option>Commerce</option>
              <option>Business Administration</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Zoology</option>
              <option>Botany</option>
              <option>English</option>
            </select>

            <select defaultValue="">
              <option value="" disabled>
                Select Year
              </option>

              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
            </select>

            <input
              type="tel"
              placeholder="Phone Number"
            />

            <input
              type="password"
              placeholder="Password"
            />

            <input
              type="password"
              placeholder="Confirm Password"
            />

            <button
              className="login-btn"
              type="button"
              onClick={openOtpModal}
            >
              Verify OTP
            </button>
            <p className="switch-text">
              Already have an account?
              <span onClick={() => setIsLogin(true)}>
                {" "}
                Login
              </span>
            </p>
          </form>
        )}
      </div>
      {showOtpModal && (
        <div className="otp-overlay">

          <div className="otp-modal">

            <button
              className="otp-close"
              onClick={closeOtpModal}
            >
              <FaTimes />
            </button>

            <h2>Email Verification</h2>

            <p>
              Enter the 6-digit OTP sent to your college email.
            </p>

            <div className="otp-inputs">

              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                />
              ))}

            </div>

            <p className="otp-resend">
              Didn't receive OTP?
              <span> Resend OTP</span>
            </p>

            <button
              className="verify-btn"
              onClick={verifyOtp}
            >
              Verify OTP
            </button>

          </div>

        </div>
      )}
    </div>


  );
}

export default Auth;