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
//   - Dashboard: stat cards (students / products / requests /
//     complaints / pending complaints / notifications), searchable &
//     filterable student list (admin's own account excluded),
//     block/unblock, click a student -> detail view.
//   - Products: searchable & filterable product list, click a product
//     -> detail view with image carousel, delete from the detail view.
//   - Requests: read-only monitoring table of every request. Admin
//     never accepts/rejects — that stays entirely with buyer/seller.
//     "View" opens a read-only detail view (buyer, seller, product,
//     type, status, pickup location/time, created date). No buttons.
//   - Complaints: table of every complaint. "View" opens the full
//     detail (complaint by/against, product, reason, description,
//     status, date) with admin actions: Mark as Resolved, Delete
//     Complaint, and — if the complaint turns out to be genuine —
//     Delete Product / Block Student, reusing the same actions from
//     Products/Dashboard.
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
  FaClipboardList,
  FaBell,
  FaCommentDots,
  FaEye,
  FaMapMarkerAlt,
  FaClock,
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

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
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

function mapAdminComplaint(raw) {
  return {
    id: raw.complaintId,
    productId: raw.productId,
    productTitle: raw.productTitle || "Unknown Product",
    productImage: resolveImageUrl(raw.productImage),
    requestId: raw.requestId,
    complaintType: raw.complaintType || "OTHER",
    description: raw.description || "",
    status: raw.status || "PENDING",
    resolutionNote: raw.resolutionNote || "",
    createdAt: raw.createdAt || null,
    resolvedAt: raw.resolvedAt || null,
    studentId: raw.studentId,
    studentName: raw.studentName || "Unknown Student",
    againstStudentId: raw.againstStudentId,
    againstStudentName: raw.againstStudentName || "Unknown Student",
  };
}

const REQUEST_TYPE_LABEL = {
  BUY: "Sell",
  EXCHANGE: "Exchange",
  DONATE: "Donate",
};

function mapAdminRequest(raw) {
  return {
    id: raw.requestId,
    productTitle: raw.productTitle || "Untitled listing",
    requestType: raw.requestType || "",
    requestTypeLabel: REQUEST_TYPE_LABEL[raw.requestType] || raw.requestType || "—",
    status: raw.status || "UNKNOWN",
    requesterName: raw.requesterName || "Unknown Student", // Buyer
    sellerName: raw.sellerName || "Unknown Seller",
    createdAt: raw.createdAt || null,
    pickupLocation: raw.pickupLocation || null,
    pickupDate: raw.pickupDate || null,
    pickupTime: raw.pickupTime || null,
  };
}

/* Same visual language as the student app: gold = Sell, green =
   Exchange, blue = Donate. */
const TYPE_BADGE_CLASS = {
  Sell: "adm-badge-sell",
  Exchange: "adm-badge-exchange",
  Donate: "adm-badge-donate",
};

