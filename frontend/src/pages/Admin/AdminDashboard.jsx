// AdminDashboard.jsx
//
// Matches StudentDashboard's visual language exactly: same navbar
// (logo, pill nav tabs, mobile dropdown), same fonts/sizes, same
// button/modal/toast/empty-state classes (all pulled from
// AdminDashboard.css, which reuses StudentDashboard.css's --dash-*
// tokens and shared component classes). No sidebar — admin navigation
// lives entirely in the navbar.
//
// Sections:
//   - Dashboard: total students / total products / blocked students
//     stat cards, searchable & filterable student list (admin's own
//     account excluded), block/unblock, click a student -> detail view.
//   - Products: searchable & filterable product list, click a product
//     -> detail view with image carousel, delete from the detail view.
//   - Requests / Complaints: placeholders — not enough spec yet.
//   - Profile: admin's own info (reuses profileService.getProfile(),
//     since the admin account is a Student row with role=ADMIN) + logout.
//
// Backend-connected via services/adminApi.js (axios instance with
// bearer-token interceptor) — no manual auth headers needed here.

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApi } from "../../services/adminApi"; // adjust path to wherever adminApi.js lives
import { getProfile } from "../../services/profileService"; // adjust path — same service the student Profile page uses
import "./AdminDashboard.css";
import {
  FaUsers,
  FaBoxOpen,
  FaSearch,
  FaUser,
  FaBan,
  FaCheckCircle,
  FaTrashAlt,
  FaArrowLeft,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaExclamationCircle,
  FaEnvelope,
  FaPhone,
  FaIdBadge,
  FaBuilding,
  FaStar,
  FaExchangeAlt,
} from "react-icons/fa";

/* =========================================================
   CONFIG
   ========================================================= */

// Only used for resolving relative image paths returned by the backend.
// Auth is handled by adminApi.js's axios interceptor.
const API_ORIGIN = "http://localhost:8081";

