import { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import "./RequestModals.css";

function ProposeNewTimeModal({ request, onCancel, onSubmit }) {
  const [location, setLocation] = useState(request.pickupLocation || "");
  const [date, setDate] = useState(request.pickupDate || "");
  const [time, setTime] = useState(
    request.pickupTime ? request.pickupTime.slice(0, 5) : ""
  );
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = location.trim() && date && time;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({ location: location.trim(), date, time });
    setSubmitting(false);
  };

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Propose a New Time</h2>
        <p className="dash-modal-desc">
          {request.requesterName} asked for a different time for{" "}
          <strong>{request.productName}</strong>.
        </p>

        <div className="request-modal-fields">
          <div className="dash-field-group">
            <label>Location</label>
            <input
              className="dash-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Gate, Block A"
            />
          </div>

          <div className="request-modal-fields-row">
            <div className="dash-field-group">
              <label>Date</label>
              <input
                className="dash-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="dash-field-group">
              <label>Time</label>
              <input
                className="dash-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="confirm-btn-row">
          <button className="dash-btn dash-btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className="dash-btn dash-btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
          >
            <FaCalendarAlt /> Send New Time
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProposeNewTimeModal;