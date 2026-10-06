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
//   - Dashboard: stat cards, searchable & filterable student list
//     (admin's own account excluded), block/unblock, click a student
//     -> detail view. Blocking now requires a reason (BlockStudentModal)
//     — the student sees it at their next login attempt.
//   - Products: searchable & filterable product list, click a product
//     -> detail view with image carousel. AVAILABLE products can be
//     BLOCKED from the detail view (the seller is notified); a blocked
//     product can be unblocked. A product can still be deleted from a
//     Complaint's detail view when a complaint turns out genuine.
//   - Requests: read-only monitoring table of every request. Admin
//     never accepts/rejects — that stays entirely with buyer/seller.
//     Sorted newest first (by createdAt).
//   - Complaints: table of every complaint. "View" opens the full
//     detail with admin actions: Mark as Resolved, Delete Complaint,
//     Delete Product / Block Student (also goes through the reason
//     modal now). Sorted newest first.
//   - Contact: messages submitted through the public Contact form.
//     Searchable, filterable (All / Unread / Read), newest first.
//   - No separate Profile tab. Admin logs out directly via a Logout
//     button in the navbar.
//
// Backend-connected via services/adminApi.js (axios instance with
// bearer-token interceptor) — no manual auth headers needed here.

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApi } from "../../services/adminApi"; // adjust path to wherever adminApi.js lives
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

// Gmail account that replies to contact messages are sent from.
// The admin must be signed in to this account in their browser; Gmail
// then opens the compose window under it (via the authuser parameter).
const SUPPORT_EMAIL = "smartcampusexchange.team@gmail.com";

// Builds a Gmail web-compose link with To / Subject / Body pre-filled.
function buildGmailReplyUrl(message) {
  const subject = `Re: ${message.subject}`;
  const body =
    `Hi ${message.name},\n\n\n\n` +
    `--- Your original message ---\n${message.message}`;

  return (
    "https://mail.google.com/mail/" +
    `?authuser=${encodeURIComponent(SUPPORT_EMAIL)}` +
    "&view=cm&fs=1" +
    `&to=${encodeURIComponent(message.email)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

// Profile images are stored as a bare filename (confirmed from the
// student Profile.jsx) — NOT a root-relative path. This helper handles
// that case but also tolerates a full URL or root-relative path.
function buildProfileImageUrl(value) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/uploads/profile-images/${value}`;
}

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_ORIGIN}${path}`;
  return `${API_ORIGIN}/${path}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// Product moderation status helpers. Only AVAILABLE products can be
// blocked; only BLOCKED ones can be unblocked. Any other status
// (e.g. SOLD / COMPLETED) shows no moderation button.
const isProductAvailable = (p) => String(p.status).toUpperCase() === "AVAILABLE";
const isProductBlocked = (p) => String(p.status).toUpperCase() === "BLOCKED";

// Newest first, by createdAt. Anything without a parseable createdAt
// sinks to the bottom instead of throwing the sort off.
function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    const validA = !isNaN(timeA);
    const validB = !isNaN(timeB);
    if (!validA && !validB) return 0;
    if (!validA) return 1;
    if (!validB) return -1;
    return timeB - timeA;
  });
}

/* =========================================================
   MAPPERS — defensive field-name fallbacks, same pattern used
   in dashboardUtils.js's mapBackendProduct. Console-warns once
   per session if a key mapping never resolves.
   ========================================================= */

let warnedStudentBlockField = false;
let warnedStudentIdField = false;
let warnedRequestSameNameField = false;

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

// Contact-form messages submitted from the public landing page.
// Backend status is "UNREAD" | "READ".
function mapAdminContact(raw) {
  return {
    id: raw.id,
    name: raw.name || "Unknown",
    email: raw.email || "",
    subject: raw.subject || "(no subject)",
    message: raw.message || "",
    status: String(raw.status || "UNREAD").toUpperCase(),
    createdAt: raw.createdAt || null,
  };
}

const REQUEST_TYPE_LABEL = {
  BUY: "Sell",
  EXCHANGE: "Exchange",
  DONATE: "Donate",
};