// Profile images are stored as a bare filename (confirmed from the
// student Profile.jsx, which builds
// `http://localhost:8081/uploads/profile-images/${profile.profileImage}`)
// — NOT a root-relative path. This helper handles that filename case
// but also tolerates a full URL or an already-root-relative path
// defensively, in case that ever changes.
function buildProfileImageUrl(value) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/uploads/profile-images/${value}`;
}

/* =========================================================
   MAPPERS — defensive field-name fallbacks, same pattern used
   in dashboardUtils.js's mapBackendProduct. Console-warns once
   per session if a key mapping never resolves.
   ========================================================= */

let warnedStudentBlockField = false;
let warnedStudentIdField = false;

function mapAdminStudent(raw) {
  const id = raw.studentId ?? raw.id;
  if (id === undefined && !warnedStudentIdField) {
    warnedStudentIdField = true;
    console.warn("mapAdminStudent: couldn't find studentId/id on student object", raw);
  }

  let blocked;
  if (raw.accountEnabled !== undefined) {
    blocked = raw.accountEnabled === false;
  } else if (raw.blocked !== undefined) {
    blocked = Boolean(raw.blocked);
  } else if (raw.status !== undefined) {
    blocked = String(raw.status).toUpperCase() === "BLOCKED";
  } else if (raw.active !== undefined) {
    blocked = raw.active === false;
  } else {
    blocked = false;
    if (!warnedStudentBlockField) {
      warnedStudentBlockField = true;
      console.warn(
        "mapAdminStudent: no recognizable blocked/accountEnabled/status/active field found — defaulting everyone to 'not blocked'. Raw student object:",
        raw
      );
    }
  }

  return {
    id,
    fullName: raw.fullName || raw.name || "Unknown student",
    email: raw.collegeEmail || raw.email || "",
    registerNumber: raw.registerNumber || "",
    department: raw.department || "",
    mobileNumber: raw.mobileNumber || raw.phone || "",
    profileImage: buildProfileImageUrl(raw.profileImage),
    createdAt: raw.createdAt || null,
    role: raw.role || "",
    blocked,
  };
}

function mapAdminProduct(raw) {
  const images = (raw.images || [])
    .map((img) => ({
      imageUrl: img.imageUrl ? `${API_ORIGIN}${img.imageUrl}` : null,
      primary: img.primary,
    }))
    .filter((img) => img.imageUrl);

  const primaryImg = images.find((img) => img.primary) || images[0] || null;

  return {
    id: raw.productId,
    ownerId: raw.ownerId,
    title: raw.title || "Untitled listing",
    category: raw.category || "",
    type: raw.type || "",
    price: raw.price ?? 0,
    condition: raw.condition || "",
    status: raw.status || "UNKNOWN",
    description: raw.description || "",
    imageUrl: primaryImg?.imageUrl || null,
    images, // full list, used by the product-detail carousel
    sellerName: raw.ownerName || "Unknown student",
    sellerDepartment: raw.ownerDepartment || "",
    sellerAvatar: buildProfileImageUrl(raw.ownerProfileImage),
    sellerTrustScore: null, // not yet supported by backend — AdminProductResponse has no trustScore field
    createdAt: raw.createdAt || null,
  };
}

/* Same visual language as the student app: gold = Sell, green =
   Exchange, blue = Donate. */
const TYPE_BADGE_CLASS = {
  Sell: "adm-badge-sell",
  Exchange: "adm-badge-exchange",
  Donate: "adm-badge-donate",
};

/* =========================================================
   SMALL SHARED PIECES
   ========================================================= */

function Avatar({ src, alt, size = 40, fallbackIcon: Icon = FaUser }) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;
  return (
    <span className="adm-avatar" style={{ width: size, height: size }}>
      {show ? <img src={src} alt={alt || ""} onError={() => setFailed(true)} /> : <Icon />}
    </span>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="adm-empty">
      <div className="adm-empty-icon">
        <FaExclamationCircle />
      </div>
      {title && <h3>{title}</h3>}
      <p>{message}</p>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, danger, onCancel, onConfirm }) {
  return (
    <div className="adm-modal-overlay" onClick={onCancel}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="adm-modal-desc">{message}</p>
        <div className="adm-confirm-btn-row">
          <button className="adm-btn adm-btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`adm-btn ${danger ? "adm-btn-danger-solid" : "adm-btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`adm-toast ${toast.type === "error" ? "adm-toast-error" : ""}`}>
      {toast.type === "error" ? <FaExclamationCircle /> : <FaCheckCircle />}
      <span>{toast.message}</span>
    </div>
  );
}

/* =========================================================
   NAVBAR — same markup/classes as the student navbar
   (adm-navbar / adm-logo / adm-nav-links / adm-nav-toggle)
   so the two pages look like one product.
   ========================================================= */

const NAV_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "requests", label: "Requests" },
  { id: "complaints", label: "Complaints" },
  { id: "profile", label: "Profile" },
];

function AdminNavbar({ activeTab, onTabClick, navOpen, onNavToggle }) {
  return (
    <header className="adm-navbar">
      <div className="adm-logo">
        <span className="adm-logo-icon">
          <FaExchangeAlt />
        </span>
        Campus <span>Xchange</span>
      </div>

      <nav className={`adm-nav-links ${navOpen ? "adm-nav-open" : ""}`}>
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => onTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <button className="adm-nav-toggle" onClick={onNavToggle} aria-label="Toggle menu">
        {navOpen ? <FaTimes /> : <FaBars />}
      </button>
    </header>
  );
}

/* =========================================================
   DASHBOARD (stats + student list)
   ========================================================= */

const STUDENT_FILTERS = [
  { id: "all", label: "All Students" },
  { id: "active", label: "Active" },
  { id: "blocked", label: "Blocked" },
];