const REQUEST_TYPE_BADGE_CLASS = {
  BUY: "adm-badge-sell",
  EXCHANGE: "adm-badge-exchange",
  DONATE: "adm-badge-donate",
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

// Resolve-complaint modal — status change is implicit (always ->
// RESOLVED), note is optional free text.
function ResolveComplaintModal({ complaint, onCancel, onConfirm }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(note.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={onCancel}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Resolve this complaint?</h2>
        <p className="adm-modal-desc">
          This will mark the complaint about "{complaint.productTitle}" as resolved.
        </p>
        <textarea
          className="adm-textarea"
          rows={4}
          placeholder="Add a note for the record (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="adm-confirm-btn-row" style={{ marginTop: 16 }}>
          <button className="adm-btn adm-btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button className="adm-btn adm-btn-primary" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Resolving..." : "Resolve"}
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

function AdminNavbar({ activeTab, onTabClick, navOpen, onNavToggle, pendingComplaintsCount }) {
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
            {tab.id === "complaints" && pendingComplaintsCount > 0 && (
              <span className="adm-nav-badge">{pendingComplaintsCount}</span>
            )}
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
  stats,
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
            <div className="adm-stat-value">{stats.totalProducts}</div>
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

        <div className="adm-stat-card">
          <div className="adm-stat-icon adm-stat-icon-requests">
            <FaClipboardList />
          </div>
          <div>
            <div className="adm-stat-value">{stats.totalRequests}</div>
            <div className="adm-stat-label">Total Requests</div>
          </div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon adm-stat-icon-complaints">
            <FaCommentDots />
          </div>
          <div>
            <div className="adm-stat-value">{stats.totalComplaints}</div>
            <div className="adm-stat-label">
              Total Complaints
              {stats.pendingComplaints > 0 && (
                <span className="adm-stat-sublabel"> · {stats.pendingComplaints} pending</span>
              )}
            </div>
          </div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon adm-stat-icon-notifications">
            <FaBell />
          </div>
          <div>
            <div className="adm-stat-value">{stats.totalNotifications}</div>
            <div className="adm-stat-label">Total Notifications</div>
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
   REQUESTS SECTION — read-only monitoring table
   ========================================================= */

const REQUEST_TYPE_FILTERS = [
  { id: "All", label: "All Types" },
  { id: "BUY", label: "Sell" },
  { id: "EXCHANGE", label: "Exchange" },
  { id: "DONATE", label: "Donate" },
];

function RequestsSection({ requests, search, onSearchChange, typeFilter, onTypeChange, onOpenRequest }) {
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (typeFilter !== "All" && r.requestType !== typeFilter) return false;
      if (!term) return true;
      return (
        r.productTitle.toLowerCase().includes(term) ||
        r.requesterName.toLowerCase().includes(term) ||
        r.sellerName.toLowerCase().includes(term)
      );
    });
  }, [requests, search, typeFilter]);

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Requests</h1>
        <span className="adm-section-header-count">{requests.length} total</span>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by product, buyer, seller"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="adm-filter-pills">
          {REQUEST_TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`adm-pill ${typeFilter === f.id ? "adm-pill-active" : ""}`}
              onClick={() => onTypeChange(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No requests match your search/filter." />
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Product</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td data-label="Request ID">#{r.id}</td>
                  <td data-label="Buyer">{r.requesterName}</td>
                  <td data-label="Seller">{r.sellerName}</td>
                  <td data-label="Product">{r.productTitle}</td>
                  <td data-label="Type">
                    <span className={`adm-type-badge ${REQUEST_TYPE_BADGE_CLASS[r.requestType] || ""}`}>
                      {r.requestTypeLabel}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className="adm-status-badge adm-status-neutral">{r.status || "—"}</span>
                  </td>
                  <td data-label="Date">{formatDate(r.createdAt)}</td>
                  <td data-label="Action">
                    <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => onOpenRequest(r)}>
                      <FaEye /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   REQUEST DETAIL VIEW — fully read-only, no buttons
   ========================================================= */

function RequestDetailView({ request, onBack }) {
  return (
    <div className="adm-section">
      <button className="adm-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="adm-detail-card">
        <div className="adm-detail-header">
          <div className="adm-detail-icon-badge">
            <FaClipboardList />
          </div>
          <div>
            <h1 className="adm-detail-name">Request #{request.id}</h1>
            <span className="adm-status-badge adm-status-neutral">{request.status}</span>
          </div>
        </div>

        <div className="adm-detail-grid">
          <div className="adm-detail-field">
            <FaUser />
            <div>
              <span className="adm-detail-field-label">Buyer</span>
              <span>{request.requesterName}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaUser />
            <div>
              <span className="adm-detail-field-label">Seller</span>
              <span>{request.sellerName}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaBoxOpen />
            <div>
              <span className="adm-detail-field-label">Product</span>
              <span>{request.productTitle}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaExchangeAlt />
            <div>
              <span className="adm-detail-field-label">Request Type</span>
              <span>{request.requestTypeLabel}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaMapMarkerAlt />
            <div>
              <span className="adm-detail-field-label">Pickup Location</span>
              <span>{request.pickupLocation || "Not scheduled yet"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaClock />
            <div>
              <span className="adm-detail-field-label">Pickup Time</span>
              <span>
                {request.pickupDate || request.pickupTime
                  ? `${request.pickupDate || ""} ${request.pickupTime || ""}`.trim()
                  : "Not scheduled yet"}
              </span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaIdBadge />
            <div>
              <span className="adm-detail-field-label">Created Date</span>
              <span>{formatDate(request.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPLAINTS SECTION — table
   ========================================================= */

const COMPLAINT_STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "resolved", label: "Resolved" },
];

function ComplaintsSection({
  complaints,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onOpenComplaint,
}) {
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return complaints.filter((c) => {
      const isPending = String(c.status).toUpperCase() !== "RESOLVED";
      const matchesFilter =
        statusFilter === "all" ||
        (statusFilter === "pending" ? isPending : !isPending);
      if (!matchesFilter) return false;
      if (!term) return true;
      return (
        c.productTitle.toLowerCase().includes(term) ||
        c.studentName.toLowerCase().includes(term) ||
        c.againstStudentName.toLowerCase().includes(term) ||
        c.complaintType.toLowerCase().includes(term)
      );
    });
  }, [complaints, search, statusFilter]);

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Complaints</h1>
        <span className="adm-section-header-count">{complaints.length} total</span>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by product, complainant, respondent, reason"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="adm-filter-pills">
          {COMPLAINT_STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`adm-pill ${statusFilter === f.id ? "adm-pill-active" : ""}`}
              onClick={() => onStatusChange(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No complaints match your search/filter." />
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Student</th>
                <th>Against</th>
                <th>Product</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const isPending = String(c.status).toUpperCase() !== "RESOLVED";
                return (
                  <tr key={c.id}>
                    <td data-label="Complaint ID">#{c.id}</td>
                    <td data-label="Student">{c.studentName}</td>
                    <td data-label="Against">{c.againstStudentName}</td>
                    <td data-label="Product">{c.productTitle}</td>
                    <td data-label="Reason">{c.complaintType}</td>
                    <td data-label="Status">
                      <span
                        className={`adm-status-badge ${isPending ? "adm-status-blocked" : "adm-status-active"}`}
                      >
                        {isPending ? "Pending" : "Resolved"}
                      </span>
                    </td>
                    <td data-label="Date">{formatDate(c.createdAt)}</td>
                    <td data-label="Action">
                      <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => onOpenComplaint(c)}>
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPLAINT DETAIL VIEW
   ========================================================= */

function ComplaintDetailView({
  complaint,
  productDeleted,
  studentAlreadyBlocked,
  onBack,
  onResolve,
  onDeleteComplaint,
  onDeleteProduct,
  onBlockStudent,
}) {
  const isPending = String(complaint.status).toUpperCase() !== "RESOLVED";

  return (
    <div className="adm-section">
      <button className="adm-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="adm-detail-card">
        <div className="adm-detail-header">
          <div className="adm-detail-icon-badge adm-detail-icon-badge-red">
            <FaCommentDots />
          </div>
          <div>
            <h1 className="adm-detail-name">Complaint #{complaint.id}</h1>
            <span className={`adm-status-badge ${isPending ? "adm-status-blocked" : "adm-status-active"}`}>
              {isPending ? "Pending" : "Resolved"}
            </span>
          </div>
        </div>

        <div className="adm-detail-grid">
          <div className="adm-detail-field">
            <FaUser />
            <div>
              <span className="adm-detail-field-label">Complaint By</span>
              <span>{complaint.studentName}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaUser />
            <div>
              <span className="adm-detail-field-label">Complaint Against</span>
              <span>{complaint.againstStudentName}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaBoxOpen />
            <div>
              <span className="adm-detail-field-label">Product</span>
              <span>{complaint.productTitle}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaExclamationCircle />
            <div>
              <span className="adm-detail-field-label">Reason</span>
              <span>{complaint.complaintType}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaIdBadge />
            <div>
              <span className="adm-detail-field-label">Date</span>
              <span>{formatDate(complaint.createdAt)}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="adm-detail-field-label">Description</span>
          <p className="adm-detail-desc" style={{ marginTop: 4 }}>
            {complaint.description || "No description provided."}
          </p>
        </div>

        {!isPending && complaint.resolutionNote && (
          <p className="adm-complaint-resolution-note">
            <strong>Admin note:</strong> {complaint.resolutionNote}
          </p>
        )}

        <div className="adm-section-header" style={{ marginTop: 4 }}>
          <h1 style={{ fontSize: "1.05rem" }}>Admin Actions</h1>
        </div>

        <div className="adm-admin-actions-row">
          {isPending && (
            <button className="adm-btn adm-btn-primary" onClick={() => onResolve(complaint)}>
              <FaCheckCircle /> Mark as Resolved
            </button>
          )}

          <button className="adm-btn adm-btn-danger" onClick={() => onDeleteComplaint(complaint)}>
            <FaTrashAlt /> Delete Complaint
          </button>

          <button
            className="adm-btn adm-btn-danger-solid"
            onClick={() => onDeleteProduct(complaint)}
            disabled={productDeleted}
          >
            <FaTrashAlt /> {productDeleted ? "Product Already Deleted" : "Delete Product"}
          </button>

          <button
            className="adm-btn adm-btn-danger-solid"
            onClick={() => onBlockStudent(complaint)}
            disabled={studentAlreadyBlocked}
          >
            <FaBan /> {studentAlreadyBlocked ? "Student Already Blocked" : "Block Student"}
          </button>
        </div>
      </div>
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

  // null | "studentDetail" | "productDetail" | "requestDetail" | "complaintDetail"
  const [subView, setSubView] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalRequests: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    totalNotifications: 0,
  });

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");

  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [requestSearch, setRequestSearch] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("All");

  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("all");
  const [resolveTarget, setResolveTarget] = useState(null);

  const [toast, setToast] = useState(null);
  // { type: "block"|"unblock"|"delete"|"deleteComplaint"|"deleteProductFromComplaint"|"blockStudentFromComplaint", target }
  const [confirmAction, setConfirmAction] = useState(null);

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

  useEffect(() => {
    let cancelled = false;
    AdminApi.getRequests()
      .then((data) => {
        if (cancelled) return;
        setRequests((data || []).map(mapAdminRequest));
      })
      .catch((err) => {
        console.error("Failed to load requests:", err);
        showToast("Couldn't load requests.", "error");
      })
      .finally(() => !cancelled && setLoadingRequests(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    AdminApi.getComplaints()
      .then((data) => {
        if (cancelled) return;
        setComplaints((data || []).map(mapAdminComplaint));
      })
      .catch((err) => {
        console.error("Failed to load complaints:", err);
        showToast("Couldn't load complaints.", "error");
      })
      .finally(() => !cancelled && setLoadingComplaints(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const loadDashboardStats = () => {
    AdminApi.getDashboard()
      .then((data) => {
        setDashboardStats({
          totalProducts: data.totalProducts ?? 0,
          totalRequests: data.totalRequests ?? 0,
          totalComplaints: data.totalComplaints ?? 0,
          pendingComplaints: data.pendingComplaints ?? 0,
          totalNotifications: data.totalNotifications ?? 0,
        });
      })
      .catch((err) => {
        console.error("Failed to load dashboard stats:", err);
      });
  };

  useEffect(() => {
    loadDashboardStats();
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

  const pendingComplaintsCount = useMemo(
    () => complaints.filter((c) => String(c.status).toUpperCase() !== "RESOLVED").length,
    [complaints]
  );

  // Used by the complaint detail view to disable actions already taken.
  const isProductDeleted = (productId) => !products.some((p) => p.id === productId);
  const isStudentBlocked = (studentId) => {
    const s = students.find((st) => st.id === studentId);
    return s ? s.blocked : false;
  };

  // ---------- Navigation ----------
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSubView(null);
    setSelectedStudent(null);
    setSelectedProduct(null);
    setSelectedRequest(null);
    setSelectedComplaint(null);
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

  const openRequest = (request) => {
    setSelectedRequest(request);
    setSubView("requestDetail");
  };
  const closeRequest = () => {
    setSubView(null);
    setSelectedRequest(null);
  };

  const openComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setSubView("complaintDetail");
  };
  const closeComplaint = () => {
    setSubView(null);
    setSelectedComplaint(null);
  };

  // ---------- Block / unblock (from Dashboard / Student detail) ----------
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

  // ---------- Delete product (from Products / Product detail) ----------
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

  // ---------- Resolve / delete complaint ----------
  const handleResolveComplaint = async (note) => {
    const complaint = resolveTarget;
    try {
      await AdminApi.resolveComplaint(complaint.id, note);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaint.id
            ? { ...c, status: "RESOLVED", resolutionNote: note, resolvedAt: new Date().toISOString() }
            : c
        )
      );
      if (selectedComplaint?.id === complaint.id) {
        setSelectedComplaint((c) => ({
          ...c,
          status: "RESOLVED",
          resolutionNote: note,
          resolvedAt: new Date().toISOString(),
        }));
      }
      showToast("Complaint marked as resolved.");
      setResolveTarget(null);
      loadDashboardStats();
    } catch (err) {
      console.error("Resolve complaint failed:", err);
      showToast(err.response?.data?.message || "Failed to resolve complaint.", "error");
    }
  };

  const requestDeleteComplaint = (complaint) => {
    setConfirmAction({ type: "deleteComplaint", target: complaint });
  };

  const confirmDeleteComplaint = async () => {
    const complaint = confirmAction.target;
    try {
      await AdminApi.deleteComplaint(complaint.id);
      setComplaints((prev) => prev.filter((c) => c.id !== complaint.id));
      showToast("Complaint deleted.");
      if (selectedComplaint?.id === complaint.id) closeComplaint();
      loadDashboardStats();
    } catch (err) {
      console.error("Delete complaint failed:", err);
      showToast(err.response?.data?.message || "Delete failed. Please try again.", "error");
    } finally {
      setConfirmAction(null);
    }
  };

  // ---------- Delete product / block student directly from a complaint ----------
  const requestDeleteProductFromComplaint = (complaint) => {
    setConfirmAction({
      type: "deleteProductFromComplaint",
      target: { id: complaint.productId, title: complaint.productTitle },
    });
  };

  const confirmDeleteProductFromComplaint = async () => {
    const { id, title } = confirmAction.target;
    try {
      await AdminApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`"${title}" has been removed.`);
    } catch (err) {
      console.error("Delete product failed:", err);
      showToast(err.response?.data?.message || "Delete failed. Please try again.", "error");
    } finally {
      setConfirmAction(null);
    }
  };

  const requestBlockStudentFromComplaint = (complaint) => {
    setConfirmAction({
      type: "blockStudentFromComplaint",
      target: { id: complaint.againstStudentId, fullName: complaint.againstStudentName },
    });
  };

  const confirmBlockStudentFromComplaint = async () => {
    const { id, fullName } = confirmAction.target;
    try {
      await AdminApi.blockStudent(id);
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, blocked: true } : s)));
      showToast(`${fullName} has been blocked.`);
    } catch (err) {
      console.error("Block student failed:", err);
      showToast(err.response?.data?.message || "Action failed. Please try again.", "error");
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

    if (subView === "requestDetail" && selectedRequest) {
      return <RequestDetailView request={selectedRequest} onBack={closeRequest} />;
    }

    if (subView === "complaintDetail" && selectedComplaint) {
      return (
        <ComplaintDetailView
          complaint={selectedComplaint}
          productDeleted={isProductDeleted(selectedComplaint.productId)}
          studentAlreadyBlocked={isStudentBlocked(selectedComplaint.againstStudentId)}
          onBack={closeComplaint}
          onResolve={setResolveTarget}
          onDeleteComplaint={requestDeleteComplaint}
          onDeleteProduct={requestDeleteProductFromComplaint}
          onBlockStudent={requestBlockStudentFromComplaint}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        if (loadingStudents) return <EmptyState message="Loading students…" />;
        return (
          <DashboardSection
            students={students}
            stats={dashboardStats}
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
        if (loadingRequests) return <EmptyState message="Loading requests…" />;
        return (
          <RequestsSection
            requests={requests}
            search={requestSearch}
            onSearchChange={setRequestSearch}
            typeFilter={requestTypeFilter}
            onTypeChange={setRequestTypeFilter}
            onOpenRequest={openRequest}
          />
        );
      case "complaints":
        if (loadingComplaints) return <EmptyState message="Loading complaints…" />;
        return (
          <ComplaintsSection
            complaints={complaints}
            search={complaintSearch}
            onSearchChange={setComplaintSearch}
            statusFilter={complaintStatusFilter}
            onStatusChange={setComplaintStatusFilter}
            onOpenComplaint={openComplaint}
          />
        );
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
        pendingComplaintsCount={pendingComplaintsCount}
      />

      <main className="adm-content">{renderContent()}</main>

      {confirmAction && (confirmAction.type === "block" || confirmAction.type === "unblock") && (
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

      {confirmAction && confirmAction.type === "deleteComplaint" && (
        <ConfirmDialog
          title="Delete this complaint?"
          message={`The complaint about "${confirmAction.target.productTitle}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmDeleteComplaint}
        />
      )}

      {confirmAction && confirmAction.type === "deleteProductFromComplaint" && (
        <ConfirmDialog
          title="Delete this product?"
          message={`"${confirmAction.target.title}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmDeleteProductFromComplaint}
        />
      )}

      {confirmAction && confirmAction.type === "blockStudentFromComplaint" && (
        <ConfirmDialog
          title="Block this student?"
          message={`${confirmAction.target.fullName} will lose access to Campus Xchange until unblocked.`}
          confirmLabel="Block"
          danger
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmBlockStudentFromComplaint}
        />
      )}

      {resolveTarget && (
        <ResolveComplaintModal
          complaint={resolveTarget}
          onCancel={() => setResolveTarget(null)}
          onConfirm={handleResolveComplaint}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

export default AdminDashboard;