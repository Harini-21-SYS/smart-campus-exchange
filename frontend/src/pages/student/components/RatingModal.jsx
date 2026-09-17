import { useState } from "react";
import { FaStar } from "react-icons/fa";
import "./RequestModals.css";

/* Shown from My Purchases once a pickup is COMPLETED and the buyer
   hasn't rated the seller yet. 1–5 stars, comment optional. */
function RatingModal({ purchase, onCancel, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    await onSubmit({ rating, comment: comment.trim() || null });
    setSubmitting(false);
  };

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Rate {purchase.sellerName}</h2>
        <p className="dash-modal-desc">
          How was your experience with <strong>{purchase.productName}</strong>?
        </p>

        <div className="rating-stars rating-stars-input">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={n <= (hoverRating || rating) ? "rated" : ""}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <FaStar />
            </button>
          ))}
        </div>

        <textarea
          className="dash-textarea"
          rows={3}
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ marginTop: 10 }}
        />

        <div className="confirm-btn-row">
          <button className="dash-btn dash-btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className="dash-btn dash-btn-primary"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;