import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import ConfirmDialog from "../components/ConfirmDialog";
import { COMPLAINT_TYPES } from "../constants";
import "./RaiseComplaintSection.css";

/* Two-step flow:
   1. Pick which completed transaction the complaint is about — only
      transactions with a finished pickup are eligible, since you can't
      meaningfully complain about something that never happened.
   2. Fill out the complaint (complaint_type + description — the rest
      of complaint_table's fields: complainant_id, against_id, prd_id,
      req_id, status, created_at are all filled in automatically from
      the selected transaction, not asked of the user). */
function RaiseComplaintSection({ completedTransactions, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [complaintType, setComplaintType] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const resetForm = () => {
    setSelected(null);
    setComplaintType("");
    setDescription("");
    setErrors({});
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

  const handleConfirm = () => {
    onSubmit({
      productId: selected.productId,
      productName: selected.productName,
      productImage: selected.productImage,
      requestId: selected.id,
      againstName: selected.sellerName,
      complaintType,
      description: description.trim(),
    });
    setShowConfirm(false);
    resetForm();
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
                {t.productImage ? (
                  <div className="complaint-picker-thumb">
                    <img src={t.productImage} alt={t.productName} />
                  </div>
                ) : (
                  <div className="complaint-picker-thumb">
                    <ImagePlaceholder />
                  </div>
                )}
                <div className="complaint-picker-text">
                  <strong>{t.productName}</strong>
                  <span>{t.type} &middot; with {t.sellerName}</span>
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
          {selected.productImage ? (
            <div className="complaint-form-subject-thumb">
              <img src={selected.productImage} alt={selected.productName} />
            </div>
          ) : (
            <div className="complaint-form-subject-thumb">
              <ImagePlaceholder />
            </div>
          )}
          <div>
            <strong>{selected.productName}</strong>
            <span>
              {selected.type} &middot; with {selected.sellerName}
            </span>
          </div>
        </div>

        <div className="dash-field-group" style={{ marginBottom: 16 }}>
          <label>Complaint Type</label>
          <select
            value={complaintType}
            onChange={(e) => {
              setComplaintType(e.target.value);
              setErrors((errs) => ({ ...errs, complaintType: "" }));
            }}
            className={errors.complaintType ? "input-error" : ""}
          >
            <option value="" disabled>
              Select a type
            </option>
            {COMPLAINT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {errors.complaintType && <span className="field-error-msg">{errors.complaintType}</span>}
        </div>

        <div className="dash-field-group" style={{ marginBottom: 20 }}>
          <label>Description</label>
          <textarea
            rows={5}
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

        <button className="dash-btn dash-btn-primary dash-btn-block" onClick={handleSubmitClick}>
          Submit Complaint
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