function mapAdminRequest(raw) {
  // NOTE ON "buyer and seller show the same name": requesterName and
  // sellerName are read from two independent backend fields below.
  // If they render identically, the raw API response itself contains
  // the same value for both — that's a backend/query issue, not a
  // frontend mapping bug. This warns once so it's easy to spot.
  if (
    !warnedRequestSameNameField &&
    raw.requesterName &&
    raw.sellerName &&
    raw.requesterName === raw.sellerName
  ) {
    warnedRequestSameNameField = true;
    console.warn(
      "mapAdminRequest: requesterName and sellerName are identical on at least one request — check the backend response for this request, this is not something the frontend mapping can fix.",
      raw
    );
  }

  return {
    id: raw.requestId ?? raw.id,
    productId: raw.productId,
    productTitle: raw.productTitle || "Untitled listing",
    productImage: resolveImageUrl(raw.productImage),
    // Only meaningful for BUY ("Sell") requests.
    productPrice: raw.productPrice ?? null,
    requestType: raw.requestType || "",
    requestTypeLabel: REQUEST_TYPE_LABEL[raw.requestType] || raw.requestType || "—",
    status: raw.status || "UNKNOWN",
    requesterName: raw.requesterName || "Unknown Student", // Buyer
    sellerName: raw.sellerName || "Unknown Seller",
    createdAt: raw.createdAt || null,
    pickupLocation: raw.pickupLocation || null,
    pickupDate: raw.pickupDate || null,
    pickupTime: raw.pickupTime || null,
    // EXCHANGE-only: the product the buyer is offering in return.
    offeredProductId: raw.offeredProductId || null,
    offeredProductTitle: raw.offeredProductTitle || null,
    offeredProductImage: resolveImageUrl(raw.offeredProductImage),
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

// Each request status gets its own color; anything not listed here
// still falls back to the neutral grey rather than breaking.
const REQUEST_STATUS_BADGE_CLASS = {
  PENDING: "adm-status-pending",
  ACCEPTED: "adm-status-accepted",
  COMPLETED: "adm-status-completed",
  REJECTED: "adm-status-blocked",
  CANCELLED: "adm-status-blocked",
};

function getRequestStatusBadgeClass(status) {
  return REQUEST_STATUS_BADGE_CLASS[String(status).toUpperCase()] || "adm-status-neutral";
}

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

// NEW: Block-student modal — a reason is required (the backend rejects
// a blank one). Used from the Dashboard student list, Student detail
// view, and Complaint detail's "Block Student" action — one modal,
// one code path, regardless of where the block was triggered from.
function BlockStudentModal({ student, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={onCancel}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Block {student.fullName}?</h2>
        <p className="adm-modal-desc">
          They'll lose access to Campus Xchange until unblocked, and will see this reason the
          next time they try to log in.
        </p>
        <textarea
          className="adm-textarea"
          rows={4}
          placeholder="Reason for blocking (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
        <div className="adm-confirm-btn-row" style={{ marginTop: 16 }}>
          <button className="adm-btn adm-btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className="adm-btn adm-btn-danger-solid"
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {submitting ? "Blocking..." : "Block"}
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
   NAVBAR — same markup/classes as the student navbar.
   No Profile tab — the admin logs out directly via a Logout
   button at the end of the nav-links row.
   ========================================================= */

const NAV_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "requests", label: "Requests" },
  { id: "complaints", label: "Complaints" },
  { id: "contact", label: "Contact" },
];

function AdminNavbar({
  activeTab,
  onTabClick,
  navOpen,
  onNavToggle,
  pendingComplaintsCount,
  unreadContactCount,
  onLogout,
}) {
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
            {tab.id === "contact" && unreadContactCount > 0 && (
              <span className="adm-nav-badge">{unreadContactCount}</span>
            )}
          </button>
        ))}

        <button className="adm-nav-logout" onClick={onLogout}>
          <FaSignOutAlt /> Logout
        </button>
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

              {isProductBlocked(p) && (
                <span className="adm-status-badge adm-status-blocked">Blocked</span>
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
   PRODUCT DETAIL VIEW — with image carousel.
   Block Product shows only for AVAILABLE products; Unblock
   Product shows only for BLOCKED ones.
   ========================================================= */

function ProductDetailView({ product, onBack, onBlockProduct, onUnblockProduct }) {
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

          <span
            className={`adm-status-badge ${
              isProductBlocked(product) ? "adm-status-blocked" : "adm-status-neutral"
            }`}
          >
            Status: {product.status}
          </span>

          {isProductAvailable(product) && (
            <button
              className="adm-btn adm-btn-danger-solid"
              style={{ width: "fit-content", padding: "10px 24px", marginTop: 12 }}
              onClick={() => onBlockProduct(product)}
            >
              <FaBan /> Block Product
            </button>
          )}

          {isProductBlocked(product) && (
            <button
              className="adm-btn adm-btn-outline"
              style={{ width: "fit-content", padding: "10px 24px", marginTop: 12 }}
              onClick={() => onUnblockProduct(product)}
            >
              <FaCheckCircle /> Unblock Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REQUESTS SECTION — read-only monitoring table, newest first.
   Table stays compact: Buyer / Seller / Product / Status only.
   Type and Date are only surfaced in the detail view (View button).
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
    // requests is already sorted newest-first by the parent; filtering
    // preserves that order since Array.filter doesn't reorder.
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

        {/* Type filter pills stay — they filter the list even though
            the Type column itself is no longer shown in the table. */}
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
                <th>Buyer</th>
                <th>Seller</th>
                <th>Product</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td data-label="Buyer">{r.requesterName}</td>
                  <td data-label="Seller">{r.sellerName}</td>
                  <td data-label="Product">{r.productTitle}</td>
                  <td data-label="Status">
                    <span className={`adm-status-badge ${getRequestStatusBadgeClass(r.status)}`}>{r.status || "—"}</span>
                  </td>
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
   REQUEST DETAIL VIEW — fully read-only, no buttons.
   For EXCHANGE requests, shows BOTH the seller's product and the
   buyer's offered product side by side, each with its own image.
   ========================================================= */

function RequestProductCard({ label, title, imageUrl }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flex: "1 1 200px",
        maxWidth: 220,
      }}
    >
      <div
        style={{
          width: "100%",
          height: 160,
          borderRadius: 8,
          overflow: "hidden",
          background: "#f2f2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title || label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <FaBoxOpen className="adm-detail-image-placeholder" />
        )}
      </div>
      <span className="adm-detail-field-label" style={{ textAlign: "center" }}>
        {label}
      </span>
      <strong style={{ textAlign: "center" }}>{title || "Not specified"}</strong>
    </div>
  );
}

function RequestDetailView({ request, onBack }) {
  const isExchange = request.requestType === "EXCHANGE";

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
            <span className={`adm-status-badge ${getRequestStatusBadgeClass(request.status)}`}>{request.status}</span>
          </div>
        </div>

        {/* Product image(s) — both sides for an exchange */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            justifyContent: isExchange ? "flex-start" : "center",
            margin: "8px 0 4px",
          }}
        >
          <RequestProductCard
            label={isExchange ? "Seller's Product" : "Product"}
            title={request.productTitle}
            imageUrl={request.productImage}
          />

          {isExchange && (
            <RequestProductCard
              label="Buyer's Product (Offered)"
              title={request.offeredProductTitle}
              imageUrl={request.offeredProductImage}
            />
          )}
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
            <FaExchangeAlt />
            <div>
              <span className="adm-detail-field-label">Request Type</span>
              <span>{request.requestTypeLabel}</span>
            </div>
          </div>
          {request.requestType === "BUY" && (
            <div className="adm-detail-field">
              <FaIdBadge />
              <div>
                <span className="adm-detail-field-label">Amount</span>
                <span>{request.productPrice != null ? `₹ ${request.productPrice}` : "—"}</span>
              </div>
            </div>
          )}
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
              <span className="adm-detail-field-label">Pickup Date</span>
              <span>{request.pickupDate || "Not scheduled yet"}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaClock />
            <div>
              <span className="adm-detail-field-label">Pickup Time</span>
              <span>{request.pickupTime || "Not scheduled yet"}</span>
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
   COMPLAINTS SECTION — table, newest first
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
    // complaints is already sorted newest-first by the parent; filtering
    // preserves that order since Array.filter doesn't reorder.
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
   CONTACT SECTION — messages from the public Contact form,
   table, newest first, with unread highlighting
   ========================================================= */

const CONTACT_STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

function ContactSection({ messages, search, onSearchChange, statusFilter, onStatusChange, onOpenMessage }) {
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    // messages is already sorted newest-first by the parent; filtering
    // preserves that order since Array.filter doesn't reorder.
    return messages.filter((m) => {
      const isUnread = m.status === "UNREAD";
      const matchesFilter =
        statusFilter === "all" || (statusFilter === "unread" ? isUnread : !isUnread);
      if (!matchesFilter) return false;
      if (!term) return true;
      return (
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.subject.toLowerCase().includes(term) ||
        m.message.toLowerCase().includes(term)
      );
    });
  }, [messages, search, statusFilter]);

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Contact Messages</h1>
        <span className="adm-section-header-count">{messages.length} total</span>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, email, subject, message"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="adm-filter-pills">
          {CONTACT_STATUS_FILTERS.map((f) => (
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
        <EmptyState message="No contact messages match your search/filter." />
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const isUnread = m.status === "UNREAD";
                return (
                  <tr key={m.id}>
                    <td data-label="Name">{isUnread ? <strong>{m.name}</strong> : m.name}</td>
                    <td data-label="Email">{m.email}</td>
                    <td data-label="Subject">{isUnread ? <strong>{m.subject}</strong> : m.subject}</td>
                    <td data-label="Status">
                      <span className={`adm-status-badge ${isUnread ? "adm-status-pending" : "adm-status-active"}`}>
                        {isUnread ? "Unread" : "Read"}
                      </span>
                    </td>
                    <td data-label="Date">{formatDate(m.createdAt)}</td>
                    <td data-label="Action">
                      <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => onOpenMessage(m)}>
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
   CONTACT DETAIL VIEW
   ========================================================= */

function ContactDetailView({ message, onBack, onMarkRead, onDelete }) {
  const isUnread = message.status === "UNREAD";
  const replyHref = buildGmailReplyUrl(message);

  return (
    <div className="adm-section">
      <button className="adm-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="adm-detail-card">
        <div className="adm-detail-header">
          <div className="adm-detail-icon-badge">
            <FaEnvelope />
          </div>
          <div>
            <h1 className="adm-detail-name">{message.subject}</h1>
            <span className={`adm-status-badge ${isUnread ? "adm-status-pending" : "adm-status-active"}`}>
              {isUnread ? "Unread" : "Read"}
            </span>
          </div>
        </div>

        <div className="adm-detail-grid">
          <div className="adm-detail-field">
            <FaUser />
            <div>
              <span className="adm-detail-field-label">From</span>
              <span>{message.name}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaEnvelope />
            <div>
              <span className="adm-detail-field-label">Email</span>
              <span>{message.email}</span>
            </div>
          </div>
          <div className="adm-detail-field">
            <FaIdBadge />
            <div>
              <span className="adm-detail-field-label">Received</span>
              <span>{formatDate(message.createdAt)}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="adm-detail-field-label">Message</span>
          <p className="adm-detail-desc" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
            {message.message}
          </p>
        </div>

        <div className="adm-admin-actions-row">
          <a className="adm-btn adm-btn-primary" href={replyHref} target="_blank" rel="noopener noreferrer">
            <FaEnvelope /> Reply via Email
          </a>

          {isUnread && (
            <button className="adm-btn adm-btn-outline" onClick={() => onMarkRead(message)}>
              <FaCheckCircle /> Mark as Read
            </button>
          )}

          <button className="adm-btn adm-btn-danger" onClick={() => onDelete(message)}>
            <FaTrashAlt /> Delete
          </button>
        </div>
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

  // null | "studentDetail" | "productDetail" | "requestDetail" | "complaintDetail" | "contactDetail"
  const [subView, setSubView] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalRequests: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
  });

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [loadingContact, setLoadingContact] = useState(true);

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

  const [contactSearch, setContactSearch] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState("all");

  // NEW: holds the student about to be blocked ({ id, fullName, ... })
  // while BlockStudentModal is open — set from the Dashboard list,
  // the Student detail view, or a Complaint's "Block Student" action.
  // Replaces the old confirmAction type "block" / "blockStudentFromComplaint".
  const [blockReasonTarget, setBlockReasonTarget] = useState(null);

  const [toast, setToast] = useState(null);
  // { type: "unblock"|"blockProduct"|"unblockProduct"|"deleteComplaint"|"deleteProductFromComplaint"|"deleteContact", target }
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
        // Newest first, so the most recently created request always
        // shows at the top of the Requests table.
        setRequests(sortByCreatedAtDesc((data || []).map(mapAdminRequest)));
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
        // Newest first, so the most recently filed complaint always
        // shows at the top of the Complaints table.
        setComplaints(sortByCreatedAtDesc((data || []).map(mapAdminComplaint)));
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

  useEffect(() => {
    let cancelled = false;
    AdminApi.getContactMessages()
      .then((data) => {
        if (cancelled) return;
        // Newest first, so the most recent message always shows at
        // the top of the Contact table.
        setContactMessages(sortByCreatedAtDesc((data || []).map(mapAdminContact)));
      })
      .catch((err) => {
        console.error("Failed to load contact messages:", err);
        showToast("Couldn't load contact messages.", "error");
      })
      .finally(() => !cancelled && setLoadingContact(false));
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

  const unreadContactCount = useMemo(
    () => contactMessages.filter((m) => m.status === "UNREAD").length,
    [contactMessages]
  );

  // Fills in a product image whenever the backend response for a
  // request is missing one, by matching against the already-loaded
  // products list. Prefers matching by id (reliable) and only falls
  // back to matching by title (fragile) if no id is present.
  const enrichRequestWithProductImages = (request) => {
    if (!request) return request;

    let productImage = request.productImage;
    if (!productImage) {
      if (request.productId) {
        const matched = products.find((p) => p.id === request.productId);
        if (matched) productImage = matched.imageUrl;
      } else if (request.productTitle) {
        const matched = products.find(
          (p) => p.title.trim().toLowerCase() === request.productTitle.trim().toLowerCase()
        );
        if (matched) productImage = matched.imageUrl;
      }
    }

    let offeredProductImage = request.offeredProductImage;
    if (!offeredProductImage) {
      if (request.offeredProductId) {
        const matchedOffered = products.find((p) => p.id === request.offeredProductId);
        if (matchedOffered) offeredProductImage = matchedOffered.imageUrl;
      } else if (request.offeredProductTitle) {
        const matchedOffered = products.find(
          (p) => p.title.trim().toLowerCase() === request.offeredProductTitle.trim().toLowerCase()
        );
        if (matchedOffered) offeredProductImage = matchedOffered.imageUrl;
      }
    }

    return { ...request, productImage, offeredProductImage };
  };

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
    setSelectedContact(null);
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

  // ---------- Block / unblock student (from Dashboard / Student detail) ----------
  //
  // Blocking now opens BlockStudentModal (reason required) instead of
  // the plain ConfirmDialog; unblocking still goes through the simple
  // confirm flow since there's nothing to collect.
  const requestToggleBlock = (student) => {
    if (student.blocked) {
      setConfirmAction({ type: "unblock", target: student });
    } else {
      setBlockReasonTarget(student);
    }
  };

  const confirmUnblock = async () => {
    const student = confirmAction.target;
    try {
      await AdminApi.unblockStudent(student.id);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, blocked: false } : s))
      );
      if (selectedStudent?.id === student.id) {
        setSelectedStudent((s) => ({ ...s, blocked: false }));
      }
      showToast(`${student.fullName} has been unblocked.`);
    } catch (err) {
      console.error("Unblock failed:", err);
      showToast(err.response?.data?.message || "Action failed. Please try again.", "error");
    } finally {
      setConfirmAction(null);
    }
  };

  // Shared by every "Block" entry point (Dashboard list, Student
  // detail, Complaint detail) — blockReasonTarget only needs
  // { id, fullName } to work, so a lightweight object from a complaint
  // works exactly the same as a full student row.
  const confirmBlockWithReason = async (reason) => {
    const target = blockReasonTarget;
    try {
      await AdminApi.blockStudent(target.id, reason);
      setStudents((prev) =>
        prev.map((s) => (s.id === target.id ? { ...s, blocked: true } : s))
      );
      if (selectedStudent?.id === target.id) {
        setSelectedStudent((s) => ({ ...s, blocked: true }));
      }
      showToast(`${target.fullName} has been blocked.`);
      setBlockReasonTarget(null);
    } catch (err) {
      console.error("Block student failed:", err);
      showToast(err.response?.data?.message || "Action failed. Please try again.", "error");
      // leave the modal open on failure so the admin doesn't lose their typed reason
    }
  };

  // ---------- Block / unblock product (from Product detail) ----------
  const requestBlockProduct = (product) => {
    setConfirmAction({ type: "blockProduct", target: product });
  };

  const requestUnblockProduct = (product) => {
    setConfirmAction({ type: "unblockProduct", target: product });
  };

  const confirmToggleProductBlock = async () => {
    const product = confirmAction.target;
    const shouldBlock = confirmAction.type === "blockProduct";
    const newStatus = shouldBlock ? "BLOCKED" : "AVAILABLE";
    try {
      if (shouldBlock) {
        await AdminApi.blockProduct(product.id);
      } else {
        await AdminApi.unblockProduct(product.id);
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
      );
      setSelectedProduct((p) => (p && p.id === product.id ? { ...p, status: newStatus } : p));
      showToast(
        shouldBlock
          ? `"${product.title}" has been blocked. The seller was notified.`
          : `"${product.title}" is available again. The seller was notified.`
      );
    } catch (err) {
      console.error("Block/unblock product failed:", err);
      showToast(err.response?.data?.message || "Action failed. Please try again.", "error");
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
      loadDashboardStats(); // keep the Total Products stat card in sync
    } catch (err) {
      console.error("Delete product failed:", err);
      showToast(err.response?.data?.message || "Delete failed. Please try again.", "error");
    } finally {
      setConfirmAction(null);
    }
  };

  // "Block Student" from a complaint now opens the same reason modal
  // as every other block entry point — no separate confirm/dialog path.
  const requestBlockStudentFromComplaint = (complaint) => {
    setBlockReasonTarget({
      id: complaint.againstStudentId,
      fullName: complaint.againstStudentName,
    });
  };

  // ---------- Contact messages: open / mark read / delete ----------
  const setContactStatusLocal = (id, status) => {
    setContactMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    setSelectedContact((m) => (m && m.id === id ? { ...m, status } : m));
  };

  const markContactRead = async (msg) => {
    try {
      await AdminApi.markContactRead(msg.id);
      setContactStatusLocal(msg.id, "READ");
    } catch (err) {
      console.error("Mark contact message read failed:", err);
      showToast(err.response?.data?.message || "Couldn't update the message.", "error");
    }
  };

  // Opening an unread message marks it as read automatically.
  const openContact = (msg) => {
    setSelectedContact(msg);
    setSubView("contactDetail");
    if (msg.status === "UNREAD") markContactRead(msg);
  };
  const closeContact = () => {
    setSubView(null);
    setSelectedContact(null);
  };

  const requestDeleteContact = (msg) => {
    setConfirmAction({ type: "deleteContact", target: msg });
  };

  const confirmDeleteContact = async () => {
    const msg = confirmAction.target;
    try {
      await AdminApi.deleteContactMessage(msg.id);
      setContactMessages((prev) => prev.filter((m) => m.id !== msg.id));
      showToast("Message deleted.");
      if (selectedContact?.id === msg.id) closeContact();
    } catch (err) {
      console.error("Delete contact message failed:", err);
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
          onBlockProduct={requestBlockProduct}
          onUnblockProduct={requestUnblockProduct}
        />
      );
    }

    if (subView === "requestDetail" && selectedRequest) {
      return (
        <RequestDetailView
          request={enrichRequestWithProductImages(selectedRequest)}
          onBack={closeRequest}
        />
      );
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

    if (subView === "contactDetail" && selectedContact) {
      return (
        <ContactDetailView
          message={selectedContact}
          onBack={closeContact}
          onMarkRead={markContactRead}
          onDelete={requestDeleteContact}
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
      case "contact":
        if (loadingContact) return <EmptyState message="Loading messages…" />;
        return (
          <ContactSection
            messages={contactMessages}
            search={contactSearch}
            onSearchChange={setContactSearch}
            statusFilter={contactStatusFilter}
            onStatusChange={setContactStatusFilter}
            onOpenMessage={openContact}
          />
        );
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
        unreadContactCount={unreadContactCount}
        onLogout={handleLogout}
      />

      <main className="adm-content">{renderContent()}</main>

      {confirmAction && confirmAction.type === "unblock" && (
        <ConfirmDialog
          title="Unblock this student?"
          message={`${confirmAction.target.fullName} will regain access to Campus Xchange.`}
          confirmLabel="Unblock"
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmUnblock}
        />
      )}

      {confirmAction &&
        (confirmAction.type === "blockProduct" || confirmAction.type === "unblockProduct") && (
          <ConfirmDialog
            title={confirmAction.type === "blockProduct" ? "Block this product?" : "Unblock this product?"}
            message={
              confirmAction.type === "blockProduct"
                ? `"${confirmAction.target.title}" will be hidden from buyers and the seller will be notified.`
                : `"${confirmAction.target.title}" will be available to buyers again and the seller will be notified.`
            }
            confirmLabel={confirmAction.type === "blockProduct" ? "Block" : "Unblock"}
            danger={confirmAction.type === "blockProduct"}
            onCancel={() => setConfirmAction(null)}
            onConfirm={confirmToggleProductBlock}
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

      {confirmAction && confirmAction.type === "deleteContact" && (
        <ConfirmDialog
          title="Delete this message?"
          message={`The message from ${confirmAction.target.name} will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmDeleteContact}
        />
      )}

      {blockReasonTarget && (
        <BlockStudentModal
          student={blockReasonTarget}
          onCancel={() => setBlockReasonTarget(null)}
          onConfirm={confirmBlockWithReason}
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