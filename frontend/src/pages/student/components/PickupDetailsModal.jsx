import { useState } from "react";
import { FaMapMarkerAlt, FaClock, FaCheck, FaBan } from "react-icons/fa";
import ImagePlaceholder from "./ImagePlaceholder";
import "./RequestModals.css";

/* Shown to the SELLER when responding to a pending request (Sell,
   Donate, or Exchange). For Exchange requests the offered item is
   shown so the seller can evaluate it before deciding. Accepting
   requires a pickup location + time; rejecting doesn't. */
function PickupDetailsModal({ request, onCancel, onAccept, onReject }) {
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState(""); // combined value straight from <input type="datetime-local">
  const [error, setError] = useState("");

  const isExchange = request.type === "Exchange";

  const handleAcceptClick = () => {
    if (!location.trim() || !dateTime) {
      setError("Please provide both a pickup location and time.");
      return;
    }

    // FIX: datetime-local gives one combined string like
    // "2026-09-13T14:30" — date and time glued together with "T".
    // The backend's AcceptRequestRequest needs pickupDate and
    // pickupTime as two separate fields (it builds a PickupSchedule
    // with setPickupDate(...) / setPickupTime(...) independently), so
    // this was previously sending only the combined string as "time"
    // and nothing at all as "date" — that missing date is what the
    // backend's required-field check was rejecting with a 400.
    const [datePart, timePart] = dateTime.split("T");

    onAccept({
      location: location.trim(),
      date: datePart,
      time: timePart,
    });
  };

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Respond to Request</h2>
        <p className="dash-modal-desc">
          {request.requesterName} wants to {request.type.toLowerCase()}{" "}
          <strong>{request.productName}</strong>.
        </p>

        {isExchange && (
          <div className="offered-item-card">
            <span className="offered-item-label">Offered in exchange</span>
            <div className="offered-item-row">
              {request.offeredProduct?.productImage ? (
                <div className="offered-item-thumb">
                  <img
                    src={request.offeredProduct.productImage}
                    alt={request.offeredProduct.productName}
                  />
                </div>
              ) : (
                <div className="offered-item-thumb">
                  <ImagePlaceholder />
                </div>
              )}
              <div>
                <strong>{request.offeredProduct?.productName || "Unknown item"}</strong>
                <span>{request.offeredProduct?.category}</span>
              </div>
            </div>
          </div>
        )}

        {request.message && <p className="request-modal-message">"{request.message}"</p>}

        <div className="request-modal-fields">
          <div className="dash-field-group">
            <label>
              <FaMapMarkerAlt /> Pickup Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Gate, Block C Lobby"
            />
          </div>
          <div className="dash-field-group">
            <label>
              <FaClock /> Pickup Date &amp; Time
            </label>
            <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
          </div>
          {error && <span className="field-error-msg">{error}</span>}
        </div>

        <div className="confirm-btn-row">
          <button className="dash-btn dash-btn-danger" onClick={onReject}>
            <FaBan /> Reject
          </button>
          <button className="dash-btn dash-btn-primary" onClick={handleAcceptClick}>
            <FaCheck /> Accept &amp; Send Pickup Details
          </button>
        </div>
        <button type="button" className="request-modal-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PickupDetailsModal;