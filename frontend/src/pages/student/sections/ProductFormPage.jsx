import { useState, useRef } from "react";
import { FaArrowLeft, FaCloudUploadAlt, FaStar, FaRegStar, FaTimes } from "react-icons/fa";
import ImagePlaceholder from "../components/ImagePlaceholder";
import ConfirmDialog from "../components/ConfirmDialog";
import { CATEGORIES, TYPES, CONDITIONS, MAX_IMAGES, TYPE_INFO } from "../constants";
import "./ProductFormPage.css";

/* Two-column page (image + live preview on the left, form on the
   right) so it fills the page instead of leaving a lot of empty
   space. */
function ProductFormPage({ initialData, studentId, onCancel, onSubmit }) {
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
    const productData = {
      owner: {
        studentId: studentId,
      },
      title: form.name,
      description: form.description,
      category: form.category,
      type: form.type,
      price: form.type === "Sell" ? Number(form.price) : 0,
      condition: form.condition,
      status: "PENDING",
    };

    // Only newly-added images carry a raw File object — images already
    // loaded from the server (when editing) don't, so this naturally
    // sends just the new ones.
    const imageFiles = images.map((img) => img.file).filter(Boolean);

    onSubmit(productData, imageFiles);
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

export default ProductFormPage;