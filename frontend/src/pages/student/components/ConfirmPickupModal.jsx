import { FaMapMarkerAlt, FaClock, FaCheckCircle } from "react-icons/fa";
import "./RequestModals.css";

// Combines the backend's separate pickupDate ("2026-09-13") and
// pickupTime ("11:00:00") into one readable string. Previously this
// modal did `new Date(request.pickupTime).toLocaleString()` on just
// the time value alone — not a valid date on its own, hence
// "Invalid Date" — same bug already fixed in MyRequestsSection.jsx.
function formatPickupDateTime(pickupDate, pickupTime) {
  if (!pickupDate && !pickupTime) return "—";

  const dateStr = pickupDate
    ? new Date(pickupDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const timeStr = pickupTime ? pickupTime.slice(0, 5) : null; // "11:00:00" -> "11:00"

  return [dateStr, timeStr].filter(Boolean).join(" at ");
}

/* Shown to the BUYER once the seller has accepted and supplied a
   pickup location + time — the buyer reviews and confirms it. */
function ConfirmPickupModal({ request, onCancel, onConfirm }) {
  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm Pickup</h2>
        <p className="dash-modal-desc">
          {request.sellerName} accepted your request for <strong>{request.productName}</strong>{" "}
          and proposed the following pickup details:
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
          <button className="dash-btn dash-btn-outline" onClick={onCancel}>
            Not Now
          </button>
          <button className="dash-btn dash-btn-primary" onClick={onConfirm}>
            <FaCheckCircle /> Confirm Pickup
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmPickupModal;