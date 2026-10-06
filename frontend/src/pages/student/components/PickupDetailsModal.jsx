import { useState } from "react";
import { FaMapMarkerAlt, FaClock, FaCheck, FaBan, FaThumbsUp, FaArrowLeft } from "react-icons/fa";
import ImagePlaceholder from "./ImagePlaceholder";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll";
import "./RequestModals.css";
import ZoomableImage from "./ZoomableImage";

/* Shown to the SELLER when responding to a pending request.

   For Sell/Donate requests there's nothing to evaluate beyond the
   request itself, so this goes straight to the schedule form.

   For Exchange requests, the seller needs a real checkpoint to judge
   the offered item BEFORE being asked to commit to a pickup time —
   otherwise "Accept & Send Pickup Details" is the only button, which
   silently also accepts an item the seller never actually looked at.
   So this is a two-step flow for exchanges:
     1. "review"   — show the offered item, seller either rejects the
                     whole request outright, or confirms the item is
                     acceptable and moves on.
     2. "schedule" — location + date/time fields, same as before.
   Sell/Donate requests skip straight to "schedule". */
function PickupDetailsModal({ request, onCancel, onAccept, onReject }) {
  useLockBodyScroll();

  const isExchange = request.type === "Exchange";

  const [step, setStep] = useState(isExchange ? "review" : "schedule");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [error, setError] = useState("");

  const handleAcceptClick = () => {
    if (!location.trim() || !dateTime) {
      setError("Please provide both a pickup location and time.");
      return;
    }

    // datetime-local gives one combined string like
    // "2026-09-13T14:30" — date and time glued together with "T".
    // The backend needs pickupDate and pickupTime as two separate
    // fields, so split it here.
    const [datePart, timePart] = dateTime.split("T");

    onAccept({
      location: location.trim(),
      date: datePart,
      time: timePart,
    });
  };

  // ---------- Step 1 (exchange only): review the offered item ----------
  if (step === "review") {
    return (
      <div className="dash-modal-overlay" onClick={onCancel}>
        <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
          <h2>Review Offered Item</h2>
          <p className="dash-modal-desc">
            {request.requesterName} wants to exchange for{" "}
            <strong>{request.productName}</strong>, offering the item below in return.
          </p>

          <div className="offered-item-card">
            <span className="offered-item-label">Offered in exchange</span>
            <div className="offered-item-row">
                            {request.offeredProduct?.productImage ? (
                <div className="offered-item-thumb">
                  <ZoomableImage
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
                {request.offeredProduct?.category && (
                  <span>{request.offeredProduct.category}</span>
                )}
              </div>
            </div>
          </div>

          {request.message && <p className="request-modal-message">"{request.message}"</p>}

          <p className="dash-modal-desc" style={{ marginTop: 4 }}>
            Is this item acceptable? If not, reject the request now — no schedule needed.
          </p>

          <div className="confirm-btn-row">
            <button className="dash-btn dash-btn-danger" onClick={onReject}>
              <FaBan /> Reject
            </button>
            <button className="dash-btn dash-btn-primary" onClick={() => setStep("schedule")}>
              <FaThumbsUp /> Item Looks Good
            </button>
          </div>
          <button type="button" className="request-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---------- Step 2 (or the only step, for Sell/Donate): schedule pickup ----------
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
                {request.offeredProduct?.category && (
                  <span>{request.offeredProduct.category}</span>
                )}
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

        {isExchange && (
          <button
            type="button"
            className="request-modal-cancel"
            onClick={() => setStep("review")}
            style={{ marginTop: 8 }}
          >
            <FaArrowLeft /> Back to item review
          </button>
        )}
        <button type="button" className="request-modal-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PickupDetailsModal;