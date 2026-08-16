import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import "./StudentDashboard.css";
import { useNavigate, useLocation } from "react-router-dom";
import StudentNavbar, { STUDENT_NAV_TABS } from "./StudentNavbar";
import { getProfile } from "../../services/profileService";
import {
  FaTimes,
  FaSearch,
  FaUser,
  FaInbox,
  FaCheckCircle,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaArrowLeft,
  FaStar,
  FaRegStar,
  FaCloudUploadAlt,
  FaPen,
  FaTrashAlt,
  FaFire,
  FaHistory,
  FaCheck,
  FaBan,
} from "react-icons/fa";

/* ---------------------------------------------------------
   Sample data — swap for real API data whenever it's ready.
--------------------------------------------------------- */
const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Books & Stationery",
  "Clothing",
  "Sports & Fitness",
  "Furniture",
  "Others",
];

const TYPES = ["Sell", "Exchange", "Donate"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];
const MAX_IMAGES = 4;
const PAGE_SIZE = 8;
const HISTORY_STORAGE_KEYS = {
  browsing: "cx_browsingHistory",
  purchase: "cx_purchaseHistory",
};

const TYPE_INFO = {
  Sell: { badgeClass: "type-sell", actionLabel: "Request to Buy" },
  Exchange: { badgeClass: "type-exchange", actionLabel: "Request Exchange" },
  Donate: { badgeClass: "type-donate", actionLabel: "Request Donate" },
};

const SAMPLE_PRODUCTS = [
  { id: 1, name: "Scientific Calculator (Casio fx-991)", price: 450, category: "Electronics", type: "Sell", condition: "Good", sellerName: "Rahul Nair", department: "Computer Science", description: "Barely used, all functions working perfectly. Great for engineering coursework.", images: [] },
  { id: 2, name: "Data Structures & Algorithms Textbook", price: 0, category: "Books & Stationery", type: "Exchange", condition: "Good", sellerName: "Priya Suresh", department: "Computer Application", description: "Looking to exchange for a Database Management Systems textbook, any edition.", images: [] },
  { id: 3, name: "Winter Hostel Jacket (L)", price: 0, category: "Clothing", type: "Donate", condition: "Like New", sellerName: "Arjun Kumar", department: "Mechanical Engineering", description: "Warm and in good condition, just doesn't fit me anymore.", images: [] },
  { id: 4, name: "Badminton Racket + Cover", price: 550, category: "Sports & Fitness", type: "Sell", condition: "Good", sellerName: "Sneha Reddy", department: "Commerce", description: "Yonex racket, used for one semester of intramurals only.", images: [] },
  { id: 5, name: "Study Table Lamp", price: 200, category: "Furniture", type: "Sell", condition: "Like New", sellerName: "Vikram Singh", department: "Electrical Engineering", description: "LED lamp with adjustable brightness, works great for late-night study.", images: [] },
  { id: 6, name: "Drafting Kit (Full Set)", price: 0, category: "Others", type: "Exchange", condition: "Fair", sellerName: "Ananya Iyer", department: "Civil Engineering", description: "Complete drafting set, looking to exchange for a graphic calculator.", images: [] },
  { id: 7, name: "Wireless Mouse", price: 250, category: "Electronics", type: "Sell", condition: "New", sellerName: "Karthik Raj", department: "Information Technology", description: "Logitech wireless mouse, works perfectly, includes USB receiver.", images: [] },
  { id: 8, name: "Old Semester Notes Bundle", price: 0, category: "Books & Stationery", type: "Donate", condition: "Good", sellerName: "Divya Menon", department: "Business Administration", description: "Handwritten notes for first-year core subjects, neatly organized.", images: [] },
  { id: 9, name: "Chemistry Lab Manual", price: 150, category: "Books & Stationery", type: "Sell", condition: "Fair", sellerName: "Meera Pillai", department: "Chemistry", description: "Second-hand lab manual, all pages intact, minor highlighting.", images: [] },
  { id: 10, name: "Bluetooth Earphones", price: 550, category: "Electronics", type: "Sell", condition: "Good", sellerName: "Rohit Sharma", department: "Electronics & Comm.", description: "6 months old, comes with charging case.", images: [] },
  { id: 11, name: "Mechanical Keyboard", price: 1200, category: "Electronics", type: "Sell", condition: "Good", sellerName: "Farhan Ali", department: "Computer Science", description: "Blue-switch keyboard, RGB backlight, barely used.", images: [] },
  { id: 12, name: "Organic Chemistry Guide", price: 0, category: "Books & Stationery", type: "Exchange", condition: "Good", sellerName: "Meera Pillai", department: "Chemistry", description: "Looking to exchange for an Inorganic Chemistry reference.", images: [] },
];

// Left sidebar — this student's own stuff.
const SIDEBAR_ITEMS = [
  { id: "myProducts", label: "My Products" },
  { id: "myRequests", label: "My Requests" },
  { id: "myComplaints", label: "My Complaints" },
];

const PROFILE_IMAGE_BASE_URL = "http://localhost:8081/uploads/profile-images/";

