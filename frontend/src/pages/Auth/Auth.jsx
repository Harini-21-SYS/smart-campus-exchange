import "./Auth.css";
import AuthImg from "../../assets/auth.jpg";
import {
  registerUser,
  verifyOtp,
  loginUser,
  resendOtp,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
} from "../../services/authService";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showForgotOtpModal, setShowForgotOtpModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  const [forgotOtp, setForgotOtp] = useState("");

  const [resetData, setResetData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");

  // ---------- Register is a 3-step wizard so nothing needs to scroll ----------
  const [registerStep, setRegisterStep] = useState(1);
  const TOTAL_STEPS = 3;

  const [registerData, setRegisterData] = useState({
    fullName: "",
    collegeEmail: "",
    registerNumber: "",
    department: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({
    collegeEmail: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/products");
    }
  }, [navigate]);

  const otpInputRefs = useRef([]);

  // ---------- Toast notifications (replaces alert()) ----------
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  };

  // ---------- Enter key advances to the next field ----------
  // Works for any input/select sitting inside a <form>: Enter moves
  // focus to the next field, or — on the last field — clicks
  // whichever "next step" / submit button is present in that form.
  const handleEnterNext = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const form = e.target.form;
    if (!form) return;

    const focusable = Array.from(form.querySelectorAll("input, select"));
    const index = focusable.indexOf(e.target);

    if (index > -1 && index < focusable.length - 1) {
      focusable[index + 1].focus();
    } else {
      const trigger = form.querySelector(".step-next-btn, .login-btn");
      trigger?.click();
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const goNextStep = () => {
    setRegisterStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBackStep = () => {
    setRegisterStep((s) => Math.max(s - 1, 1));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await registerUser(registerData);
      console.log(response);

      showToast("Almost there — check your inbox for the OTP! ✨", "success");
      setShowOtpModal(true);
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Registration failed. Please try again.",
        "error"
      );
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser(loginData);
      console.log(response);

      localStorage.setItem("token", response.token);
      localStorage.setItem("email", response.email);
      localStorage.setItem("role", response.role);

      showToast("Welcome back! Taking you to the marketplace 🎓", "success");

      setTimeout(() => navigate("/products"), 900);
    } catch (error) {

    console.log("LOGIN ERROR STATUS:", error.response?.status);
    console.log("LOGIN ERROR DATA:", error.response?.data);
    console.log("LOGIN ERROR MESSAGE:", error.response?.data?.message);

    showToast(
      error.response?.data?.message ||
        "Login failed. Check your details and try again.",
      "error"
    );
  }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await verifyOtp({
        email: registerData.collegeEmail,
        otp: otp,
      });

      console.log(response);
      showToast("You're verified! Welcome to Campus Exchange 🎉", "success");

      setShowOtpModal(false);
      setTimeout(() => navigate("/products"), 900);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "That OTP didn't match — try again.", "error");
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await resendOtp(registerData.collegeEmail);
      showToast(response.message || "A fresh OTP is on its way 📩", "success");
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Couldn't resend the OTP.", "error");
    }
  };

  const handleVerifyForgotOtp = async () => {
    try {
      const response = await verifyForgotOtp({
        email: forgotEmail,
        otp: forgotOtp,
      });

      showToast(response.message || "OTP verified — set your new password.", "success");
      setShowForgotOtpModal(false);
      setShowResetPasswordModal(true);
    } catch (error) {
      showToast(error.response?.data?.message || "That OTP didn't match — try again.", "error");
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await forgotPassword({ email: forgotEmail });
      showToast(response.message || "OTP sent to your email 📩", "success");
      setShowForgotModal(false);
      setShowForgotOtpModal(true);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Couldn't send the OTP.", "error");
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await resetPassword({
        email: forgotEmail,
        newPassword: resetData.newPassword,
        confirmPassword: resetData.confirmPassword,
      });

      showToast(response.message || "Password reset! You're all set to log in 🔐", "success");
      setShowResetPasswordModal(false);
    } catch (error) {
      showToast(error.response?.data?.message || "Reset failed. Please try again.", "error");
    }
  };

  // Keeps only the last typed digit, then jumps focus to the next box.
  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(-1);
    e.target.value = value;

    const otpArray = otp.split("");
    otpArray[index] = value;
    setOtp(otpArray.join(""));

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
    <div className="auth-container" style={{ backgroundImage: `url(${AuthImg})` }}>
      {/* Static dark overlay for legibility over the photo */}
      <div className="auth-overlay"></div>

      {/* Toast notifications */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => dismissToast(t.id)}>
              <FaTimes />
            </button>
            <div className="toast-progress"></div>
          </div>
        ))}
      </div>

      {/* Back to Home */}
      <Link to="/" className="back-home">
        <FaArrowLeft />
        Back to Home
      </Link>

      {/* Authentication Card */}
      <div className="auth-card">
        <h2>Welcome to Campus Exchange</h2>
        <p>{isLogin ? "Login to continue" : "Create your account"}</p>

        {/* Login/Register Tabs */}
        <div className="tab-buttons">
          <div className={`tab-slider ${isLogin ? "left" : "right"}`}></div>

          <button className={isLogin ? "active" : ""} onClick={() => setIsLogin(true)}>
            Login
          </button>

          <button
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              setRegisterStep(1);
            }}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form className="auth-form">
            <input
              type="email"
              name="collegeEmail"
              value={loginData.collegeEmail}
              onChange={handleLoginChange}
              onKeyDown={handleEnterNext}
              placeholder="College Email"
            />

            <input
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleLoginChange}
              onKeyDown={handleEnterNext}
              placeholder="Password"
            />

            <p className="forgot-link" onClick={() => setShowForgotModal(true)}>
              Forgot Password?
            </p>

            <button className="login-btn" type="button" onClick={handleLogin}>
              Login
            </button>
          </form>
        ) : (
          /* Register Form — 3 steps, no scrolling */
          <form className="auth-form">
            {/* Step progress indicator */}
            <div className="step-tracker">
              {[1, 2, 3].map((step) => (
                <div key={step} className="step-track-item">
                  <div
                    className={`step-dot ${
                      registerStep === step
                        ? "step-current"
                        : registerStep > step
                        ? "step-done"
                        : ""
                    }`}
                  >
                    {registerStep > step ? <FaCheckCircle /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`step-line ${registerStep > step ? "step-line-done" : ""}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {registerStep === 1 && (
              <>
                <input
                  type="text"
                  name="fullName"
                  value={registerData.fullName}
                  onChange={handleRegisterChange}
                  onKeyDown={handleEnterNext}
                  placeholder="Full Name"
                  autoFocus
                />

                <input
                  type="email"
                  name="collegeEmail"
                  value={registerData.collegeEmail}
                  onChange={handleRegisterChange}
                  onKeyDown={handleEnterNext}
                  placeholder="College Email"
                />

                <input
                  type="text"
                  name="registerNumber"
                  value={registerData.registerNumber}
                  onChange={handleRegisterChange}
                  onKeyDown={handleEnterNext}
                  placeholder="Register Number"
                />

                <button className="step-next-btn" type="button" onClick={goNextStep}>
                  Continue
                </button>
              </>
            )}

            {registerStep === 2 && (
              <>
                <select
                  name="department"
                  value={registerData.department}
                  onChange={handleRegisterChange}
                  onKeyDown={handleEnterNext}
                >
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

                

                <input
                  type="tel"
                  name="mobileNumber"
                  value={registerData.mobileNumber}
                  onChange={handleRegisterChange}
                  onKeyDown={handleEnterNext}
                  placeholder="Phone Number"
                />

                <div className="step-btn-row">
                  <button className="step-back-btn" type="button" onClick={goBackStep}>
                    Back
                  </button>
                  <button className="step-next-btn" type="button" onClick={goNextStep}>
                    Continue
                  </button>
                </div>
              </>
            )}

            {registerStep === 3 && (
              <>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  onKeyDown={handleEnterNext}
                  placeholder="Password"
                  autoFocus
                />

                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  onKeyDown={handleEnterNext}
                  placeholder="Confirm Password"
                />

                <div className="step-btn-row">
                  <button className="step-back-btn" type="button" onClick={goBackStep}>
                    Back
                  </button>
                  <button className="login-btn" type="button" onClick={handleRegister}>
                    Send OTP
                  </button>
                </div>
              </>
            )}

            <p className="switch-text">
              Already have an account?
              <span onClick={() => setIsLogin(true)}> Login</span>
            </p>
          </form>
        )}
      </div>

      {/* ---------- OTP Verification Modal ---------- */}
      {showOtpModal && (
        <div className="otp-overlay">
          <div className="otp-modal">
            <button className="otp-close" onClick={closeOtpModal}>
              <FaTimes />
            </button>

            <div className="modal-badge">
              <FaEnvelope />
            </div>

            <h2>Email Verification</h2>
            <p>Enter the 6-digit OTP sent to your college email.</p>

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
              <span onClick={handleResendOtp}> Resend OTP</span>
            </p>

            <button className="verify-btn" onClick={handleVerifyOtp}>
              Verify OTP
            </button>
          </div>
        </div>
      )}

      {/* ---------- Forgot Password Modal ---------- */}
      {showForgotModal && (
        <div className="otp-overlay">
          <div className="otp-modal">
            <button className="otp-close" onClick={() => setShowForgotModal(false)}>
              <FaTimes />
            </button>

            <div className="modal-badge">
              <FaLock />
            </div>

            <h2>Forgot Password</h2>
            <p>Enter your registered college email and we'll send you an OTP.</p>

            <div className="modal-input-group">
              <FaEnvelope className="modal-input-icon" />
              <input
                type="email"
                placeholder="College Email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                autoFocus
              />
            </div>

            <button className="verify-btn" onClick={handleForgotPassword}>
              Send OTP
            </button>
          </div>
        </div>
      )}

      {/* ---------- Forgot Password OTP Modal ---------- */}
      {showForgotOtpModal && (
        <div className="otp-overlay">
          <div className="otp-modal">
            <div className="modal-badge">
              <FaEnvelope />
            </div>

            <h2>Verify OTP</h2>
            <p>Enter the OTP sent to {forgotEmail || "your email"}.</p>

            <div className="modal-input-group">
              <FaLock className="modal-input-icon" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyForgotOtp()}
                autoFocus
              />
            </div>

            <button className="verify-btn" onClick={handleVerifyForgotOtp}>
              Verify OTP
            </button>
          </div>
        </div>
      )}

      {/* ---------- Reset Password Modal ---------- */}
      {showResetPasswordModal && (
        <div className="otp-overlay">
          <div className="otp-modal">
            <div className="modal-badge">
              <FaLock />
            </div>

            <h2>Reset Password</h2>
            <p>Choose a new password for your account.</p>

            <div className="modal-input-group">
              <FaLock className="modal-input-icon" />
              <input
                type="password"
                placeholder="New Password"
                value={resetData.newPassword}
                onChange={(e) =>
                  setResetData({ ...resetData, newPassword: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget
                      .closest(".otp-modal")
                      .querySelector('input[placeholder="Confirm Password"]')
                      ?.focus();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="modal-input-group">
              <FaLock className="modal-input-icon" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={resetData.confirmPassword}
                onChange={(e) =>
                  setResetData({ ...resetData, confirmPassword: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
              />
            </div>

            <button className="verify-btn" onClick={handleResetPassword}>
              Reset Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;