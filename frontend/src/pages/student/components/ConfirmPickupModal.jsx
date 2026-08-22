import { FaMapMarkerAlt, FaClock, FaCheckCircle } from "react-icons/fa";
import "./RequestModals.css";

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
            <FaMapMarkerAlt /> {request.pickupLocation}
          </p>
          <p>
            <FaClock /> {request.pickupTime ? new Date(request.pickupTime).toLocaleString() : "—"}
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