import { useState } from "react";
import { FaArrowLeft, FaCamera, FaTimes } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import ConfirmDialog from "../components/ConfirmDialog";
import { COMPLAINT_TYPES as COMPLAINT_TYPES_FROM_CONSTANTS } from "../constants";
import { createComplaint } from "../../../services/complaintService";
import "./RaiseComplaintSection.css";

const MAX_EVIDENCE = 3;
const API_ORIGIN = "http://localhost:8081";

// FIX: constants.js does not (currently) export a usable COMPLAINT_TYPES
// array — StudentDashboard.jsx never imports it either, which is a good
// sign it's missing/misnamed there. Without this guard,
// COMPLAINT_TYPES.map(...) below throws on every render of step 2
// ("Cannot read properties of undefined"), and with no error boundary
// in the app that crashes the WHOLE page to blank — both when jumping
// straight to step 2 via `preselected` (Report a problem) and when
// picking a transaction manually (Raise Complaint section). Falling
// back to a sane default keeps the feature working either way.
const DEFAULT_COMPLAINT_TYPES = [
  { value: "ITEM_NOT_AS_DESCRIBED", label: "Item not as described" },
  { value: "ITEM_DAMAGED", label: "Item damaged" },
  { value: "NEVER_RECEIVED", label: "Never received the item" },
  { value: "SELLER_UNRESPONSIVE", label: "Seller unresponsive" },
  { value: "OTHER", label: "Other" },
];

const COMPLAINT_TYPES =
  Array.isArray(COMPLAINT_TYPES_FROM_CONSTANTS) && COMPLAINT_TYPES_FROM_CONSTANTS.length > 0
    ? COMPLAINT_TYPES_FROM_CONSTANTS
    : DEFAULT_COMPLAINT_TYPES;

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}

/* Two-step flow:
   1. Pick which completed transaction the complaint is about.
   2. Fill out the complaint — type, description, optional photos.

   `preselected` lets another section (e.g. "Report a problem" on a
   My Purchases card) jump straight to step 2 for a specific
   transaction. The parent is expected to change this component's
   `key` prop whenever `preselected` changes, so this component fully
   remounts and its initial state is computed fresh each time — no
   effect-based syncing, no stale "already handled this" tracking. */
