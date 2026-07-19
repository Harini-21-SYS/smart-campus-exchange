import "./Auth.css";
import AuthImg from "../../assets/auth.jpg";
import { registerUser, verifyOtp, loginUser, resendOtp, forgotPassword, verifyForgotOtp, resetPassword } from "../../services/authService";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTimes } from "react-icons/fa";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [showForgotModal,
    setShowForgotModal] = useState(false);

  const [showForgotOtpModal,
    setShowForgotOtpModal] = useState(false);

  const [showResetPasswordModal,
    setShowResetPasswordModal] = useState(false);

  const [forgotOtp,
    setForgotOtp] = useState("");

  const [resetData,
    setResetData] = useState({
      newPassword: "",
      confirmPassword: ""
    });

  const [forgotEmail, setForgotEmail] = useState("");

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

  const handleRegisterChange = (e) => {

    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
    console.log(e.target.name, e.target.value);
  };

  const handleLoginChange = (e) => {

    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });

  };

  const handleRegister = async (e) => {

    e.preventDefault();

    try {

      const response = await registerUser(registerData);

      console.log(response);

      setShowOtpModal(true);

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Registration Failed"
      );
    }
  };

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const response =
        await loginUser(loginData);

      console.log(response);

      localStorage.setItem(
        "token",
        response.token
      );

      localStorage.setItem(
        "email",
        response.email
      );

      localStorage.setItem(
        "role",
        response.role
      );

      alert("Login Successful");



      navigate("/products");

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Login Failed"
      );
    }
  };

  const openOtpModal = (e) => {
    e.preventDefault(); // prevent form refresh
    setShowOtpModal(true);
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
  };

  const handleVerifyOtp = async () => {

    try {

      const response =
        await verifyOtp({

          email:
            registerData.collegeEmail,

          otp: otp
        });

      console.log(response);

      alert(response.message);

      setShowOtpModal(false);

      navigate("/products");

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Invalid OTP"
      );
    }
  };

  const handleResendOtp = async () => {

    try {

      const response =
        await resendOtp(
          registerData.collegeEmail
        );

      alert(response.message);

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to resend OTP"
      );
    }
  };

  const handleVerifyForgotOtp = async () => {

    try {

      const response =
        await verifyForgotOtp({

          email: forgotEmail,

          otp: forgotOtp
        });

      alert(response.message);

      setShowForgotOtpModal(false);

      setShowResetPasswordModal(true);

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Invalid OTP"
      );
    }
  };

  const handleForgotPassword = async () => {

    try {

      const response =
        await forgotPassword({
          email: forgotEmail
        });

      alert(response.message);

      setShowForgotModal(false);

      setShowForgotOtpModal(true);

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to send OTP"
      );
    }
  };

  const handleResetPassword = async () => {

    try {

      const response =
        await resetPassword({

          email: forgotEmail,

          newPassword:
            resetData.newPassword,

          confirmPassword:
            resetData.confirmPassword
        });

      alert(response.message);

      setShowResetPasswordModal(false);

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Reset Failed"
      );
    }
  };

  // Keeps only the last typed digit, then jumps focus to the next box.
  const handleOtpChange = (e, index) => {

    const value =
      e.target.value
        .replace(/[^0-9]/g, "")
        .slice(-1);

    e.target.value = value;

    const otpArray = otp.split("");

    otpArray[index] = value;

    setOtp(otpArray.join(""));

    if (
      value &&
      index < otpInputRefs.current.length - 1
    ) {
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
        <h2>Welcome to Campus Exchange</h2>
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
              name="collegeEmail"
              value={loginData.collegeEmail}
              onChange={handleLoginChange}
              placeholder="College Email"
            />

            <input
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleLoginChange}
              placeholder="Password"
            />

            <p
              className="forgot-link"
              onClick={() => setShowForgotModal(true)}
            >
              Forgot Password?
            </p>

            <button
              className="login-btn"
              type="button"
              onClick={handleLogin}
            >
              Login
            </button>
          </form>
        ) : (
          /* Register Form */
          <form className="auth-form">
            <input
              type="text"
              name="fullName"
              value={registerData.fullName}
              onChange={handleRegisterChange}
              placeholder="Full Name"
            />

            <input
              type="email"
              name="collegeEmail"
              value={registerData.collegeEmail}
              onChange={handleRegisterChange}
              placeholder="College Email"
            />

            <input
              type="text"
              name="registerNumber"
              value={registerData.registerNumber}
              onChange={handleRegisterChange}
              placeholder="Register Number"
            />

            <select
              name="department"
              value={registerData.department}
              onChange={handleRegisterChange}
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
              name="mobileNumber"
              value={registerData.mobileNumber}
              onChange={handleRegisterChange}
              placeholder="Phone Number"
            />

            <input
              type="password"
              name="password"
              value={registerData.password}
              onChange={handleRegisterChange}
              placeholder="Password"
            />

            <input
              type="password"
              name="confirmPassword"
              value={registerData.confirmPassword}
              onChange={handleRegisterChange}
              placeholder="Confirm Password"
            />

            <button
              className="login-btn"
              type="button"
              onClick={handleRegister}
            >
              Send OTP
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

              <span
                onClick={handleResendOtp}
                style={{ cursor: "pointer" }}
              >
                Resend OTP
              </span>

            </p>

            <button
              className="verify-btn"
              onClick={handleVerifyOtp}
            >
              Verify OTP
            </button>

          </div>

        </div>
      )}
      {showForgotModal && (

        <div className="otp-overlay">

          <div className="otp-modal">

            <button
              className="otp-close"
              onClick={() =>
                setShowForgotModal(false)
              }
            >
              <FaTimes />
            </button>

            <h2>Forgot Password</h2>

            <p>
              Enter your registered email.
            </p>

            <input
              type="email"
              placeholder="College Email"
              value={forgotEmail}
              onChange={(e) =>
                setForgotEmail(e.target.value)
              }
            />

            <button
              className="verify-btn"
              onClick={handleForgotPassword}
            >
              Send OTP
            </button>

          </div>

        </div>

      )}
      {showForgotOtpModal && (

        <div className="otp-overlay">

          <div className="otp-modal">

            <h2>Verify OTP</h2>

            <p>
              Enter OTP sent to email
            </p>

            <input
              type="text"
              placeholder="Enter OTP"
              value={forgotOtp}
              onChange={(e) =>
                setForgotOtp(e.target.value)
              }
            />

            <button
              className="verify-btn"
              onClick={handleVerifyForgotOtp}
            >
              Verify OTP
            </button>

          </div>

        </div>

      )}

      {showResetPasswordModal && (

        <div className="otp-overlay">

          <div className="otp-modal">

            <h2>Reset Password</h2>

            <input
              type="password"
              placeholder="New Password"
              value={resetData.newPassword}
              onChange={(e) =>
                setResetData({
                  ...resetData,
                  newPassword: e.target.value
                })
              }
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={resetData.confirmPassword}
              onChange={(e) =>
                setResetData({
                  ...resetData,
                  confirmPassword: e.target.value
                })
              }
            />

            <button
              className="verify-btn"
              onClick={handleResetPassword}
            >
              Reset Password
            </button>

          </div>

        </div>

      )}



    </div>


  );
}

export default Auth;