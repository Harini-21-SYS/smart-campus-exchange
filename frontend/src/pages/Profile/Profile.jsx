import "./Profile.css";
import ProfileImg from "../../assets/profile.png";
import AuthImg from "../../assets/auth.jpg";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  getProfile,
  updateMobile,
  updateProfileImage,
  changePassword,
} from "../../services/profileService";

import {
  FaCamera,
  FaCheckCircle,
  FaExclamationCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaIdCard,
  FaUniversity,
  FaGraduationCap,
  FaUser,
  FaEdit,
  FaLock,
  FaSignOutAlt,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";

// ---------- Validation helpers ----------
const MOBILE_REGEX = /^[0-9]{10}$/;
const PASSWORD_MIN_LENGTH = 6;

// ---------- Trust score bands ----------
// Mirrors TrustScoreService.describe() on the backend, so the
// fallback label used here (only when the backend didn't send
// trustLabel) always says the same thing the server would have said.
function describeTrustScore(score) {
  if (score >= 80) return "Highly Trusted";
  if (score >= 60) return "Trusted Member";
  if (score >= 40) return "Building Trust";
  if (score >= 20) return "Low Trust";
  return "Not Trusted";
}

// ---------- Trust score: from ProfileResponseDTO.trustScore/trustLabel ----------
// FIX: the backend never actually sent trustScore or trustLabel before
// (ProfileResponseDTO had neither field), so this always fell straight
// through both checks to the hardcoded { score: 20, label: "New User..." }
// — the score wasn't broken, it was just never being sent at all. Now
// that ProfileServiceImpl populates both from TrustScoreService, the
// real value takes priority. The reviews-array branch is kept as a
// fallback in case that's ever wired up as an alternative source, and
// the hardcoded default only fires if neither is present at all (e.g.
// the backend call failed silently or is running an older version).
//
// FIX 2: the label used to only branch on >= 60 ("Trusted Member" or
// "Building trust"), so a score of 15 and a score of 55 showed the
// exact same text — nothing distinguished scores meaningfully below
// the neutral midpoint of 50. Now uses describeTrustScore()'s five
// bands instead of a single cutoff.
function getTrustScoreData(profile) {
  if (typeof profile?.trustScore === "number") {
    return {
      score: Math.round(profile.trustScore),
      label: profile.trustLabel || describeTrustScore(profile.trustScore),
    };
  }

  const reviews = profile?.reviews || [];

  if (reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const score = Math.round((avg / 5) * 100);
    return {
      score,
      label: `${avg.toFixed(1)} ★ · ${reviews.length} review${reviews.length > 1 ? "s" : ""}`,
    };
  }

  return { score: 20, label: "New User · Building Trust" };
}

function trustScoreClass(score) {
  if (score >= 75) return "trust-high";
  if (score >= 40) return "trust-mid";
  return "trust-low";
}

function Profile() {
  const navigate = useNavigate();

  // -----------------------------------------
  // PROFILE STATE
  // -----------------------------------------
  const [profile, setProfile] = useState(null);
  // Tracks a failed fetch so the UI can show a retry option instead of
  // hanging on the spinner forever. Previously, if getProfile() ever
  // rejected (e.g. the auth token wasn't in localStorage yet right after
  // login, or a one-off network blip), the catch block only fired a toast
  // — profile stayed null and the component was stuck returning the
  // "Loading your profile..." spinner permanently. That's the
  // "Profile sometimes not displaying" bug: it wasn't gone, it was stuck.
  const [profileError, setProfileError] = useState(false);

  // -----------------------------------------
  // TOAST
  // -----------------------------------------
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // -----------------------------------------
  // MOBILE EDIT STATE
  // -----------------------------------------
  const [editingMobile, setEditingMobile] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [savingMobile, setSavingMobile] = useState(false);

  // -----------------------------------------
  // PASSWORD MODAL STATE
  // -----------------------------------------
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // -----------------------------------------
  // FILE INPUT
  // -----------------------------------------
  const fileInputRef = useRef(null);

  // -----------------------------------------
  // FETCH PROFILE
  // -----------------------------------------
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setProfileError(false);
    try {
      const data = await getProfile();
      console.log("PROFILE DATA:", data);
      setProfile(data);
      setMobileNumber(data.mobileNumber || "");
    } catch (error) {
      console.error("PROFILE FETCH ERROR:", error);
      setProfileError(true);
      showToast("Couldn't load your profile. Please try again.", "error");
    }
  };

  // -----------------------------------------
  // BACK TO PRODUCTS
  // -----------------------------------------
  const handleBackToProducts = () => {
    navigate("/StudentDashboard");
  };

  // -----------------------------------------
  // MOBILE NUMBER EDITING
  // -----------------------------------------
  const startEditingMobile = () => {
    setMobileNumber(profile.mobileNumber || "");
    setMobileError("");
    setEditingMobile(true);
  };

  const cancelEditingMobile = () => {
    setMobileNumber(profile.mobileNumber || "");
    setMobileError("");
    setEditingMobile(false);
  };

  const handleMobileUpdate = async () => {
    const trimmed = mobileNumber.trim();

    if (!trimmed) {
      setMobileError("Please enter a mobile number.");
      return;
    }
    if (!MOBILE_REGEX.test(trimmed)) {
      setMobileError("Enter a valid 10-digit mobile number.");
      return;
    }

    setMobileError("");
    setSavingMobile(true);

    try {
      const updatedProfile = await updateMobile(trimmed);
      setProfile(updatedProfile);
      setEditingMobile(false);
      showToast("Mobile number updated successfully ✅", "success");
    } catch (error) {
      console.error("MOBILE UPDATE ERROR:", error);
      const msg = error.response?.data?.message || "Failed to update mobile number.";
      setMobileError(msg);
      showToast(msg, "error");
    } finally {
      setSavingMobile(false);
    }
  };

  // -----------------------------------------
  // PROFILE IMAGE UPLOAD
  // -----------------------------------------
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // accept="image/*" on the <input> is only a UI hint — browsers still
    // let users pick "All Files", and drag/drop or some file pickers
    // ignore it entirely. A .txt (or anything) can reach this handler,
    // so the type actually has to be checked here before uploading.
    const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.type);
    const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isAllowedType || !hasAllowedExtension) {
      showToast("Please upload a JPG, PNG, or WEBP image.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast("Image is too large. Please pick a file under 5MB.", "error");
      e.target.value = "";
      return;
    }

    try {
      const updatedProfile = await updateProfileImage(file);
      setProfile(updatedProfile);
      showToast("Profile photo updated ✅", "success");
    } catch (error) {
      console.error("IMAGE UPLOAD ERROR:", error);
      showToast(error.response?.data?.message || "Image upload failed.", "error");
    } finally {
      e.target.value = "";
    }
  };

  // -----------------------------------------
  // PASSWORD MODAL HELPERS
  // -----------------------------------------
  const openPasswordModal = () => {
  setPasswordData({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  setPasswordErrors({});
  setShowPasswordModal(true);
};
const closePasswordModal = () => {
  setShowPasswordModal(false);

  setPasswordData({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  setPasswordErrors({});
};

  const handlePasswordFieldChange = (field, value) => {
    setPasswordData((d) => ({ ...d, [field]: value }));
    setPasswordErrors((errs) => (errs[field] ? { ...errs, [field]: "" } : errs));
  };

 
  // ---------- Step 2: set + confirm the new password ----------
  const handleChangePassword = async () => {
  const errors = {};

  if (!passwordData.currentPassword) {
    errors.currentPassword = "Please enter your current password.";
  }

  if (!passwordData.newPassword) {
    errors.newPassword = "Please enter a new password.";
  } else if (passwordData.newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!passwordData.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (
    passwordData.newPassword !== passwordData.confirmPassword
  ) {
    errors.confirmPassword = "Passwords do not match.";
  }

  setPasswordErrors(errors);

  if (Object.keys(errors).length > 0) return;

  try {
    await changePassword(
      passwordData.currentPassword,
      passwordData.newPassword,
      passwordData.confirmPassword
    );

    closePasswordModal();

    showToast("Password changed successfully 🔒", "success");
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      error.response?.data ||
      "Current password is incorrect.";

    setPasswordErrors({
      form: msg,
    });

    showToast(msg, "error");
  }
};

  // -----------------------------------------
  // LOGOUT
  // -----------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    window.location.href = "/auth";
  };

  // -----------------------------------------
  // ERROR (fetch failed — give the user a way out instead of an
  // infinite spinner)
  // -----------------------------------------
  if (profileError) {
    return (
      <div className="profile-loading">
        <FaExclamationCircle />
        <p>Couldn't load your profile.</p>
        <button className="account-btn" onClick={fetchProfile}>
          Retry
        </button>
      </div>
    );
  }

  // -----------------------------------------
  // LOADING
  // -----------------------------------------
  if (!profile) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  const trust = getTrustScoreData(profile);

  // -----------------------------------------
  // RETURN
  // -----------------------------------------
  return (
    <div className="profile-bg" style={{ backgroundImage: `url(${AuthImg})` }}>
      <button className="profile-back-link" onClick={handleBackToProducts}>
        <FaArrowLeft /> Back to Products
      </button>

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className={`profile-toast ${toast.type === "error" ? "profile-toast-error" : ""}`}>
          {toast.type === "error" ? <FaExclamationCircle /> : <FaCheckCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      <section className="profile-page">
        <div className="profile-shell">
          <div className="profile-grid">
            {/* =========================================
                LEFT PROFILE CARD
            ========================================= */}
            <div className="profile-card">
              {/* PROFILE IMAGE */}
              <div className="profile-image">
                <img
                  src={
                    profile.profileImage
                      ? `http://localhost:8081/uploads/profile-images/${profile.profileImage}`
                      : ProfileImg
                  }
                  alt="Profile"
                />

                <button className="camera-btn" onClick={() => fileInputRef.current.click()}>
                  <FaCamera />
                </button>

                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
              </div>

              <h3>{profile.fullName}</h3>

              <p className="verified">
                <FaCheckCircle />
                Verified Student
              </p>

              {/* TRUST SCORE — moves up/down with the student's reviews */}
              <div className="trust-box">
                <h5>Trust Score</h5>

                <div className="trust-bar">
                  <div
                    className={`trust-bar-fill ${trustScoreClass(trust.score)}`}
                    style={{ width: `${Math.min(100, Math.max(0, trust.score))}%` }}
                  ></div>
                </div>

                <span>{trust.label}</span>
              </div>
            </div>

            {/* =========================================
                RIGHT SIDE
            ========================================= */}
            <div className="profile-right">
              {/* =========================================
                  PERSONAL INFORMATION
              ========================================= */}
              <div className="info-card">
                <div className="card-header-custom">
                  <h3>Personal Information</h3>
                </div>

                <div className="info-groups">
                  {/* IDENTITY */}
                  <div className="info-group">
                    <h4 className="info-group-title">Identity</h4>

                    <div className="info-group-grid">
                      <div className="field">
                        <div className="field-label">
                          <FaIdCard />
                          Student ID
                        </div>
                        <div className="field-value">{profile.studentId}</div>
                      </div>

                      <div className="field">
                        <div className="field-label">
                          <FaUser />
                          Full Name
                        </div>
                        <div className="field-value">{profile.fullName}</div>
                      </div>

                      <div className="field">
                        <div className="field-label">
                          <FaUniversity />
                          Register Number
                        </div>
                        <div className="field-value">{profile.registerNumber}</div>
                      </div>

                      <div className="field">
                        <div className="field-label">
                          <FaCheckCircle />
                          Account Status
                        </div>
                        <div className="field-value field-value--status">Active</div>
                      </div>
                    </div>
                  </div>

                  {/* ACADEMIC */}
                  <div className="info-group">
                    <h4 className="info-group-title">Academic</h4>

                    <div className="info-group-grid">
                      <div className="field">
                        <div className="field-label">
                          <FaGraduationCap />
                          Department
                        </div>
                        <div className="field-value">{profile.department}</div>
                      </div>

                      <div className="field">
                        <div className="field-label">
                          <FaGraduationCap />
                          Year
                        </div>
                        <div className="field-value">{profile.year}</div>
                      </div>
                    </div>
                  </div>

                  {/* CONTACT */}
                  <div className="info-group">
                    <h4 className="info-group-title">Contact</h4>

                    <div className="info-group-grid">
                      <div className="field">
                        <div className="field-label">
                          <FaEnvelope />
                          Email
                        </div>
                        <div className="field-value">{profile.collegeEmail}</div>
                      </div>

                      <div className="field">
                        <div className="field-label">
                          <FaPhoneAlt />
                          Mobile Number
                        </div>

                        {editingMobile ? (
                          <div className="mobile-edit">
                            <div className="mobile-edit-row">
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={mobileNumber}
                                onChange={(e) => {
                                  setMobileNumber(e.target.value);
                                  if (mobileError) setMobileError("");
                                }}
                                placeholder="10-digit mobile number"
                                className={mobileError ? "input-error" : ""}
                                autoFocus
                              />
                              <button
                                className="mobile-save-btn"
                                onClick={handleMobileUpdate}
                                disabled={savingMobile}
                              >
                                {savingMobile ? "Saving..." : "Save"}
                              </button>
                              <button className="mobile-cancel-btn" onClick={cancelEditingMobile}>
                                Cancel
                              </button>
                            </div>
                            {mobileError && <span className="field-error-msg">{mobileError}</span>}
                          </div>
                        ) : (
                          <div className="field-value field-value--editable">
                            {profile.mobileNumber}
                            <button className="field-inline-edit" onClick={startEditingMobile} title="Edit mobile number">
                              <FaEdit />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================================
                  ACCOUNT
              ========================================= */}
              <div className="account-card">
                <h3>Account</h3>

                <div className="account-actions">
                  <button className="account-btn" onClick={openPasswordModal}>
                    <FaLock />
                    Change Password
                  </button>

                  <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              </div>

              
                  
              {showPasswordModal && (
  <div
    className="password-overlay"
    onClick={closePasswordModal}
  >
    <div
      className="password-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="password-close"
        onClick={closePasswordModal}
      >
        <FaTimes />
      </button>

      <div className="password-icon">
        <FaLock />
      </div>

      <h2>Change Password</h2>

      <p>
        Enter your current password and choose a new one.
      </p>

      <div className="password-input-group">
        <FaEnvelope />
        <input
          type="email"
          value={profile.collegeEmail}
          readOnly
        />
      </div>

      <div className="password-input-group">
        <FaLock />
        <input
          type="password"
          placeholder="Current Password"
          value={passwordData.currentPassword}
          onChange={(e) =>
            handlePasswordFieldChange(
              "currentPassword",
              e.target.value
            )
          }
          className={
            passwordErrors.currentPassword
              ? "input-error"
              : ""
          }
        />
      </div>

      {passwordErrors.currentPassword && (
        <span className="field-error-msg">
          {passwordErrors.currentPassword}
        </span>
      )}

      <div className="password-input-group">
        <FaLock />
        <input
          type="password"
          placeholder="New Password"
          value={passwordData.newPassword}
          onChange={(e) =>
            handlePasswordFieldChange(
              "newPassword",
              e.target.value
            )
          }
          className={
            passwordErrors.newPassword
              ? "input-error"
              : ""
          }
        />
      </div>

      {passwordErrors.newPassword && (
        <span className="field-error-msg">
          {passwordErrors.newPassword}
        </span>
      )}

      <div className="password-input-group">
        <FaLock />
        <input
          type="password"
          placeholder="Confirm Password"
          value={passwordData.confirmPassword}
          onChange={(e) =>
            handlePasswordFieldChange(
              "confirmPassword",
              e.target.value
            )
          }
          className={
            passwordErrors.confirmPassword
              ? "input-error"
              : ""
          }
        />
      </div>

      {passwordErrors.confirmPassword && (
        <span className="field-error-msg">
          {passwordErrors.confirmPassword}
        </span>
      )}

      {passwordErrors.form && (
        <span className="field-error-msg password-form-error">
          {passwordErrors.form}
        </span>
      )}

      <button
        className="change-password-btn"
        onClick={handleChangePassword}
      >
        Change Password
      </button>
    </div>
  </div>
)}
              
                        
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Profile;