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

// ---------- localStorage keys used to survive a page refresh ----------
const DRAFT_KEY = "authDraftState";

// ---------- Validation helpers ----------
const NAME_REGEX = /^[A-Za-z][A-Za-z\s]{1,49}$/; // letters + spaces only, 2-50 chars
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTER_NUMBER_REGEX = /^[A-Za-z0-9]{4,20}$/; // alphanumeric only
const MOBILE_REGEX = /^[0-9]{10}$/; // exactly 10 digits
const PASSWORD_MIN_LENGTH = 6;
const OTP_LENGTH = 4;

// OTP is valid for 5 minutes — both OTP modals count down from this.
const OTP_VALIDITY_SECONDS = 5 * 60;

// ---------- Register number -> Year / Fee category auto-detection ----------
// Expected format: 2-digit admission year + optional "S" (self-financed) +
// U/P (UG or PG) + department code + 2-digit student number.
//   "24UCS23"  -> 24 admission year, no S so Aided,      U -> UG, CS, 23
//   "24SUCS24" -> 24 admission year, S so Self-Financed, U -> UG, CS, 24
// Department/stream is no longer derived from this — the student picks
// their Degree and Stream manually below. There's no backend lookup for
// the aided/self-financed distinction either; it's inferred purely from
// the register number pattern itself.
const REGISTER_NUMBER_PARSE_REGEX = /^(\d{2})([Ss]?)([UuPp])([A-Za-z]+)(\d{2})$/;

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

// ---------- Degree -> available Streams ----------
const DEGREE_STREAMS = {
  "B.Sc": ["Computer Science", "Mathematics", "Physics", "Chemistry", "Zoology", "Botany","Data Science","Information Technology","Psychology"],
  "B.Com": ["General", "Professional Accounting","Computer Applications","Honours"],
  "BCA": ["Computer Applications"],
  "BBA": ["General"],
  "B.A": ["English", "Economics","Tamil"],
  "M.Sc": ["Computer Science", "Mathematics", "Physics", "Chemistry","Zoology","Micro Biology","Bio Technology"],
  "M.Com": ["General"],
  "MCA": ["Computer Applications"],
  "MBA": ["Business Administration"],
  "M.A": ["English", "Economics","Tamil"],

};

const DEGREES = Object.keys(DEGREE_STREAMS);

/**
 * Parses a register number like "24UCS23" or "24SUCS24" into
 * { year, financeType, programLevel }.
 * - First 2 digits: admission year (24 -> 2024)
 * - Optional "S" right after: Self-Financed (absent = Aided)
 * - Next letter: U (Undergraduate) or P (Postgraduate)
 * - Remaining letters + 2 digits: department code + roll number (unused now)
 * Returns empty fields if the register number can't be parsed / matched.
 */