function DashboardSection({
  students,
  productsCount,
  studentSearch,
  onSearchChange,
  studentFilter,
  onFilterChange,
  onOpenStudent,
  onToggleBlock,
}) {
  const filtered = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    return students.filter((s) => {
      const matchesFilter =
        studentFilter === "all" || (studentFilter === "blocked" ? s.blocked : !s.blocked);
      if (!matchesFilter) return false;
      if (!term) return true;
      return (
        s.fullName.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.registerNumber.toLowerCase().includes(term) ||
        s.department.toLowerCase().includes(term)
      );
    });
  }, [students, studentSearch, studentFilter]);

  const blockedCount = students.filter((s) => s.blocked).length;

  return (
    <div className="adm-section">
      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <div className="adm-stat-icon adm-stat-icon-students">
            <FaUsers />
          </div>
          <div>
            <div className="adm-stat-value">{students.length}</div>
            <div className="adm-stat-label">Total Students</div>
          </div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon adm-stat-icon-products">
            <FaBoxOpen />
          </div>
          <div>
            <div className="adm-stat-value">{productsCount}</div>
            <div className="adm-stat-label">Total Products</div>
          </div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon adm-stat-icon-blocked">
            <FaBan />
          </div>
          <div>
            <div className="adm-stat-value">{blockedCount}</div>
            <div className="adm-stat-label">Blocked Students</div>
          </div>
        </div>
      </div>

      <div className="adm-section-header">
        <h1>Students</h1>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, email, register no, department"
            value={studentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="adm-filter-pills">
          {STUDENT_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`adm-pill ${studentFilter === f.id ? "adm-pill-active" : ""}`}
              onClick={() => onFilterChange(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No students match your search/filter." />
      ) : (
        <div className="adm-student-list">
          <div className="adm-student-row adm-student-row-head">
            <span>Student</span>
            <span>Register No</span>
            <span>Department</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {filtered.map((s) => (
            <div key={s.id} className="adm-student-row">
              <button className="adm-student-identity" onClick={() => onOpenStudent(s)}>
                <Avatar src={s.profileImage} alt={s.fullName} />
                <span className="adm-student-name-block">
                  <strong>{s.fullName}</strong>
                  <span className="adm-student-email">{s.email}</span>
                </span>
              </button>

              <span className="adm-cell-label" data-label="Register No">
                {s.registerNumber || "—"}
              </span>
              <span className="adm-cell-label" data-label="Department">
                {s.department || "—"}
              </span>

              <span className="adm-cell-label" data-label="Status">
                <span className={`adm-status-badge ${s.blocked ? "adm-status-blocked" : "adm-status-active"}`}>
                  {s.blocked ? "Blocked" : "Active"}
                </span>
              </span>

              <span className="adm-cell-label" data-label="Action">
                <button
                  className={`adm-btn adm-btn-sm ${s.blocked ? "adm-btn-outline" : "adm-btn-danger"}`}
                  onClick={() => onToggleBlock(s)}
                >
                  {s.blocked ? (
                    <>
                      <FaCheckCircle /> Unblock
                    </>
                  ) : (
                    <>
                      <FaBan /> Block
                    </>
                  )}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STUDENT DETAIL VIEW
   ========================================================= */

function StudentDetailView({ student, onBack, onToggleBlock }) {
  return (
    <div className="adm-section">
      <button className="adm-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="adm-detail-card">
        <div className="adm-detail-header">
          <Avatar src={student.profileImage} alt={student.fullName} size={84} />
          <div>
            <h1 className="adm-detail-name">{student.fullName}</h1>
            <span className={`adm-status-badge ${student.blocked ? "adm-status-blocked" : "adm-status-active"}`}>
              {student.blocked ? "Blocked" : "Active"}
            </span>
          </div>
        </div>

        <div className="adm-detail-grid">
          <div className="adm-detail-field">
            <FaEnvelope />
            <div>
              <span className="adm-detail-field-label">Email</span>
              <span>{student.email || "—"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaIdBadge />
            <div>
              <span className="adm-detail-field-label">Register Number</span>
              <span>{student.registerNumber || "—"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaBuilding />
            <div>
              <span className="adm-detail-field-label">Department</span>
              <span>{student.department || "—"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaPhone />
            <div>
              <span className="adm-detail-field-label">Mobile Number</span>
              <span>{student.mobileNumber || "—"}</span>
            </div>
          </div>
        </div>

        <button
          className={`adm-btn ${student.blocked ? "adm-btn-outline" : "adm-btn-danger-solid"}`}
          style={{ width: "fit-content", padding: "10px 24px", marginTop: 12 }}
          onClick={() => onToggleBlock(student)}
        >
          {student.blocked ? (
            <>
              <FaCheckCircle /> Unblock Student
            </>
          ) : (
            <>
              <FaBan /> Block Student
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PRODUCTS SECTION
   ========================================================= */

function ProductsSection({
  products,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  typeFilter,
  onTypeChange,
  categories,
  types,
  onOpenProduct,
}) {
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (typeFilter !== "All" && p.type !== typeFilter) return false;
      if (!term) return true;
      return (
        p.title.toLowerCase().includes(term) ||
        p.sellerName.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    });
  }, [products, search, categoryFilter, typeFilter]);

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Products</h1>
        <span className="adm-section-header-count">{products.length} total</span>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by product name, seller, category"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={typeFilter} onChange={(e) => onTypeChange(e.target.value)}>
          <option value="All">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No products match your search/filter." />
      ) : (
        <div className="adm-product-grid">
          {filtered.map((p) => (
            <button key={p.id} className="adm-product-card" onClick={() => onOpenProduct(p)}>
              <div className="adm-product-image">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.title} /> : <FaBoxOpen />}
              </div>

              {p.type && (
                <span className={`adm-type-badge ${TYPE_BADGE_CLASS[p.type] || ""}`}>{p.type}</span>
              )}

              <h4 className="adm-product-title">{p.title}</h4>
              <span className="adm-product-category">{p.category}</span>
              <span className="adm-product-price">
                {p.type === "Sell" ? `₹ ${p.price}` : "Free"}
              </span>

              <div className="adm-product-seller">
                <Avatar src={p.sellerAvatar} alt={p.sellerName} size={26} />
                <span className="adm-product-seller-name">{p.sellerName}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PRODUCT DETAIL VIEW — with image carousel
   ========================================================= */

function ProductDetailView({ product, onBack, onDelete }) {
  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [{ imageUrl: product.imageUrl }]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);

  const goPrev = () => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const goNext = () => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="adm-section">
      <button className="adm-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="adm-detail-grid-2col">
        <div style={{ maxWidth: 320, margin: "0 auto" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 280,
              borderRadius: 8,
              overflow: "hidden",
              background: "#f2f2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {images.length > 0 ? (
              <>
                <img
                  src={images[activeIndex].imageUrl}
                  alt={product.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={goPrev}
                      aria-label="Previous image"
                      className="adm-btn adm-btn-sm adm-btn-outline"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: 8,
                        transform: "translateY(-50%)",
                        padding: "4px 10px",
                        zIndex: 2,
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={goNext}
                      aria-label="Next image"
                      className="adm-btn adm-btn-sm adm-btn-outline"
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 8,
                        transform: "translateY(-50%)",
                        padding: "4px 10px",
                        zIndex: 2,
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            ) : (
              <FaBoxOpen className="adm-detail-image-placeholder" />
            )}
          </div>

          {images.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
              {images.map((_, i) => (
                <span
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: i === activeIndex ? "#333" : "#ccc",
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="adm-detail-card">
          {product.type && (
            <span className={`adm-type-badge ${TYPE_BADGE_CLASS[product.type] || ""}`}>
              {product.type}
            </span>
          )}

          <h1 className="adm-detail-name">{product.title}</h1>
          <p className="adm-detail-meta">
            {product.category} &middot; {product.condition}
          </p>
          <p className="adm-detail-price">
            {product.type === "Sell" ? `₹ ${product.price}` : "Free"}
          </p>
          <p className="adm-detail-desc">{product.description}</p>

          <div className="adm-seller-card">
            <Avatar src={product.sellerAvatar} alt={product.sellerName} size={48} />
            <div className="adm-seller-text">
              <strong>{product.sellerName}</strong>
              <span>{product.sellerDepartment || "Department not available"}</span>
            </div>
            {product.sellerTrustScore !== null && (
              <span className="adm-trust-badge">
                <FaStar /> {product.sellerTrustScore}
              </span>
            )}
          </div>

          <span className="adm-status-badge adm-status-neutral">Status: {product.status}</span>

          <button
            className="adm-btn adm-btn-danger-solid adm-btn-block"
            onClick={() => onDelete(product)}
          >
            <FaTrashAlt /> Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PLACEHOLDER SECTION
   ========================================================= */

function PlaceholderSection({ title }) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>{title}</h1>
      </div>
      <EmptyState message={`${title} management isn't built yet — tell me what admin needs to see/do here.`} />
    </div>
  );
}

/* =========================================================
   ADMIN PROFILE SECTION — fetches the admin's own record via
   the same profileService.getProfile() the student Profile
   page uses (the admin account is a Student row, role=ADMIN),
   laid out with the Identity/Academic/Contact grouping from
   that page, restyled with adm-* classes. Logout only — no
   Change Password here since that wasn't asked for.
   ========================================================= */

function AdminProfileSection({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        console.error("Failed to load admin profile:", err);
        if (!cancelled) setError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="adm-section">
        <div className="adm-section-header">
          <h1>Profile</h1>
        </div>
        <EmptyState message="Loading profile…" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="adm-section">
        <div className="adm-section-header">
          <h1>Profile</h1>
        </div>
        <EmptyState message="Couldn't load profile." />
      </div>
    );
  }

  const avatarSrc = buildProfileImageUrl(profile.profileImage);

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Profile</h1>
      </div>

      <div className="adm-detail-card">
        <div className="adm-detail-header">
          <Avatar src={avatarSrc} alt={profile.fullName} size={84} />
          <div>
            <h1 className="adm-detail-name">{profile.fullName || "Admin"}</h1>
            <span className="adm-status-badge adm-status-active">Verified Admin</span>
          </div>
        </div>

        <div className="adm-detail-grid">
          <div className="adm-detail-field">
            <FaIdBadge />
            <div>
              <span className="adm-detail-field-label">Student ID</span>
              <span>{profile.studentId ?? "—"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaIdBadge />
            <div>
              <span className="adm-detail-field-label">Register Number</span>
              <span>{profile.registerNumber || "—"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaBuilding />
            <div>
              <span className="adm-detail-field-label">Department</span>
              <span>{profile.department || "—"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaEnvelope />
            <div>
              <span className="adm-detail-field-label">Email</span>
              <span>{profile.collegeEmail || "—"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaPhone />
            <div>
              <span className="adm-detail-field-label">Mobile Number</span>
              <span>{profile.mobileNumber || "—"}</span>
            </div>
          </div>
        </div>

        <button
          className="adm-btn adm-btn-danger"
          style={{ width: "fit-content", padding: "10px 24px", marginTop: 12 }}
          onClick={onLogout}
        >
          <FaSignOutAlt /> Log Out
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  const [subView, setSubView] = useState(null); // null | "studentDetail" | "productDetail"
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");

  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: "block"|"unblock"|"delete", target }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ---------- Load data ----------
  useEffect(() => {
    let cancelled = false;
    AdminApi.getStudents()
      .then((data) => {
        if (cancelled) return;
        const mapped = (data || [])
          .map(mapAdminStudent)
          .filter((s) => s.role !== "ADMIN"); // don't show admin's own account in the student list
        setStudents(mapped);
      })
      .catch((err) => {
        console.error("Failed to load students:", err);
        showToast("Couldn't load students.", "error");
      })
      .finally(() => !cancelled && setLoadingStudents(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    AdminApi.getProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts((data || []).map(mapAdminProduct));
      })
      .catch((err) => {
        console.error("Failed to load products:", err);
        showToast("Couldn't load products.", "error");
      })
      .finally(() => !cancelled && setLoadingProducts(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Derived filter option lists (from real data, not guessed enums) ----------
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );
  const types = useMemo(
    () => [...new Set(products.map((p) => p.type).filter(Boolean))].sort(),
    [products]
  );

  // ---------- Navigation ----------
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSubView(null);
    setSelectedStudent(null);
    setSelectedProduct(null);
    setNavOpen(false);
  };

  const openStudent = (student) => {
    setSelectedStudent(student);
    setSubView("studentDetail");
  };
  const closeStudent = () => {
    setSubView(null);
    setSelectedStudent(null);
  };

  const openProduct = (product) => {
    setSelectedProduct(product);
    setSubView("productDetail");
  };
  const closeProduct = () => {
    setSubView(null);
    setSelectedProduct(null);
  };

  // ---------- Block / unblock ----------
  const requestToggleBlock = (student) => {
    setConfirmAction({ type: student.blocked ? "unblock" : "block", target: student });
  };

  const confirmToggleBlock = async () => {
    const student = confirmAction.target;
    const shouldBlock = confirmAction.type === "block";
    try {
      if (shouldBlock) {
        await AdminApi.blockStudent(student.id);
      } else {
        await AdminApi.unblockStudent(student.id);
      }
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, blocked: shouldBlock } : s))
      );
      if (selectedStudent?.id === student.id) {
        setSelectedStudent((s) => ({ ...s, blocked: shouldBlock }));
      }
      showToast(shouldBlock ? `${student.fullName} has been blocked.` : `${student.fullName} has been unblocked.`);
    } catch (err) {
      console.error("Block/unblock failed:", err);
      showToast(err.response?.data?.message || "Action failed. Please try again.", "error");
    } finally {
      setConfirmAction(null);
    }
  };

  // ---------- Delete product ----------
  const requestDeleteProduct = (product) => {
    setConfirmAction({ type: "delete", target: product });
  };

  const confirmDeleteProduct = async () => {
    const product = confirmAction.target;
    try {
      await AdminApi.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.title}" has been removed.`);
      if (selectedProduct?.id === product.id) closeProduct();
    } catch (err) {
      console.error("Delete product failed:", err);
      showToast(err.response?.data?.message || "Delete failed. Please try again.", "error");
    } finally {
      setConfirmAction(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/"); // adjust to your actual admin login route if different
  };

  // ---------- Render ----------
  const renderContent = () => {
    if (subView === "studentDetail" && selectedStudent) {
      return (
        <StudentDetailView
          student={selectedStudent}
          onBack={closeStudent}
          onToggleBlock={requestToggleBlock}
        />
      );
    }

    if (subView === "productDetail" && selectedProduct) {
      return (
        <ProductDetailView
          product={selectedProduct}
          onBack={closeProduct}
          onDelete={requestDeleteProduct}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        if (loadingStudents) return <EmptyState message="Loading students…" />;
        return (
          <DashboardSection
            students={students}
            productsCount={products.length}
            studentSearch={studentSearch}
            onSearchChange={setStudentSearch}
            studentFilter={studentFilter}
            onFilterChange={setStudentFilter}
            onOpenStudent={openStudent}
            onToggleBlock={requestToggleBlock}
          />
        );
      case "products":
        if (loadingProducts) return <EmptyState message="Loading products…" />;
        return (
          <ProductsSection
            products={products}
            search={productSearch}
            onSearchChange={setProductSearch}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            categories={categories}
            types={types}
            onOpenProduct={openProduct}
          />
        );
      case "requests":
        return <PlaceholderSection title="Requests" />;
      case "complaints":
        return <PlaceholderSection title="Complaints" />;
      case "profile":
        return <AdminProfileSection onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="adm-page">
      <AdminNavbar
        activeTab={activeTab}
        onTabClick={handleTabClick}
        navOpen={navOpen}
        onNavToggle={() => setNavOpen((o) => !o)}
      />

      <main className="adm-content">{renderContent()}</main>

      {confirmAction && confirmAction.type !== "delete" && (
        <ConfirmDialog
          title={confirmAction.type === "block" ? "Block this student?" : "Unblock this student?"}
          message={
            confirmAction.type === "block"
              ? `${confirmAction.target.fullName} will lose access to Campus Xchange until unblocked.`
              : `${confirmAction.target.fullName} will regain access to Campus Xchange.`
          }
          confirmLabel={confirmAction.type === "block" ? "Block" : "Unblock"}
          danger={confirmAction.type === "block"}
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmToggleBlock}
        />
      )}

      {confirmAction && confirmAction.type === "delete" && (
        <ConfirmDialog
          title="Delete this product?"
          message={`"${confirmAction.target.title}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmDeleteProduct}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

export default AdminDashboard;