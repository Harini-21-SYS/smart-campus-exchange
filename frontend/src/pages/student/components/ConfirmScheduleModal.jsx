import { useState } from "react";
import { FaMapMarkerAlt, FaClock, FaCheckCircle, FaCalendarAlt } from "react-icons/fa";
import "./RequestModals.css";

// Combines the backend's separate pickupDate ("2026-09-13") and
// pickupTime ("11:00:00") into one readable string.
function formatPickupDateTime(pickupDate, pickupTime) {
  if (!pickupDate && !pickupTime) return "—";

  const dateStr = pickupDate
    ? new Date(pickupDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const timeStr = pickupTime ? pickupTime.slice(0, 5) : null;

  return [dateStr, timeStr].filter(Boolean).join(" at ");
}

/* Shown to the BUYER while pickupStatus is SCHEDULED — the seller has
   proposed a location/date/time and the buyer must either confirm it
   (-> CONFIRMED, unlocks the day-of handover) or ask for a different
   time (-> RESCHEDULE_REQUESTED, seller has to re-propose). */
function ConfirmScheduleModal({ request, onCancel, onConfirm, onRequestReschedule }) {
  const [mode, setMode] = useState("review"); // "review" | "reschedule"
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  };

  const handleSubmitReschedule = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    await onRequestReschedule(reason.trim());
    setSubmitting(false);
  };

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === "review" ? "Review Pickup Schedule" : "Request a Different Time"}</h2>

        {mode === "review" ? (
          <>
            <p className="dash-modal-desc">
              {request.sellerName} proposed the following pickup details for{" "}
              <strong>{request.productName}</strong>:
            </p>

            <div className="pickup-details-card">
              <p>
                <FaMapMarkerAlt /> {request.pickupLocation || "—"}
              </p>
              <p>
                <FaClock /> {formatPickupDateTime(request.pickupDate, request.pickupTime)}
              </p>
            </div>

            <div className="confirm-btn-row">
              <button
                className="dash-btn dash-btn-outline"
                onClick={() => setMode("reschedule")}
                disabled={submitting}
              >
                <FaCalendarAlt /> Request Different Time
              </button>
              <button
                className="dash-btn dash-btn-primary"
                onClick={handleConfirm}
                disabled={submitting}
              >
                <FaCheckCircle /> Confirm Schedule
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="dash-modal-desc">
              Let {request.sellerName} know why this time/location doesn't work — they'll be able
              to propose a new one.
            </p>

            <textarea
              className="dash-textarea"
              rows={3}
              placeholder="e.g. I have class at that time, can we meet an hour later?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="confirm-btn-row">
              <button
                className="dash-btn dash-btn-outline"
                onClick={() => setMode("review")}
                disabled={submitting}
              >
                Back
              </button>
              <button
                className="dash-btn dash-btn-primary"
                onClick={handleSubmitReschedule}
                disabled={submitting || !reason.trim()}
              >
                Send Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ConfirmScheduleModal;