/* ---------------------------------------------------------
   Personalized recommendations — scored from what the
   student has viewed (browsing history) and requested
   (purchase/exchange/donation history).
--------------------------------------------------------- */
function loadHistory(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildInterestScores(browsingHistory, purchaseHistory) {
  const categoryScores = {};
  const typeScores = {};

  const bump = (store, key, weight) => {
    if (!key) return;
    store[key] = (store[key] || 0) + weight;
  };

  browsingHistory.forEach((entry) => {
    bump(categoryScores, entry.category, 1);
    bump(typeScores, entry.type, 1);
  });
  purchaseHistory.forEach((entry) => {
    bump(categoryScores, entry.category, 3);
    bump(typeScores, entry.type, 3);
  });

  return { categoryScores, typeScores };
}

function getRecommendations(products, browsingHistory, purchaseHistory, limit = 6) {
  const { categoryScores, typeScores } = buildInterestScores(browsingHistory, purchaseHistory);
  const hasSignal = Object.keys(categoryScores).length > 0;

  const scored = products
    .map((p) => ({
      product: p,
      score: (categoryScores[p.category] || 0) + (typeScores[p.type] || 0) * 0.5,
    }))
    .sort((a, b) => b.score - a.score);

  const personalizedItems = scored.filter((s) => s.score > 0).map((s) => s.product);
  const items = personalizedItems.slice(0, limit);

  if (items.length < limit) {
    const usedIds = new Set(items.map((p) => p.id));
    const fillers = products.filter((p) => !usedIds.has(p.id)).slice(0, limit - items.length);
    items.push(...fillers);
  }

  return { items, personalized: hasSignal && personalizedItems.length > 0 };
}

/* ---------------------------------------------------------
   Sample incoming requests — demo data standing in for
   requests other students have sent for your listings.
--------------------------------------------------------- */
const SAMPLE_INCOMING_REQUESTS = [
  {
    id: "inc-1",
    productName: "Graphing Calculator (TI-84 Plus)",
    requesterName: "Ishaan Verma",
    department: "Electronics & Comm.",
    type: "Sell",
    time: Date.now() - 1000 * 60 * 60 * 3,
    status: "pending",
  },
  {
    id: "inc-2",
    productName: "Hostel Study Chair",
    requesterName: "Fatima Sheikh",
    department: "Business Administration",
    type: "Donate",
    time: Date.now() - 1000 * 60 * 60 * 26,
    status: "pending",
  },
];

/* ---------------------------------------------------------
   Empty state
--------------------------------------------------------- */
function EmptyState({ subtitle, action }) {
  return (
    <div className="dash-empty">
      <div className="dash-empty-icon">
        <FaInbox />
      </div>
      <h3>No data available</h3>
      <p>{subtitle}</p>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------
   Relative time helper (e.g. "3h ago")
--------------------------------------------------------- */
function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

/* ---------------------------------------------------------
   Image placeholder (wireframe-style crossed box)
--------------------------------------------------------- */
function ImagePlaceholder() {
  return (
    <div className="pcard-image">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pcard-image-cross">
        <rect x="1" y="1" width="98" height="98" rx="6" />
        <line x1="1" y1="1" x2="99" y2="99" />
        <line x1="99" y1="1" x2="1" y2="99" />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Product card — used both in the marketplace grid and
   the "My Products" grid (action area differs between them)
--------------------------------------------------------- */
function ProductCard({ product, onOpen, actions }) {
  const info = TYPE_INFO[product.type];

  return (
    <div className="pcard" onClick={() => onOpen(product)}>
      {product.images?.[product.primaryIndex ?? 0] ? (
        <div className="pcard-image">
          <img src={product.images[product.primaryIndex ?? 0].url} alt={product.name} />
        </div>
      ) : (
        <ImagePlaceholder />
      )}

      <span className={`pcard-type-badge ${info.badgeClass}`}>{product.type}</span>

      <h4 className="pcard-name">{product.name}</h4>
      <span className="pcard-category">{product.category}</span>

      <div className="pcard-footer">
        <span className="pcard-price">{product.type === "Sell" ? `₹ ${product.price}` : "Free"}</span>
        {actions(product)}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Compact card used in the "Recommended for You" strip
   and the search-suggestions dropdown.
--------------------------------------------------------- */
function SuggestionCard({ product, onOpen }) {
  return (
    <button type="button" className="sugg-card" onClick={() => onOpen(product)}>
      {product.images?.[product.primaryIndex ?? 0] ? (
        <div className="sugg-card-image">
          <img src={product.images[product.primaryIndex ?? 0].url} alt={product.name} />
        </div>
      ) : (
        <div className="sugg-card-image">
          <ImagePlaceholder />
        </div>
      )}
      <span className="sugg-card-name">{product.name}</span>
      <span className="sugg-card-price">{product.type === "Sell" ? `₹ ${product.price}` : "Free"}</span>
    </button>
  );
}

/* ---------------------------------------------------------
   Pagination
--------------------------------------------------------- */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const addRange = (start, end) => {
    for (let i = start; i <= end; i++) pages.push(i);
  };

  if (totalPages <= 7) {
    addRange(1, totalPages);
  } else if (page <= 4) {
    addRange(1, 5);
    pages.push("...");
    pages.push(totalPages);
  } else if (page >= totalPages - 3) {
    pages.push(1);
    pages.push("...");
    addRange(totalPages - 4, totalPages);
  } else {
    pages.push(1);
    pages.push("...");
    addRange(page - 1, page + 1);
    pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="pg-bar">
      <button className="pg-arrow" disabled={page === 1} onClick={() => onChange(Math.max(1, page - 1))}>
        <FaChevronLeft />
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`e-${idx}`} className="pg-ellipsis">...</span>
        ) : (
          <button key={p} className={`pg-num ${p === page ? "pg-active" : ""}`} onClick={() => onChange(p)}>
            {p}
          </button>
        )
      )}

      <button className="pg-arrow" disabled={page === totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>
        <FaChevronRight />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   Generic confirm dialog
--------------------------------------------------------- */
function ConfirmDialog({ title, message, onCancel, onConfirm, confirmLabel = "Confirm" }) {
  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="dash-modal-desc">{message}</p>
        <div className="confirm-btn-row">
          <button className="dash-btn dash-btn-outline" onClick={onCancel}>Cancel</button>
          <button className="dash-btn dash-btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Product detail — its own full-width in-page SECTION, not a
   popup. The main image is capped to a sensible size and, when
   a listing has more than one photo, a carousel (arrows + dots,
   plus a thumbnail strip) lets the buyer step through them.
--------------------------------------------------------- */
function ProductDetailSection({ product, isOwner, onBack, onRequest, onEdit, onDelete }) {
  const [activeImg, setActiveImg] = useState(product.primaryIndex ?? 0);
  const info = TYPE_INFO[product.type];
  const images = product.images || [];
  const hasMultiple = images.length > 1;

  const goPrev = () => setActiveImg((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveImg((i) => (i + 1) % images.length);

  return (
    <div className="dash-section">
      <button className="dash-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="pdetail-grid">
        <div className="pdetail-gallery">
          <div className="pdetail-main-image">
            {images[activeImg] ? (
              <img src={images[activeImg].url} alt={product.name} />
            ) : (
              <ImagePlaceholder />
            )}

            {hasMultiple && (
              <>
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-left"
                  onClick={goPrev}
                  aria-label="Previous image"
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-right"
                  onClick={goNext}
                  aria-label="Next image"
                >
                  <FaChevronRight />
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="carousel-dots">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`carousel-dot ${idx === activeImg ? "carousel-dot-active" : ""}`}
                  onClick={() => setActiveImg(idx)}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {hasMultiple && (
            <div className="pdetail-thumbs">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  className={`pdetail-thumb ${idx === activeImg ? "pdetail-thumb-active" : ""}`}
                  onClick={() => setActiveImg(idx)}
                >
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdetail-info">
          <span className={`pcard-type-badge pdetail-badge ${info.badgeClass}`}>{product.type}</span>

          <h1 className="pdetail-name">{product.name}</h1>
          <p className="pdetail-meta">
            {product.category} &middot; {product.condition}
          </p>

          <p className="pdetail-price">{product.type === "Sell" ? `₹${product.price}` : "Free"}</p>

          <p className="pdetail-desc">{product.description}</p>

          <div className="pdetail-seller-card">
            <div className="pdetail-seller-avatar">
              <FaUser />
            </div>
            <div>
              <strong>{product.sellerName}</strong>
              <span>{product.department}</span>
            </div>
          </div>

          <div className="pdetail-actions">
            {isOwner ? (
              <>
                <button className="dash-btn dash-btn-outline dash-btn-block" onClick={() => onEdit(product)}>
                  <FaPen /> Edit Listing
                </button>
                <button className="dash-btn dash-btn-danger dash-btn-block" onClick={() => onDelete(product)}>
                  <FaTrashAlt /> Delete Listing
                </button>
              </>
            ) : (
              <button className={`dash-request-btn ${info.badgeClass}`} onClick={() => onRequest(product)}>
                {info.actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Add / Edit Product — two-column page (image + live
   preview on the left, form on the right) so it fills the
   page instead of leaving a lot of empty space.
--------------------------------------------------------- */
function ProductFormPage({ initialData, onCancel, onSubmit }) {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState(
    initialData
      ? {
          name: initialData.name,
          category: initialData.category,
          type: initialData.type,
          price: initialData.type === "Sell" ? String(initialData.price) : "",
          condition: initialData.condition,
          description: initialData.description,
        }
      : { name: "", category: "", type: "", price: "", condition: "", description: "" }
  );
  const [images, setImages] = useState(initialData?.images || []);
  const [primaryIndex, setPrimaryIndex] = useState(initialData?.primaryIndex ?? 0);
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === "type" && value !== "Sell" ? { price: "" } : {}) }));
    setErrors((errs) => (errs[name] ? { ...errs, [name]: "" } : errs));
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setErrors((errs) => ({ ...errs, images: `You can add up to ${MAX_IMAGES} images.` }));
      e.target.value = "";
      return;
    }

    const toAdd = files.slice(0, room).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setImages((prev) => [...prev, ...toAdd]);
    setErrors((errs) => ({ ...errs, images: "" }));
    e.target.value = "";
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const idx = prev.findIndex((img) => img.id === id);
      if (idx > -1) URL.revokeObjectURL(prev[idx].url);
      const next = prev.filter((img) => img.id !== id);
      return next;
    });
    setPrimaryIndex((p) => (p >= images.length - 1 ? 0 : p));
  };

  const validate = () => {
    const errs = {};
    if (images.length < 1) errs.images = "Add at least 1 product image.";
    if (!form.name.trim()) errs.name = "Product name is required.";
    if (!form.category) errs.category = "Please select a category.";
    if (!form.type) errs.type = "Please select a listing type.";
    if (form.type === "Sell" && (!form.price || Number(form.price) <= 0)) {
      errs.price = "Enter a valid selling price.";
    }
    if (!form.condition) errs.condition = "Please select a condition.";
    if (!form.description.trim()) errs.description = "Add a short description.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitClick = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onSubmit({
      ...(initialData || {}),
      ...form,
      price: form.type === "Sell" ? Number(form.price) : 0,
      images,
      primaryIndex,
      id: initialData?.id ?? Date.now(),
      sellerName: "You",
      department: initialData?.department || "Your Department",
    });
    setShowConfirm(false);
  };

  const previewProduct = {
    name: form.name || "Your product name",
    category: form.category || "Category",
    type: form.type || "Sell",
    price: form.type === "Sell" ? Number(form.price) || 0 : 0,
    images,
    primaryIndex,
  };
  const previewInfo = TYPE_INFO[previewProduct.type] || TYPE_INFO.Sell;

  return (
    <div className="dash-section">
      <button className="dash-back-link" onClick={onCancel}>
        <FaArrowLeft /> Back to Products
      </button>

      <h1 className="addp-title">{isEdit ? "Edit Product" : "Add Product"}</h1>

      <div className="addp-layout">
        {/* ---------- Left: images + live preview ---------- */}
        <div className="addp-left">
          <div className="addp-card">
            <label className="addp-label">
              Product Images <span className="addp-hint">(min 1, max {MAX_IMAGES})</span>
            </label>

            {images.length === 0 ? (
              <button type="button" className="addp-dropzone" onClick={() => fileInputRef.current?.click()}>
                <FaCloudUploadAlt />
                <strong>Click to upload photos</strong>
                <span>PNG or JPG, up to {MAX_IMAGES} images</span>
              </button>
            ) : (
              <div className="addp-image-grid">
                {images.map((img, idx) => (
                  <div key={img.id} className={`addp-image-slot ${idx === primaryIndex ? "primary" : ""}`}>
                    <img src={img.url} alt="" onClick={() => setPrimaryIndex(idx)} />
                    <button type="button" className="addp-image-star" title="Set as primary" onClick={() => setPrimaryIndex(idx)}>
                      {idx === primaryIndex ? <FaStar /> : <FaRegStar />}
                    </button>
                    <button type="button" className="addp-image-remove" title="Remove" onClick={() => removeImage(img.id)}>
                      <FaTimes />
                    </button>
                    {idx === primaryIndex && <span className="addp-primary-tag">Primary</span>}
                  </div>
                ))}

                {images.length < MAX_IMAGES && (
                  <button type="button" className="addp-image-add" onClick={() => fileInputRef.current?.click()}>
                    <FaCloudUploadAlt />
                    <span>Add</span>
                  </button>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleAddImages} />
            {errors.images && <span className="field-error-msg">{errors.images}</span>}
          </div>

          <div className="addp-card addp-preview-card">
            <label className="addp-label">Listing Preview</label>
            <div className="addp-preview">
              {previewProduct.images[primaryIndex] ? (
                <div className="pcard-image">
                  <img src={previewProduct.images[primaryIndex].url} alt="" />
                </div>
              ) : (
                <ImagePlaceholder />
              )}
              <span className={`pcard-type-badge ${previewInfo.badgeClass}`}>{previewProduct.type}</span>
              <h4 className="pcard-name">{previewProduct.name}</h4>
              <span className="pcard-category">{previewProduct.category}</span>
              <div className="pcard-footer">
                <span className="pcard-price">
                  {previewProduct.type === "Sell" ? `₹ ${previewProduct.price}` : "Free"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Right: form fields ---------- */}
        <div className="addp-card addp-right">
          <div className="dash-field-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Scientific Calculator"
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="field-error-msg">{errors.name}</span>}
          </div>

          <div className="dash-form-row">
            <div className="dash-field-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange} className={errors.category ? "input-error" : ""}>
                <option value="" disabled>Select category</option>
                {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              {errors.category && <span className="field-error-msg">{errors.category}</span>}
            </div>

            <div className="dash-field-group">
              <label>Product Type</label>
              <select name="type" value={form.type} onChange={handleChange} className={errors.type ? "input-error" : ""}>
                <option value="" disabled>Select type</option>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {errors.type && <span className="field-error-msg">{errors.type}</span>}
            </div>
          </div>

          <div className="dash-form-row">
            <div className="dash-field-group">
              <label>
                Price (₹) {form.type && form.type !== "Sell" && <span className="addp-hint">— set to 0</span>}
              </label>
              <input
                type="number"
                min="0"
                name="price"
                value={form.type && form.type !== "Sell" ? 0 : form.price}
                onChange={handleChange}
                disabled={!form.type || form.type !== "Sell"}
                placeholder="0"
                className={errors.price ? "input-error" : ""}
              />
              {errors.price && <span className="field-error-msg">{errors.price}</span>}
            </div>

            <div className="dash-field-group">
              <label>Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange} className={errors.condition ? "input-error" : ""}>
                <option value="" disabled>Select condition</option>
                {CONDITIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              {errors.condition && <span className="field-error-msg">{errors.condition}</span>}
            </div>
          </div>

          <div className="dash-field-group">
            <label>Description</label>
            <textarea
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the item's condition, age, and anything buyers should know..."
              className={errors.description ? "input-error" : ""}
            />
            {errors.description && <span className="field-error-msg">{errors.description}</span>}
          </div>

          <button className="dash-btn dash-btn-primary dash-btn-block" onClick={handleSubmitClick}>
            {isEdit ? "Save Changes" : "List Product"}
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title={isEdit ? "Save changes?" : "List this product?"}
          message={
            isEdit
              ? `Update "${form.name}" with these changes?`
              : `"${form.name}" will be published as a ${form.type} listing${form.type === "Sell" ? ` for ₹${form.price}` : ""}.`
          }
          confirmLabel={isEdit ? "Save Changes" : "Yes, List It"}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Marketplace "Products" — browse everyone else's listings.
   Search box surfaces personalized suggestions driven by
   browsing + purchase history (see getRecommendations above).
--------------------------------------------------------- */
function BrowseProductsSection({ products, onOpen, recommendations }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All Categories" || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => setPage(1), [query, category]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Close the suggestions dropdown on an outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // What shows in the dropdown while the search box is focused:
  // - empty query  -> personalized picks (browsing + purchase history)
  // - typed query  -> matching products, most relevant to this student first
  const dropdownItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      return recommendations.items.slice(0, 5);
    }

    const recommendedIds = new Set(recommendations.items.map((p) => p.id));
    return products
      .filter((p) => p.name.toLowerCase().includes(trimmed))
      .sort((a, b) => Number(recommendedIds.has(b.id)) - Number(recommendedIds.has(a.id)))
      .slice(0, 6);
  }, [query, products, recommendations]);

  const dropdownLabel = query.trim()
    ? "Matching products"
    : recommendations.personalized
    ? "Based on your activity"
    : "Popular right now";

  const handleSuggestionClick = (product) => {
    setShowSuggestions(false);
    onOpen(product);
  };

  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Products</h1>
      </div>

      <div className="dash-filter-bar">
        <div className="dash-search-box dash-search-box-wrap" ref={searchWrapRef}>
          <FaSearch className="dash-search-icon" />
          <input
            type="text"
            placeholder="Search products"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
          />

          {showSuggestions && dropdownItems.length > 0 && (
            <div className="search-suggest-dropdown">
              <div className="search-suggest-header">
                {query.trim() ? (
                  <FaSearch />
                ) : recommendations.personalized ? (
                  <FaHistory />
                ) : (
                  <FaFire />
                )}
                <span>{dropdownLabel}</span>
              </div>

              {dropdownItems.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="search-suggest-item"
                  onClick={() => handleSuggestionClick(p)}
                >
                  {p.images?.[p.primaryIndex ?? 0] ? (
                    <div className="search-suggest-thumb">
                      <img src={p.images[p.primaryIndex ?? 0].url} alt="" />
                    </div>
                  ) : (
                    <div className="search-suggest-thumb">
                      <ImagePlaceholder />
                    </div>
                  )}
                  <div className="search-suggest-text">
                    <span className="search-suggest-name">{p.name}</span>
                    <span className="search-suggest-meta">
                      {p.category} • {p.type === "Sell" ? `₹${p.price}` : "Free"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Personalized strip — only shown while browsing (no active search text)
          so it doesn't compete with search results. */}
      {!query.trim() && category === "All Categories" && recommendations.items.length > 0 && (
        <div className="sugg-strip">
          <div className="sugg-strip-header">
            {recommendations.personalized ? <FaHistory /> : <FaFire />}
            <h3>{recommendations.personalized ? "Recommended for You" : "Popular Picks"}</h3>
          </div>
          <div className="sugg-strip-row">
            {recommendations.items.map((p) => (
              <SuggestionCard key={p.id} product={p} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}

      {pageItems.length === 0 ? (
        <EmptyState subtitle="Try a different search term or category." />
      ) : (
        <>
          <div className="product-grid">
            {pageItems.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={onOpen}
                actions={(product) => {
                  const info = TYPE_INFO[product.type];
                  return (
                    <button
                      className={`pcard-action-btn ${info.badgeClass}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(product);
                      }}
                    >
                      {info.actionLabel}
                    </button>
                  );
                }}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Sidebar "My Products" — own listings, edit/delete + add
--------------------------------------------------------- */
function MyProductsSection({ products, onOpen, onAdd, onEdit, onDelete }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>My Products</h1>
        <button className="dash-btn dash-btn-primary" onClick={onAdd}>
          <FaPlus /> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          subtitle="You haven't listed any products yet."
          action={
            <button className="dash-btn dash-btn-primary" onClick={onAdd} style={{ marginTop: 18 }}>
              <FaPlus /> List Your First Product
            </button>
          }
        />
      ) : (
        <>
          <div className="product-grid">
            {pageItems.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={onOpen}
                actions={(product) => (
                  <div className="pcard-owner-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => onEdit(product)}>
                      <FaPen /> Edit
                    </button>
                    <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => onDelete(product)}>
                      <FaTrashAlt /> Delete
                    </button>
                  </div>
                )}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Sidebar "My Requests" — requests YOU sent for other
   students' listings.
--------------------------------------------------------- */
function MyRequestsSection({ requests }) {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>My Requests</h1>
      </div>

      {requests.length === 0 ? (
        <EmptyState subtitle="You haven't requested anything yet." />
      ) : (
        <div className="request-list">
          {requests
            .slice()
            .reverse()
            .map((r) => {
              const info = TYPE_INFO[r.type];
              return (
                <div key={r.id} className="request-card">
                  <div className="request-card-main">
                    <span className={`pcard-type-badge ${info.badgeClass}`}>{r.type}</span>
                    <h4>{r.productName}</h4>
                    <p>To {r.sellerName}</p>
                  </div>
                  <div className="request-card-side">
                    <span className={`request-status request-status-${r.status}`}>{r.status}</span>
                    <span className="request-time">{timeAgo(r.time)}</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Sidebar "My Complaints" — complaints YOU raised.
--------------------------------------------------------- */
function MyComplaintsSection() {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>My Complaints</h1>
      </div>
      <EmptyState subtitle="You haven't raised any complaints yet." />
    </div>
  );
}

/* ---------------------------------------------------------
   Top nav "Incoming Requests" — requests other students
   have sent for YOUR listings. Accept / Decline in place.
--------------------------------------------------------- */
function IncomingRequestsSection({ requests, onAccept, onDecline }) {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Incoming Requests</h1>
      </div>

      {requests.length === 0 ? (
        <EmptyState subtitle="No one has requested your products yet." />
      ) : (
        <div className="request-list">
          {requests.map((r) => {
            const info = TYPE_INFO[r.type];
            return (
              <div key={r.id} className="request-card">
                <div className="request-card-main">
                  <span className={`pcard-type-badge ${info.badgeClass}`}>{r.type}</span>
                  <h4>{r.productName}</h4>
                  <p>
                    From {r.requesterName} &middot; {r.department}
                  </p>
                </div>

                <div className="request-card-side">
                  {r.status === "pending" ? (
                    <div className="request-actions">
                      <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={() => onAccept(r)}>
                        <FaCheck /> Accept
                      </button>
                      <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => onDecline(r)}>
                        <FaBan /> Decline
                      </button>
                    </div>
                  ) : (
                    <span className={`request-status request-status-${r.status}`}>{r.status}</span>
                  )}
                  <span className="request-time">{timeAgo(r.time)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Top nav "Notifications" — full notification center
--------------------------------------------------------- */
function NotificationsSection({ notifications }) {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <EmptyState subtitle="You're all caught up — no notifications yet." />
      ) : (
        <div className="notif-list">
          {notifications
            .slice()
            .reverse()
            .map((n) => (
              <div key={n.id} className={`notif-list-item ${n.read ? "" : "notif-list-item-unread"}`}>
                <span className="notif-list-icon">
                  <FaBell />
                </span>
                <div className="notif-list-text">
                  <p>{n.message}</p>
                  <span>{timeAgo(n.time)}</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Top nav "Raise Complaint"
--------------------------------------------------------- */
function ComplaintsSection() {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Raise Complaint</h1>
      </div>
      <EmptyState subtitle="You haven't raised any complaints." />
    </div>
  );
}

/* ---------------------------------------------------------
   Main dashboard page
--------------------------------------------------------- */
function StudentDashboard() {
  const location = useLocation();

  // A student can land here from the StudentNavbar rendered on the
  // Landing page (see StudentNavbar.jsx) — it passes the intended
  // section via router state so the right tab opens directly.
  const [mainSection, setMainSection] = useState(
    () => location.state?.section || "products"
  );
  const [subView, setSubView] = useState(null); // null | "detail" | "add" | "edit"
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [returnSection, setReturnSection] = useState("products");

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer only
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [requestTarget, setRequestTarget] = useState(null);

  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [myRequests, setMyRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState(SAMPLE_INCOMING_REQUESTS);
  const [notifications, setNotifications] = useState(() => [
    {
      id: "n-seed-1",
      message: "Ishaan Verma requested your Graphing Calculator (TI-84 Plus).",
      time: Date.now() - 1000 * 60 * 60 * 3,
      read: false,
    },
    {
      id: "n-seed-2",
      message: "Fatima Sheikh requested to donate-adopt your Hostel Study Chair.",
      time: Date.now() - 1000 * 60 * 60 * 26,
      read: false,
    },
  ]);

  // ---------- Signed-in student's name + photo for the sidebar ----------
  const [studentProfile, setStudentProfile] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (!cancelled) setStudentProfile(data);
      })
      .catch(() => {
        /* sidebar just falls back to a generic name/icon */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Personalization signals ----------
  const [browsingHistory, setBrowsingHistory] = useState(() => loadHistory(HISTORY_STORAGE_KEYS.browsing));
  const [purchaseHistory, setPurchaseHistory] = useState(() => loadHistory(HISTORY_STORAGE_KEYS.purchase));

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEYS.browsing, JSON.stringify(browsingHistory));
    } catch {
      /* localStorage unavailable — recommendations just won't persist */
    }
  }, [browsingHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEYS.purchase, JSON.stringify(purchaseHistory));
    } catch {
      /* localStorage unavailable — recommendations just won't persist */
    }
  }, [purchaseHistory]);

  const navigate = useNavigate();

  const marketplaceProducts = useMemo(() => products.filter((p) => p.sellerName !== "You"), [products]);
  const myProducts = useMemo(() => products.filter((p) => p.sellerName === "You"), [products]);

  const recommendations = useMemo(
    () => getRecommendations(marketplaceProducts, browsingHistory, purchaseHistory, 6),
    [marketplaceProducts, browsingHistory, purchaseHistory]
  );

  const unreadNotifCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const incomingPendingCount = useMemo(
    () => incomingRequests.filter((r) => r.status === "pending").length,
    [incomingRequests]
  );

  const addNotification = useCallback((message) => {
    setNotifications((prev) => [
      ...prev,
      { id: `n-${Date.now()}-${Math.random()}`, message, time: Date.now(), read: false },
    ]);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // ---------- Navigation ----------
  const goToSection = (id) => {
    setMainSection(id);
    setSubView(null);
    setSidebarOpen(false); // close the mobile drawer after picking a section
  };

  const handleNavTabClick = (tab) => {
    // These two leave the dashboard entirely — Home goes to the public
    // landing page (with the student navbar still showing, see
    // StudentNavbar/Landing), Profile goes to the account page.
    if (tab.id === "home") {
      navigate("/");
      return;
    }
    if (tab.id === "profile") {
      navigate("/profile");
      return;
    }

    goToSection(tab.id);

    // Visiting the Notifications tab marks everything read, same as
    // opening any real notification center.
    if (tab.id === "notifications") {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const goToSidebarItem = (id) => goToSection(id);

  // Every time a student opens a marketplace listing, that's a browsing
  // signal — log it (deduped, most-recent last, capped) so future search
  // suggestions can lean on it.
  const recordBrowsing = useCallback((product) => {
    if (!product || product.sellerName === "You") return;
    setBrowsingHistory((prev) => {
      const next = [
        ...prev.filter((entry) => entry.id !== product.id),
        { id: product.id, category: product.category, type: product.type, time: Date.now() },
      ];
      return next.slice(-50);
    });
  }, []);

  const openDetail = useCallback(
    (product) => {
      recordBrowsing(product);
      setSelectedProduct(product);
      setReturnSection(mainSection);
      setSubView("detail");
    },
    [mainSection, recordBrowsing]
  );

  const closeDetail = () => {
    setSubView(null);
    setSelectedProduct(null);
    setMainSection(returnSection);
  };

  const goToProfile = () => navigate("/profile");

  const handleConfirmRequest = () => {
    const info = TYPE_INFO[requestTarget.type];

    // A confirmed request is a stronger interest signal than a view —
    // record it separately so it's weighted higher in recommendations.
    setPurchaseHistory((prev) =>
      [
        ...prev,
        { id: requestTarget.id, category: requestTarget.category, type: requestTarget.type, time: Date.now() },
      ].slice(-50)
    );

    setMyRequests((prev) => [
      ...prev,
      {
        id: `req-${Date.now()}`,
        productName: requestTarget.name,
        sellerName: requestTarget.sellerName,
        type: requestTarget.type,
        status: "pending",
        time: Date.now(),
      },
    ]);

    addNotification(`${info.actionLabel} sent to ${requestTarget.sellerName} for "${requestTarget.name}".`);
    showToast(`${info.actionLabel} sent to ${requestTarget.sellerName}.`);
    setRequestTarget(null);
    if (subView === "detail") closeDetail();
  };

  const handleAcceptIncoming = (request) => {
    setIncomingRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: "accepted" } : r))
    );
    addNotification(`You accepted ${request.requesterName}'s request for "${request.productName}".`);
    showToast(`Accepted ${request.requesterName}'s request.`);
  };

  const handleDeclineIncoming = (request) => {
    setIncomingRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: "declined" } : r))
    );
    addNotification(`You declined ${request.requesterName}'s request for "${request.productName}".`);
    showToast(`Declined ${request.requesterName}'s request.`);
  };

  const handleSaveProduct = (product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
    });
    const isEdit = subView === "edit";
    showToast(isEdit ? "Product updated successfully." : "Product listed successfully.");
    if (!isEdit) addNotification(`Your listing "${product.name}" is now live.`);
    setSubView(null);
    setEditingProduct(null);
    setMainSection("myProducts");
  };

  const handleConfirmDelete = () => {
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    showToast("Product deleted.");
    setDeleteTarget(null);
    if (subView === "detail") closeDetail();
  };

  const renderMain = () => {
    if (subView === "detail" && selectedProduct) {
      const isOwner = selectedProduct.sellerName === "You";
      return (
        <ProductDetailSection
          product={selectedProduct}
          isOwner={isOwner}
          onBack={closeDetail}
          onRequest={(p) => setRequestTarget(p)}
          onEdit={(p) => {
            setEditingProduct(p);
            setSubView("edit");
          }}
          onDelete={(p) => setDeleteTarget(p)}
        />
      );
    }

    if (subView === "add") {
      return (
        <ProductFormPage
          onCancel={() => {
            setSubView(null);
            setMainSection("myProducts");
          }}
          onSubmit={handleSaveProduct}
        />
      );
    }

    if (subView === "edit" && editingProduct) {
      return (
        <ProductFormPage
          initialData={editingProduct}
          onCancel={() => {
            setSubView(null);
            setEditingProduct(null);
          }}
          onSubmit={handleSaveProduct}
        />
      );
    }

    switch (mainSection) {
      case "products":
        return (
          <BrowseProductsSection
            products={marketplaceProducts}
            onOpen={openDetail}
            recommendations={recommendations}
          />
        );
      case "incomingRequests":
        return (
          <IncomingRequestsSection
            requests={incomingRequests}
            onAccept={handleAcceptIncoming}
            onDecline={handleDeclineIncoming}
          />
        );
      case "complaints":
        return <ComplaintsSection />;
      case "notifications":
        return <NotificationsSection notifications={notifications} />;
      case "myProducts":
        return (
          <MyProductsSection
            products={myProducts}
            onOpen={openDetail}
            onAdd={() => setSubView("add")}
            onEdit={(p) => {
              setEditingProduct(p);
              setSubView("edit");
            }}
            onDelete={(p) => setDeleteTarget(p)}
          />
        );
      case "myRequests":
        return <MyRequestsSection requests={myRequests} />;
      case "myComplaints":
        return <MyComplaintsSection />;
      default:
        return null;
    }
  };

  // Only the tabs that also appear in the top nav can be "active" there.
  const topNavActiveId =
    subView === null && STUDENT_NAV_TABS.some((t) => t.id === mainSection) ? mainSection : null;
  const isSidebarItemActive = (id) => subView === null && mainSection === id;

  const avatarUrl = studentProfile?.profileImage
    ? `${PROFILE_IMAGE_BASE_URL}${studentProfile.profileImage}`
    : null;
  const studentName = studentProfile?.fullName || "Student";

  return (
    <div className="dash-page">
      <StudentNavbar
        activeId={topNavActiveId}
        onTabClick={handleNavTabClick}
        onSidebarToggle={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
        unreadNotifCount={unreadNotifCount}
        incomingPendingCount={incomingPendingCount}
      />

      <div className="dash-body">
        {sidebarOpen && <div className="dash-sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}

        {/* ---------- Sidebar (personal, "My ...") — fixed in place,
            never scrolls or moves with the page. ---------- */}
        <aside className={`dash-sidebar ${sidebarOpen ? "dash-sidebar-open" : "dash-sidebar-closed"}`}>
          <button className="dash-sidebar-profile" onClick={goToProfile} title="View profile">
            <span className="dash-sidebar-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <FaUser />}
            </span>
            <span className="dash-sidebar-username">{studentName}</span>
          </button>

          <div className="dash-sidebar-divider"></div>

          <nav className="dash-sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`dash-sidebar-link ${isSidebarItemActive(item.id) ? "active" : ""}`}
                onClick={() => goToSidebarItem(item.id)}
                title={item.label}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ---------- Content ---------- */}
        <main className="dash-content">{renderMain()}</main>
      </div>

      {requestTarget && (
        <ConfirmDialog
          title={`${TYPE_INFO[requestTarget.type].actionLabel}?`}
          message={`Send a request to ${requestTarget.sellerName} for "${requestTarget.name}"?`}
          confirmLabel="Send Request"
          onCancel={() => setRequestTarget(null)}
          onConfirm={handleConfirmRequest}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this product?"
          message={`"${deleteTarget.name}" will be removed from your listings. This can't be undone.`}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {toast && (
        <div className="dash-toast">
          <FaCheckCircle />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;