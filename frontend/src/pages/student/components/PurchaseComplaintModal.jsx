import { useState } from "react";
import { COMPLAINT_TYPES } from "../constants";
import "./RequestModals.css";

function PurchaseComplaintModal({ purchase, onCancel, onSubmit }) {
  const [complaintType, setComplaintType] = useState(COMPLAINT_TYPES[0].value);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({ complaintType, description: description.trim() });
    setSubmitting(false);
  };

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Raise a Complaint</h2>
        <p className="dash-modal-desc">
          About <strong>{purchase.productName}</strong> from {purchase.sellerName}.
        </p>

        <div className="request-modal-fields">
          <div className="dash-field-group">
            <label>Type of problem</label>
            <select
              className="dash-select"
              value={complaintType}
              onChange={(e) => setComplaintType(e.target.value)}
            >
              {COMPLAINT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="dash-field-group">
            <label>Details</label>
            <textarea
              className="dash-textarea"
              rows={3}
              placeholder="What happened?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="confirm-btn-row">
          <button className="dash-btn dash-btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className="dash-btn dash-btn-danger"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
          >
            Submit Complaint
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseComplaintModal;