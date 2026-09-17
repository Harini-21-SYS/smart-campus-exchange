import { useState } from "react";
import "./RequestModals.css";

// Must match PickupScheduleServiceImpl.reportDeliveryIssue's validReasons
// list exactly — the backend rejects anything else with 400.
const ISSUE_REASONS = [
  { value: "PRODUCT_NOT_RECEIVED", label: "Never received it" },
  { value: "SELLER_DID_NOT_COME", label: "Seller didn't show up" },
  { value: "WRONG_PRODUCT", label: "Wrong product" },
  { value: "DAMAGED_PRODUCT", label: "Arrived damaged" },
  { value: "SELLER_NOT_RESPONDING", label: "Seller not responding" },
  { value: "OTHER", label: "Something else" },
];

/* Shown to the BUYER when pickupStatus is BUYER_CONFIRMATION_PENDING
   and they choose "Report an Issue" instead of confirming receipt.
   Submitting this calls reportDeliveryIssue, which on the backend
   also auto-files a complaint against the seller. */
function DeliveryIssueModal({ request, onCancel, onSubmit }) {
  const [reason, setReason] = useState(null);
  const [description, setDescription] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = reason !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({ issueReason: reason, description: description.trim() || null });
    setSubmitting(false);
  };

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
        <h2>What went wrong?</h2>
        <p className="dash-modal-desc">
          For <strong>{request.productName}</strong> from {request.sellerName}. This also files a
          complaint against them.
        </p>

        <div className="issue-reason-grid">
          {ISSUE_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              className={`issue-reason-chip ${reason === r.value ? "issue-reason-chip-active" : ""}`}
              onClick={() => setReason(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {!showDetails ? (
          <button
            type="button"
            className="optional-details-toggle"
            onClick={() => setShowDetails(true)}
          >
            + Add details (optional)
          </button>
        ) : (
          <textarea
            className="dash-textarea"
            rows={2}
            placeholder="Any extra details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}

        <div className="confirm-btn-row">
          <button className="dash-btn dash-btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className="dash-btn dash-btn-danger"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryIssueModal;