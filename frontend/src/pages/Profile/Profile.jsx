
import "./Profile.css";
import ProfileImg from "../../assets/profile.png";
import AuthImg from "../../assets/auth.jpg";

import { useEffect, useState, useRef } from "react";

import {
  getProfile,
  updateMobile,
  updateProfileImage,
  changePassword,
} from "../../services/profileService";

import {
  FaCamera,
  FaCheckCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaIdCard,
  FaUniversity,
  FaGraduationCap,
  FaUser,
  FaEdit,
  FaLock,
  FaSignOutAlt,
} from "react-icons/fa";

function Profile() {

  // -----------------------------------------
  // PROFILE STATE
  // -----------------------------------------

  const [profile, setProfile] = useState(null);

  // -----------------------------------------
  // MOBILE EDIT STATE
  // -----------------------------------------

  const [editingMobile, setEditingMobile] = useState(false);

  const [mobileNumber, setMobileNumber] = useState("");

  // -----------------------------------------
  // PASSWORD MODAL STATE
  // -----------------------------------------

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);
  const [passwordStep, setPasswordStep] = useState(1); 
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
    try {

      const data = await getProfile();

      console.log("PROFILE DATA:", data);

      setProfile(data);

      setMobileNumber(
        data.mobileNumber || ""
      );

    } catch (error) {

      console.error(
        "PROFILE FETCH ERROR:",
        error
      );

    }
  };

  // -----------------------------------------
  // UPDATE MOBILE NUMBER
  // -----------------------------------------

  const handleMobileUpdate = async () => {

    try {

      if (!mobileNumber.trim()) {
        alert("Please enter mobile number");
        return;
      }

      const updatedProfile =
        await updateMobile(mobileNumber);

      setProfile(updatedProfile);

      setEditingMobile(false);

      alert(
        "Mobile Number Updated Successfully"
      );

    } catch (error) {

      console.error(
        "MOBILE UPDATE ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to Update Mobile Number"
      );
    }
  };

  // -----------------------------------------
  // PROFILE IMAGE UPLOAD
  // -----------------------------------------

  const handleImageUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

      const updatedProfile =
        await updateProfileImage(file);

      setProfile(updatedProfile);

      alert(
        "Profile Image Updated"
      );

    } catch (error) {

      console.error(
        "IMAGE UPLOAD ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Image Upload Failed"
      );
    }
  };