function RaiseComplaintSection({
  completedTransactions = [],
  onSubmit,
  preselected = null,
}) {
  const [selected, setSelected] = useState(() => {
    if (!preselected) return null;
    return completedTransactions.find((t) => t.id === preselected.id) || null;
  });

  const [complaintType, setComplaintType] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const resetForm = () => {
    setSelected(null);
    setComplaintType("");
    setDescription("");
    evidenceFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setEvidenceFiles([]);
    setErrors({});
    setSubmitError("");
  };

  const validate = () => {
    const errs = {};
    if (!complaintType) errs.complaintType = "Please select a complaint type.";
    if (!description.trim()) errs.description = "Please describe what happened.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitClick = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleEvidenceChange = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";

    const room = MAX_EVIDENCE - evidenceFiles.length;
    if (room <= 0) return;

    const withPreviews = picked.slice(0, room).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setEvidenceFiles((prev) => [...prev, ...withPreviews]);
  };

  const removeEvidence = (index) => {
    setEvidenceFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleConfirm = async () => {
    if (!selected) return;

    if (!selected.productId) {
      setSubmitError("Product information is missing.");
      return;
    }
    if (!selected.id) {
      setSubmitError("Request information is missing.");
      return;
    }
    if (!selected.sellerId) {
      setSubmitError("Seller information is missing.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      // NOTE: evidenceFiles is collected and previewed here but not
      // yet sent — createComplaint() posts plain JSON, and a real
      // photo upload needs a multipart endpoint on the backend that
      // doesn't exist yet.
      const complaintData = {
        productId: selected.productId,
        requestId: selected.id,
        againstStudentId: selected.sellerId,
        complaintType,
        description: description.trim(),
      };

      const createdComplaint = await createComplaint(complaintData);

      onSubmit?.(createdComplaint);

      setShowConfirm(false);
      resetForm();
    } catch (error) {
      console.error("Error creating complaint:", error);
      setSubmitError(
        error.response?.data?.message || "Failed to submit complaint. Please try again."
      );
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Step 1: pick the transaction ----------
  if (!selected) {
    return (
      <div className="dash-section">
        <div className="section-header">
          <h1>Raise Complaint</h1>
        </div>

        {completedTransactions.length === 0 ? (
          <EmptyState subtitle="You can raise a complaint once you have a completed transaction." />
        ) : (
          <div className="complaint-picker-list">
            {completedTransactions.map((t) => (
              <button
                key={t.id}
                type="button"
                className="complaint-picker-item"
                onClick={() => setSelected(t)}
              >
                {resolveImageUrl(t.productImage) ? (
                  <div className="complaint-picker-thumb">
                    <img src={resolveImageUrl(t.productImage)} alt={t.productName} />
                  </div>
                ) : (
                  <div className="complaint-picker-thumb">
                    <ImagePlaceholder />
                  </div>
                )}
                <div className="complaint-picker-text">
                  <strong>{t.productName}</strong>
                  <span>{t.type} · with {t.sellerName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------- Step 2: fill out the complaint ----------
  return (
    <div className="dash-section">
      <button className="dash-back-link" onClick={resetForm}>
        <FaArrowLeft /> Choose a different transaction
      </button>

      <div className="section-header">
        <h1>Raise Complaint</h1>
      </div>

      <div className="complaint-form-card">
        <div className="complaint-form-subject">
          {resolveImageUrl(selected.productImage) ? (
            <div className="complaint-form-subject-thumb">
              <img src={resolveImageUrl(selected.productImage)} alt={selected.productName} />
            </div>
          ) : (
            <div className="complaint-form-subject-thumb">
              <ImagePlaceholder />
            </div>
          )}
          <div className="complaint-form-subject-text">
            <strong>{selected.productName}</strong>
            <span>{selected.type} · with {selected.sellerName}</span>
          </div>
        </div>

        <div className="dash-field-group">
          <label>Type of problem</label>
          <div className="complaint-type-grid">
            {COMPLAINT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`complaint-type-chip ${complaintType === t.value ? "complaint-type-chip-active" : ""}`}
                onClick={() => {
                  setComplaintType(t.value);
                  setErrors((errs) => ({ ...errs, complaintType: "" }));
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {errors.complaintType && <span className="field-error-msg">{errors.complaintType}</span>}
        </div>

        <div className="dash-field-group">
          <label>Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((errs) => ({ ...errs, description: "" }));
            }}
            placeholder="Describe what happened..."
            className={errors.description ? "input-error" : ""}
          />
          {errors.description && <span className="field-error-msg">{errors.description}</span>}
        </div>

        <div className="dash-field-group">
          <label>Evidence (optional)</label>
          <div className="evidence-row">
            {evidenceFiles.map((f, i) => (
              <div key={f.previewUrl} className="evidence-thumb">
                <img src={f.previewUrl} alt={`Evidence ${i + 1}`} />
                <button
                  type="button"
                  className="evidence-remove"
                  onClick={() => removeEvidence(i)}
                  aria-label="Remove photo"
                >
                  <FaTimes />
                </button>
              </div>
            ))}

            {evidenceFiles.length < MAX_EVIDENCE && (
              <label className="evidence-add">
                <FaCamera />
                <span>Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEvidenceChange}
                  hidden
                />
              </label>
            )}
          </div>
          <span className="evidence-hint">
            Up to {MAX_EVIDENCE} photos. Helpful for damaged or wrong items.
          </span>
        </div>

        {submitError && <div className="field-error-msg">{submitError}</div>}

        <button
          className="dash-btn dash-btn-primary dash-btn-block"
          onClick={handleSubmitClick}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Complaint"}
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Submit this complaint?"
          message={`This will be filed against ${selected.sellerName} regarding "${selected.productName}".`}
          confirmLabel="Submit"
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

export default RaiseComplaintSection;