function deriveYearAndFinanceType(registerNumber) {
  const result = { year: "", financeType: "", programLevel: "" };
  if (!registerNumber) return result;

  const match = registerNumber.trim().match(REGISTER_NUMBER_PARSE_REGEX);
  if (!match) return result;

  const [, yearDigits, selfFlag, levelChar] = match;
  const admissionYear = 2000 + parseInt(yearDigits, 10);
  const currentYear = new Date().getFullYear();

  const isPG = levelChar.toUpperCase() === "P";
  result.programLevel = isPG ? "PG" : "UG";
  const maxYears = isPG ? 2 : 4;

  // e.g. admitted 2024, current year 2026 -> 3rd year
  let yearNumber = currentYear - admissionYear + 1;
  if (yearNumber < 1) yearNumber = 1;
  if (yearNumber > maxYears) yearNumber = maxYears;

  if (admissionYear <= currentYear) {
    result.year = YEAR_LABELS[yearNumber - 1];
  }

  result.financeType = selfFlag ? "Self-Financed" : "Aided";

  return result;
}

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showForgotOtpModal, setShowForgotOtpModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotOtpError, setForgotOtpError] = useState("");

  const [resetData, setResetData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [resetErrors, setResetErrors] = useState({});

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");

  // ---------- Register is a 3-step wizard so nothing needs to scroll ----------
  const [registerStep, setRegisterStep] = useState(1);
  const TOTAL_STEPS = 3;

  const [registerData, setRegisterData] = useState({
    fullName: "",
    collegeEmail: "",
    registerNumber: "",
    year: "",
    financeType: "",
    degree: "",
    stream: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({
    collegeEmail: "",
    password: "",
  });

  // Field-level error messages, keyed by field name
  const [registerErrors, setRegisterErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // ---------- 5-minute OTP countdown (shared by both OTP modals) ----------
  const [otpTimeLeft, setOtpTimeLeft] = useState(OTP_VALIDITY_SECONDS);

  const navigate = useNavigate();

  // Prevents the "persist" effect below from firing on the very first mount,
  // which would otherwise overwrite the saved draft with empty state before
  // the "restore" effect's setState has actually applied.
  const isFirstPersistRun = useRef(true);

  // ---------- Restore any in-progress form data after a refresh ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/products");
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (saved) {
        if (saved.registerData) setRegisterData((d) => ({ ...d, ...saved.registerData }));
        if (saved.loginData) setLoginData((d) => ({ ...d, ...saved.loginData }));
        if (typeof saved.registerStep === "number") setRegisterStep(saved.registerStep);
        if (typeof saved.isLogin === "boolean") setIsLogin(saved.isLogin);
      }
    } catch (err) {
      console.warn("Could not restore saved form data:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ---------- Persist form data on every change so a refresh doesn't lose it ----------
  useEffect(() => {
    // Skip the initial mount pass — at that point this closure still holds the
    // pre-restore (empty) state, and writing it would clobber the draft that
    // the restore effect just read (its setState hasn't applied yet).
    if (isFirstPersistRun.current) {
      isFirstPersistRun.current = false;
      return;
    }

    const draft = { registerData, loginData, registerStep, isLogin };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [registerData, loginData, registerStep, isLogin]);

  // ---------- Auto-derive Year & fee category whenever Register Number changes ----------
  useEffect(() => {
    const { year, financeType } = deriveYearAndFinanceType(registerData.registerNumber);
    setRegisterData((d) => {
      if (d.year === year && d.financeType === financeType) return d;
      return { ...d, year, financeType };
    });
    if (year) {
      setRegisterErrors((errs) => (errs.registerNumber ? { ...errs, registerNumber: "" } : errs));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerData.registerNumber]);

  // ---------- OTP countdown timer — runs while either OTP modal is open ----------
  useEffect(() => {
    if (!showOtpModal && !showForgotOtpModal) return;

    const id = setInterval(() => {
      setOtpTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [showOtpModal, showForgotOtpModal]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

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
    const { name, value } = e.target;
    setRegisterData((d) => ({ ...d, [name]: value }));
    // Clear the error for this field as soon as the user edits it
    setRegisterErrors((errs) => (errs[name] ? { ...errs, [name]: "" } : errs));
  };

  // Selecting a Degree resets Stream, since the available options change.
  const handleDegreeChange = (e) => {
    const value = e.target.value;
    setRegisterData((d) => ({ ...d, degree: value, stream: "" }));
    setRegisterErrors((errs) => ({ ...errs, degree: "", stream: "" }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((d) => ({ ...d, [name]: value }));
    setLoginErrors((errs) => (errs[name] ? { ...errs, [name]: "" } : errs));
  };

  // ---------- Step-by-step validation ----------
  const validateStep1 = () => {
    const errs = {};

    if (!registerData.fullName.trim()) {
      errs.fullName = "Full name is required.";
    } else if (!NAME_REGEX.test(registerData.fullName.trim())) {
      errs.fullName = "Name should contain letters and spaces only.";
    }

    if (!registerData.collegeEmail.trim()) {
      errs.collegeEmail = "College email is required.";
    } else if (!EMAIL_REGEX.test(registerData.collegeEmail.trim())) {
      errs.collegeEmail = "Enter a valid email address.";
    }

    if (!registerData.registerNumber.trim()) {
      errs.registerNumber = "Register number is required.";
    } else if (!REGISTER_NUMBER_REGEX.test(registerData.registerNumber.trim())) {
      errs.registerNumber = "Register number should be letters/numbers only (4-20 chars).";
    } else {
      const { year } = deriveYearAndFinanceType(registerData.registerNumber);
      if (!year) {
        errs.registerNumber =
          "Please check your register number. Expected format like 24UCS23 or 24SUCS23.";
      }
    }

    setRegisterErrors((prev) => ({
      ...prev,
      fullName: errs.fullName || "",
      collegeEmail: errs.collegeEmail || "",
      registerNumber: errs.registerNumber || "",
    }));
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
  const errs = {};

  if (!registerData.degree) {
    errs.degree = "Please select your degree.";
  }

  if (!registerData.department) {
    errs.department = "Please select your department.";
  }

  if (!registerData.mobileNumber.trim()) {
    errs.mobileNumber = "Phone number is required.";
  } else if (!MOBILE_REGEX.test(registerData.mobileNumber.trim())) {
    errs.mobileNumber = "Enter a valid 10-digit phone number.";
  }

  setRegisterErrors((prev) => ({
    ...prev,
    degree: errs.degree || "",
    department: errs.department || "",
    mobileNumber: errs.mobileNumber || "",
  }));

  return Object.keys(errs).length === 0;
};
  const validateStep3 = () => {
    const errs = {};

    if (!registerData.password) {
      errs.password = "Password is required.";
    } else if (registerData.password.length < PASSWORD_MIN_LENGTH) {
      errs.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (!registerData.confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (registerData.confirmPassword !== registerData.password) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setRegisterErrors((prev) => ({ ...prev, password: errs.password || "", confirmPassword: errs.confirmPassword || "" }));
    return Object.keys(errs).length === 0;
  };

  const validateLogin = () => {
    const errs = {};

    if (!loginData.collegeEmail.trim()) {
      errs.collegeEmail = "College email is required.";
    } else if (!EMAIL_REGEX.test(loginData.collegeEmail.trim())) {
      errs.collegeEmail = "Enter a valid email address.";
    }

    if (!loginData.password) {
      errs.password = "Password is required.";
    }

    setLoginErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast("Please fix the highlighted fields.", "error");
      return false;
    }
    return true;
  };

  const goNextStep = () => {
    const isValid =
      registerStep === 1 ? validateStep1() : registerStep === 2 ? validateStep2() : true;

    if (!isValid) {
      showToast("Please fix the highlighted fields before continuing.", "error");
      return;
    }

    setRegisterStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBackStep = () => {
    setRegisterStep((s) => Math.max(s - 1, 1));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateStep3()) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    try {
      const response = await registerUser(registerData);
      console.log(response);

      showToast("Almost there — check your inbox for the OTP! ✨", "success");
      setOtpTimeLeft(OTP_VALIDITY_SECONDS);
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

    if (!validateLogin()) return;

    try {
      const response = await loginUser(loginData);
      console.log(response);

      localStorage.setItem("token", response.token);
      localStorage.setItem("email", response.email);
      localStorage.setItem("role", response.role);
      clearDraft();

      showToast("Welcome back! Taking you to the marketplace 🎓", "success");

      setTimeout(() => navigate("/products"), 900);
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Login failed. Check your details and try again.",
        "error"
      );
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
  };

  const handleVerifyOtp = async () => {
    if (otpTimeLeft <= 0) {
      setOtpError("This OTP has expired. Please resend a new one.");
      return;
    }

    if (!otp || otp.length < OTP_LENGTH) {
      setOtpError(`Enter all ${OTP_LENGTH} digits of the OTP.`);
      return;
    }

    try {
      const response = await verifyOtp({
        email: registerData.collegeEmail,
        otp: otp,
      });

      console.log(response);
      showToast("You're verified! Please sign in to continue 🎉", "success");

      // Auto-fill the login form with the details just used to register,
      // so the user only has to click "Sign in".
      setLoginData({
        collegeEmail: registerData.collegeEmail,
        password: registerData.password,
      });

      setShowOtpModal(false);
      setOtp("");
      setOtpError("");
      setRegisterStep(1);
      setIsLogin(true);
    } catch (error) {
      console.error(error);
      setOtpError(error.response?.data?.message || "That OTP didn't match — try again.");
      showToast(error.response?.data?.message || "That OTP didn't match — try again.", "error");
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await resendOtp(registerData.collegeEmail);
      showToast(response.message || "A fresh OTP is on its way 📩", "success");
      setOtpTimeLeft(OTP_VALIDITY_SECONDS);
      setOtpError("");
      setOtp("");
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Couldn't resend the OTP.", "error");
    }
  };

  const handleVerifyForgotOtp = async () => {
    if (otpTimeLeft <= 0) {
      setForgotOtpError("This OTP has expired. Please request a new one.");
      return;
    }

    if (!forgotOtp) {
      setForgotOtpError("Please enter the OTP sent to your email.");
      return;
    }

    try {
      const response = await verifyForgotOtp({
        email: forgotEmail,
        otp: forgotOtp,
      });

      showToast(response.message || "OTP verified — set your new password.", "success");
      setForgotOtpError("");
      setShowForgotOtpModal(false);
      setShowResetPasswordModal(true);
    } catch (error) {
      const msg = error.response?.data?.message || "That OTP didn't match — try again.";
      setForgotOtpError(msg);
      showToast(msg, "error");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotEmailError("Please enter your college email.");
      return;
    }
    if (!EMAIL_REGEX.test(forgotEmail.trim())) {
      setForgotEmailError("Enter a valid email address.");
      return;
    }

    try {
      const response = await forgotPassword({ email: forgotEmail });
      showToast(response.message || "OTP sent to your email 📩", "success");
      setForgotEmailError("");
      setShowForgotModal(false);
      setOtpTimeLeft(OTP_VALIDITY_SECONDS);
      setShowForgotOtpModal(true);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Couldn't send the OTP.";
      setForgotEmailError(msg);
      showToast(msg, "error");
    }
  };

  const handleResetPassword = async () => {
    const errs = {};
    if (!resetData.newPassword) {
      errs.newPassword = "Please enter a new password.";
    } else if (resetData.newPassword.length < PASSWORD_MIN_LENGTH) {
      errs.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (!resetData.confirmPassword) {
      errs.confirmPassword = "Please confirm your new password.";
    } else if (resetData.confirmPassword !== resetData.newPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setResetErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    try {
      const response = await resetPassword({
        email: forgotEmail,
        newPassword: resetData.newPassword,
        confirmPassword: resetData.confirmPassword,
      });

      showToast(response.message || "Password reset! You're all set to log in 🔐", "success");
      setShowResetPasswordModal(false);
      setResetData({ newPassword: "", confirmPassword: "" });
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
    if (otpError) setOtpError("");

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
            <div className="field-group">
              <input
                type="email"
                name="collegeEmail"
                value={loginData.collegeEmail}
                onChange={handleLoginChange}
                onKeyDown={handleEnterNext}
                placeholder="College Email"
                className={loginErrors.collegeEmail ? "input-error" : ""}
              />
              {loginErrors.collegeEmail && (
                <span className="field-error-msg">{loginErrors.collegeEmail}</span>
              )}
            </div>

            <div className="field-group">
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                onKeyDown={handleEnterNext}
                placeholder="Password"
                className={loginErrors.password ? "input-error" : ""}
              />
              {loginErrors.password && (
                <span className="field-error-msg">{loginErrors.password}</span>
              )}
            </div>

            <p className="forgot-link" onClick={() => setShowForgotModal(true)}>
              Forgot Password?
            </p>

            <button className="login-btn" type="button" onClick={handleLogin}>
              Sign in
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
                <div className="field-group">
                  <input
                    type="text"
                    name="fullName"
                    value={registerData.fullName}
                    onChange={handleRegisterChange}
                    onKeyDown={handleEnterNext}
                    placeholder="Full Name"
                    autoFocus
                    className={registerErrors.fullName ? "input-error" : ""}
                  />
                  {registerErrors.fullName && (
                    <span className="field-error-msg">{registerErrors.fullName}</span>
                  )}
                </div>

                <div className="field-group">
                  <input
                    type="email"
                    name="collegeEmail"
                    value={registerData.collegeEmail}
                    onChange={handleRegisterChange}
                    onKeyDown={handleEnterNext}
                    placeholder="College Email"
                    className={registerErrors.collegeEmail ? "input-error" : ""}
                  />
                  {registerErrors.collegeEmail && (
                    <span className="field-error-msg">{registerErrors.collegeEmail}</span>
                  )}
                </div>

                <div className="field-group">
                  <input
                    type="text"
                    name="registerNumber"
                    value={registerData.registerNumber}
                    onChange={handleRegisterChange}
                    onKeyDown={handleEnterNext}
                    placeholder="Register Number (e.g. 24UCS23 / 24SUCS23)"
                    className={registerErrors.registerNumber ? "input-error" : ""}
                  />
                  {registerErrors.registerNumber && (
                    <span className="field-error-msg">{registerErrors.registerNumber}</span>
                  )}

                  {/* Informational only — not an editable field */}
                  {registerData.financeType && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "8px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: registerData.financeType === "Aided" ? "#1F4D3A" : "#a4750f",
                        background:
                          registerData.financeType === "Aided"
                            ? "rgba(31,77,58,0.1)"
                            : "rgba(227,167,43,0.18)",
                        padding: "4px 12px",
                        borderRadius: "999px",
                      }}
                    >
                      {registerData.financeType} Student
                    </span>
                  )}
                </div>

                <button className="step-next-btn" type="button" onClick={goNextStep}>
                  Continue
                </button>
              </>
            )}

           {registerStep === 2 && (
  <>
    {/* Year */}
    <div className="field-group">
      <input
        type="text"
        name="year"
        value={registerData.year}
        placeholder="Year (auto-detected)"
        readOnly
        disabled
        className="input-readonly"
      />
    </div>

    {/* Degree */}
    <div className="field-group">
      <select
        name="degree"
        value={registerData.degree}
        onChange={handleDegreeChange}
        onKeyDown={handleEnterNext}
        className={registerErrors.degree ? "input-error" : ""}
      >
        <option value="" disabled>
          Select Degree
        </option>

        {DEGREES.map((degree) => (
          <option key={degree} value={degree}>
            {degree}
          </option>
        ))}
      </select>

      {registerErrors.degree && (
        <span className="field-error-msg">
          {registerErrors.degree}
        </span>
      )}
    </div>

    {/* Department */}
    <div className="field-group">
      <select
        name="department"
        value={registerData.department}
        onChange={handleRegisterChange}
        onKeyDown={handleEnterNext}
        disabled={!registerData.degree}
        className={registerErrors.department ? "input-error" : ""}
      >
        <option value="" disabled>
          {registerData.degree
            ? "Select Department"
            : "Select Degree First"}
        </option>

        {(DEGREE_STREAMS[registerData.degree] || []).map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>

      {registerErrors.department && (
        <span className="field-error-msg">
          {registerErrors.department}
        </span>
      )}
    </div>

    {/* Mobile Number */}
    <div className="field-group">
      <input
        type="tel"
        name="mobileNumber"
        value={registerData.mobileNumber}
        onChange={handleRegisterChange}
        onKeyDown={handleEnterNext}
        placeholder="Phone Number"
        className={registerErrors.mobileNumber ? "input-error" : ""}
      />

      {registerErrors.mobileNumber && (
        <span className="field-error-msg">
          {registerErrors.mobileNumber}
        </span>
      )}
    </div>

    <div className="step-btn-row">
      <button
        type="button"
        className="step-back-btn"
        onClick={goBackStep}
      >
        Back
      </button>

      <button
        type="button"
        className="step-next-btn"
        onClick={goNextStep}
      >
        Continue
      </button>
    </div>
  </>
)}

            {registerStep === 3 && (
              <>
                <div className="field-group">
                  <input
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    onKeyDown={handleEnterNext}
                    placeholder="Password"
                    autoFocus
                    className={registerErrors.password ? "input-error" : ""}
                  />
                  {registerErrors.password && (
                    <span className="field-error-msg">{registerErrors.password}</span>
                  )}
                </div>

                <div className="field-group">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    onKeyDown={handleEnterNext}
                    placeholder="Confirm Password"
                    className={registerErrors.confirmPassword ? "input-error" : ""}
                  />
                  {registerErrors.confirmPassword && (
                    <span className="field-error-msg">{registerErrors.confirmPassword}</span>
                  )}
                </div>

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
            <p>Enter the {OTP_LENGTH}-digit OTP sent to your college email.</p>

            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                marginTop: "-14px",
                marginBottom: "18px",
                color: otpTimeLeft > 0 ? "#888" : "#C0483D",
              }}
            >
              {otpTimeLeft > 0
                ? `OTP expires in ${formatTime(otpTimeLeft)}`
                : "Your OTP has expired — please resend."}
            </p>

            <div className="otp-inputs">
              {Array.from({ length: OTP_LENGTH }, (_, index) => index).map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  disabled={otpTimeLeft <= 0}
                  className={otpError ? "input-error" : ""}
                />
              ))}
            </div>
            {otpError && <span className="field-error-msg otp-error-msg">{otpError}</span>}

            <p className="otp-resend">
              Didn't receive OTP?
              <span
                onClick={otpTimeLeft > 0 ? undefined : handleResendOtp}
                style={
                  otpTimeLeft > 0
                    ? { opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" }
                    : {}
                }
              >
                {" "}
                Resend OTP
              </span>
            </p>

            <button className="verify-btn" onClick={handleVerifyOtp} disabled={otpTimeLeft <= 0}>
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
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  if (forgotEmailError) setForgotEmailError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                autoFocus
                className={forgotEmailError ? "input-error" : ""}
              />
            </div>
            {forgotEmailError && <span className="field-error-msg">{forgotEmailError}</span>}

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

            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "18px",
                color: otpTimeLeft > 0 ? "#888" : "#C0483D",
              }}
            >
              {otpTimeLeft > 0
                ? `OTP expires in ${formatTime(otpTimeLeft)}`
                : "Your OTP has expired — please request a new one."}
            </p>

            <div className="modal-input-group">
              <FaLock className="modal-input-icon" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={forgotOtp}
                onChange={(e) => {
                  setForgotOtp(e.target.value);
                  if (forgotOtpError) setForgotOtpError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyForgotOtp()}
                autoFocus
                disabled={otpTimeLeft <= 0}
                className={forgotOtpError ? "input-error" : ""}
              />
            </div>
            {forgotOtpError && <span className="field-error-msg">{forgotOtpError}</span>}

            <button
              className="verify-btn"
              onClick={handleVerifyForgotOtp}
              disabled={otpTimeLeft <= 0}
            >
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
                onChange={(e) => {
                  setResetData({ ...resetData, newPassword: e.target.value });
                  if (resetErrors.newPassword)
                    setResetErrors((er) => ({ ...er, newPassword: "" }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget
                      .closest(".otp-modal")
                      .querySelector('input[placeholder="Confirm Password"]')
                      ?.focus();
                  }
                }}
                autoFocus
                className={resetErrors.newPassword ? "input-error" : ""}
              />
            </div>
            {resetErrors.newPassword && (
              <span className="field-error-msg">{resetErrors.newPassword}</span>
            )}

            <div className="modal-input-group">
              <FaLock className="modal-input-icon" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={resetData.confirmPassword}
                onChange={(e) => {
                  setResetData({ ...resetData, confirmPassword: e.target.value });
                  if (resetErrors.confirmPassword)
                    setResetErrors((er) => ({ ...er, confirmPassword: "" }));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                className={resetErrors.confirmPassword ? "input-error" : ""}
              />
            </div>
            {resetErrors.confirmPassword && (
              <span className="field-error-msg">{resetErrors.confirmPassword}</span>
            )}

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