// -----------------------------------------
// VERIFY CURRENT PASSWORD
// -----------------------------------------
  const handleVerifyPassword = () => {

  if (!passwordData.currentPassword) {
    alert("Please enter your current password");
    return;
  }

  setPasswordStep(2);
}; 

  // -----------------------------------------
  // CHANGE PASSWORD
  // -----------------------------------------

  const handleChangePassword = async () => {

    try {

      // Check empty fields
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {

        alert(
          "Please fill all password fields"
        );

        return;
      }

      // Check password match
      if (
        passwordData.newPassword !==
        passwordData.confirmPassword
      ) {

        alert(
          "New passwords do not match"
        );

        return;
      }

      // Call backend
      const response =
        await changePassword(
          passwordData.currentPassword,
          passwordData.newPassword,
          passwordData.confirmPassword
        );

      console.log(
        "CHANGE PASSWORD RESPONSE:",
        response
      );

      alert(response);

      // Clear fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Close modal
      setShowPasswordModal(false);

    } catch (error) {

      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to change password"
      );
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
  // LOADING
  // -----------------------------------------

  if (!profile) {
    return <h2>Loading...</h2>;
  }

  // -----------------------------------------
  // RETURN
  // -----------------------------------------

  return (

    <div
      className="profile-bg"
      style={{
        backgroundImage: `url(${AuthImg})`,
      }}
    >

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

                {/* CAMERA BUTTON */}

                <button
                  className="camera-btn"
                  onClick={() =>
                    fileInputRef.current.click()
                  }
                >
                  <FaCamera />
                </button>

                {/* HIDDEN FILE INPUT */}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{
                    display: "none",
                  }}
                  onChange={handleImageUpload}
                />

              </div>

              {/* NAME */}

              <h3>
                {profile.fullName}
              </h3>

              {/* VERIFIED */}

              <p className="verified">
                <FaCheckCircle />
                Verified Student
              </p>

              {/* TRUST SCORE */}

              <div className="trust-box">

                <h5>
                  Trust Score
                </h5>

                <div className="trust-bar">
                  <div className="trust-bar-fill"></div>
                </div>

                <span>
                  New User · Building trust
                </span>

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

                  <h3>
                    Personal Information
                  </h3>

                  {/* EDIT PROFILE */}

                  <button
                    className="edit-btn"
                    onClick={() =>
                      setEditingMobile(
                        !editingMobile
                      )
                    }
                  >
                    <FaEdit />
                    Edit Profile
                  </button>

                </div>


                <div className="info-groups">

                  {/* =====================================
                      IDENTITY
                  ===================================== */}

                  <div className="info-group">

                    <h4 className="info-group-title">
                      Identity
                    </h4>

                    <div className="info-group-grid">

                      {/* STUDENT ID */}

                      <div className="field">

                        <div className="field-label">
                          <FaIdCard />
                          Student ID
                        </div>

                        <div className="field-value">
                          {profile.studentId}
                        </div>

                      </div>


                      {/* FULL NAME */}

                      <div className="field">

                        <div className="field-label">
                          <FaUser />
                          Full Name
                        </div>

                        <div className="field-value">
                          {profile.fullName}
                        </div>

                      </div>


                      {/* REGISTER NUMBER */}

                      <div className="field">

                        <div className="field-label">
                          <FaUniversity />
                          Register Number
                        </div>

                        <div className="field-value">
                          {profile.registerNumber}
                        </div>

                      </div>


                      {/* ACCOUNT STATUS */}

                      <div className="field">

                        <div className="field-label">
                          <FaCheckCircle />
                          Account Status
                        </div>

                        <div className="field-value field-value--status">
                          Active
                        </div>

                      </div>

                    </div>

                  </div>


                  {/* =====================================
                      ACADEMIC
                  ===================================== */}

                  <div className="info-group">

                    <h4 className="info-group-title">
                      Academic
                    </h4>

                    <div className="info-group-grid">

                      {/* DEPARTMENT */}

                      <div className="field">

                        <div className="field-label">
                          <FaGraduationCap />
                          Department
                        </div>

                        <div className="field-value">
                          {profile.department}
                        </div>

                      </div>


                      {/* YEAR */}

                      <div className="field">

                        <div className="field-label">
                          <FaGraduationCap />
                          Year
                        </div>

                        <div className="field-value">
                          {profile.year}
                        </div>

                      </div>

                    </div>

                  </div>


                  {/* =====================================
                      CONTACT
                  ===================================== */}

                  <div className="info-group">

                    <h4 className="info-group-title">
                      Contact
                    </h4>

                    <div className="info-group-grid">

                      {/* EMAIL */}

                      <div className="field">

                        <div className="field-label">
                          <FaEnvelope />
                          Email
                        </div>

                        <div className="field-value">
                          {profile.collegeEmail}
                        </div>

                      </div>


                      {/* MOBILE */}

                      <div className="field">

                        <div className="field-label">
                          <FaPhoneAlt />
                          Mobile Number
                        </div>

                        {editingMobile ? (

                          <div className="mobile-edit">

                            <input
                              type="text"
                              value={mobileNumber}
                              onChange={(e) =>
                                setMobileNumber(
                                  e.target.value
                                )
                              }
                            />

                            <button
                              onClick={
                                handleMobileUpdate
                              }
                            >
                              Save
                            </button>

                          </div>

                        ) : (

                          <div className="field-value">
                            {profile.mobileNumber}
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

                <h3>
                  Account
                </h3>

                <div className="account-actions">

                  {/* CHANGE PASSWORD */}

   <button
  className="account-btn"
  onClick={() => {
    setPasswordStep(1);

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowPasswordModal(true);
  }}
>
  <FaLock />
  Change Password
</button>


                  {/* LOGOUT */}

                  <button
                    className="logout-btn"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>

                </div>

              </div>


  {/* =========================================
    CHANGE PASSWORD MODAL
========================================= */}

{showPasswordModal && (

  <div className="password-overlay">

    <div className="password-modal">

      {/* CLOSE BUTTON */}

      <button
        className="password-close"
        onClick={() => {

          setShowPasswordModal(false);

          setPasswordStep(1);

          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

        }}
      >
        ×
      </button>


      {/* PASSWORD ICON */}

      <div className="password-icon">
        <FaLock />
      </div>


      {/* =====================================
          STEP 1 - VERIFY CURRENT PASSWORD
      ===================================== */}

      {passwordStep === 1 && (

        <>

          <h2>
            Verify Your Password
          </h2>

          <p>
            Verify your identity before changing
            your password.
          </p>


          {/* REGISTERED EMAIL */}

          <div className="password-input-group">

            <FaEnvelope />

            <input
              type="email"
              value={profile.collegeEmail}
              readOnly
            />

          </div>


          {/* CURRENT PASSWORD */}

          <div className="password-input-group">

            <FaLock />

            <input
              type="password"
              placeholder="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
            />

          </div>


          {/* VERIFY BUTTON */}

          <button
            className="change-password-btn"
            onClick={handleVerifyPassword}
          >
            Verify Password
          </button>

        </>

      )}


      {/* =====================================
          STEP 2 - NEW PASSWORD
      ===================================== */}

      {passwordStep === 2 && (

        <>

          <h2>
            Set New Password
          </h2>

          <p>
            Your password has been verified.
            Enter your new password.
          </p>


          {/* REGISTERED EMAIL */}

          <div className="password-input-group">

            <FaEnvelope />

            <input
              type="email"
              value={profile.collegeEmail}
              readOnly
            />

          </div>


          {/* NEW PASSWORD */}

          <div className="password-input-group">

            <FaLock />

            <input
              type="password"
              placeholder="New Password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
            />

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="password-input-group">

            <FaLock />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
            />

          </div>


          {/* CHANGE PASSWORD */}

          <button
            className="change-password-btn"
            onClick={handleChangePassword}
          >
            Change Password
          </button>

        </>

      )}

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

