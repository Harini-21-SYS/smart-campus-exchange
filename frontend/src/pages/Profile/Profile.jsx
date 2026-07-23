import "./Profile.css";
import ProfileImg from "../../assets/profile.png";
import AuthImg from "../../assets/auth.jpg";

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
  return (
   <div
  className="profile-bg"
  style={{
    backgroundImage: `url(${AuthImg})`
  }}
>
    <section className="profile-page">
      <div className="profile-shell">
        <div className="profile-grid">
          {/* LEFT CARD */}
          <div className="profile-card">
            <div className="profile-image">
              <img src={ProfileImg} alt="Profile" />

              <button className="camera-btn">
                <FaCamera />
              </button>
            </div>

            <h3>Harini B R</h3>

            <p className="verified">
              <FaCheckCircle />
              Verified Student
            </p>

            <div className="trust-box">
              <h5>Trust Score</h5>
              <div className="trust-bar">
                <div className="trust-bar-fill"></div>
              </div>
              <span>New User · Building trust</span>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="profile-right">
            {/* INFO CARD — fields are grouped and shown as compact
                label/value pairs instead of one bordered box per
                field, which is what was eating up the vertical space. */}
            <div className="info-card">
              <div className="card-header-custom">
                <h3>Personal Information</h3>

                <button className="edit-btn">
                  <FaEdit />
                  Edit Profile
                </button>
              </div>

              <div className="info-groups">
                <div className="info-group">
                  <h4 className="info-group-title">Identity</h4>
                  <div className="info-group-grid">
                    <div className="field">
                      <div className="field-label"><FaIdCard />Student ID</div>
                      <div className="field-value">SCE1001</div>
                    </div>

                    <div className="field">
                      <div className="field-label"><FaUser />Full Name</div>
                      <div className="field-value">Harini B R</div>
                    </div>

                    <div className="field">
                      <div className="field-label"><FaUniversity />Register Number</div>
                      <div className="field-value">22BCS001</div>
                    </div>

                    <div className="field">
                      <div className="field-label"><FaCheckCircle />Account Status</div>
                      <div className="field-value field-value--status">Active</div>
                    </div>
                  </div>
                </div>

                <div className="info-group">
                  <h4 className="info-group-title">Academic</h4>
                  <div className="info-group-grid">
                    <div className="field">
                      <div className="field-label"><FaGraduationCap />Department</div>
                      <div className="field-value">Computer Science</div>
                    </div>

                    <div className="field">
                      <div className="field-label"><FaGraduationCap />Year</div>
                      <div className="field-value">III Year</div>
                    </div>
                  </div>
                </div>

                <div className="info-group">
                  <h4 className="info-group-title">Contact</h4>
                  <div className="info-group-grid">
                    <div className="field">
                      <div className="field-label"><FaEnvelope />Email</div>
                      <div className="field-value">harini@tcarts.in</div>
                    </div>

                    <div className="field">
                      <div className="field-label"><FaPhoneAlt />Mobile Number</div>
                      <div className="field-value">9876543210</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACCOUNT — compact horizontal row, not its own tall card */}
            <div className="account-card">
              <h3>Account</h3>

              <div className="account-actions">
                <button className="account-btn">
                  <FaLock />
                  Change Password
                </button>

                <button className="logout-btn">
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}

export default Profile;