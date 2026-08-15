import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import "./StudentDashboard.css";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaSearch,
  FaExchangeAlt,
  FaUser,
  FaSignOutAlt,
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
  FaBoxOpen,
  FaClipboardList,
  FaExclamationTriangle,
  FaFire,
  FaHistory,
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

const NAV_TABS = [
  { id: "products", label: "Products" },
  { id: "requests", label: "Requests" },
  { id: "complaints", label: "Complaints" },
];

const SIDEBAR_ITEMS = [
  { id: "myProducts", label: "My Products", icon: FaBoxOpen },
  { id: "myRequests", label: "My Requests", icon: FaClipboardList },
  { id: "myComplaints", label: "My Complaints", icon: FaExclamationTriangle },
];

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
   Product detail — its own full-width in-page SECTION,
   not a popup. Amazon-style gallery + sticky info panel.
--------------------------------------------------------- */
function ProductDetailSection({ product, isOwner, onBack, onRequest, onEdit, onDelete }) {
  const [activeImg, setActiveImg] = useState(product.primaryIndex ?? 0);
  const info = TYPE_INFO[product.type];
  const images = product.images || [];

  return (
    <div className="dash-section">
      <button className="dash-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="pdetail-grid">
        <div className="pdetail-gallery">
          <div className="pdetail-main-image">
            {images[activeImg] ? <img src={images[activeImg].url} alt={product.name} /> : <ImagePlaceholder />}
          </div>

          {images.length > 1 && (
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
   Search box now surfaces personalized suggestions driven by
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
   Main dashboard page
--------------------------------------------------------- */
function StudentDashboard() {
  const [mainSection, setMainSection] = useState("products");
  const [subView, setSubView] = useState(null); // null | "detail" | "add" | "edit"
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [returnSection, setReturnSection] = useState("products");

  const [navOpen, setNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [requestTarget, setRequestTarget] = useState(null);

  const [products, setProducts] = useState(SAMPLE_PRODUCTS);

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

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const marketplaceProducts = useMemo(() => products.filter((p) => p.sellerName !== "You"), [products]);
  const myProducts = useMemo(() => products.filter((p) => p.sellerName === "You"), [products]);

  const recommendations = useMemo(
    () => getRecommendations(marketplaceProducts, browsingHistory, purchaseHistory, 6),
    [marketplaceProducts, browsingHistory, purchaseHistory]
  );

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const goToNavTab = (id) => {
    setMainSection(id);
    setSubView(null);
    setNavOpen(false);
  };

  const goToSidebarItem = (id) => {
    setMainSection(id);
    setSubView(null);
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/auth");
  };

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

    showToast(`${info.actionLabel} sent to ${requestTarget.sellerName} ✅`);
    setRequestTarget(null);
    if (subView === "detail") closeDetail();
  };

  const handleSaveProduct = (product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
    });
    showToast(subView === "edit" ? "Product updated successfully ✅" : "Product listed successfully 🎉");
    setSubView(null);
    setEditingProduct(null);
    setMainSection("myProducts");
  };

  const handleConfirmDelete = () => {
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    showToast("Product deleted 🗑️");
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
      case "requests":
        return (
          <div className="dash-section">
            <div className="section-header"><h1>Requests</h1></div>
            <EmptyState subtitle="No pending requests right now." />
          </div>
        );
      case "complaints":
        return (
          <div className="dash-section">
            <div className="section-header"><h1>Complaints</h1></div>
            <EmptyState subtitle="No complaints have been raised." />
          </div>
        );
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
        return (
          <div className="dash-section">
            <div className="section-header"><h1>My Requests</h1></div>
            <EmptyState subtitle="You haven't requested anything yet." />
          </div>
        );
      case "myComplaints":
        return (
          <div className="dash-section">
            <div className="section-header"><h1>My Complaints</h1></div>
            <EmptyState subtitle="You haven't raised any complaints." />
          </div>
        );
      default:
        return null;
    }
  };

  const isNavTabActive = (id) => subView === null && mainSection === id;
  const isSidebarItemActive = (id) => subView === null && mainSection === id;

  return (
    <div className="dash-page">
      {/* ---------- Navbar ---------- */}
      <nav className="dash-navbar">
        <button className="dash-sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className="dash-logo">
          <span className="dash-logo-icon">
            <FaExchangeAlt />
          </span>
          Campus <span>Xchange</span>
        </div>

        <button className="dash-nav-toggle" onClick={() => setNavOpen((o) => !o)}>
          {navOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`dash-nav-links ${navOpen ? "dash-nav-open" : ""}`}>
          {NAV_TABS.map((tab) => (
            <button key={tab.id} className={isNavTabActive(tab.id) ? "active" : ""} onClick={() => goToNavTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="dash-navbar-right">
          <div className="notif-wrap" ref={notifRef}>
            <button className="notif-bell" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications">
              <FaBell />
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">Notifications</div>
                <div className="notif-empty">
                  <FaInbox />
                  <p>No new notifications</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="dash-body">
        {sidebarOpen && <div className="dash-sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}

        {/* ---------- Sidebar (personal, "My ...") ---------- */}
        <aside className={`dash-sidebar ${sidebarOpen ? "dash-sidebar-open" : "dash-sidebar-closed"}`}>
          <div className="dash-sidebar-profile" ref={profileRef}>
            <button className="dash-avatar-btn" onClick={() => setProfileOpen((o) => !o)} aria-label="Profile menu">
              <span className="dash-avatar-fallback">
                <FaUser />
              </span>
            </button>
            {sidebarOpen && <span className="dash-sidebar-username">Student Name</span>}

            {profileOpen && (
              <div className="dash-profile-menu">
                <button className="dash-profile-item" onClick={() => setProfileOpen(false)}>
                  <FaUser /> View Profile
                </button>
                <button className="dash-profile-item dash-logout" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>

          <div className="dash-sidebar-divider"></div>

          <nav className="dash-sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`dash-sidebar-link ${isSidebarItemActive(item.id) ? "active" : ""}`}
                  onClick={() => goToSidebarItem(item.id)}
                  title={item.label}
                >
                  <Icon />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
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