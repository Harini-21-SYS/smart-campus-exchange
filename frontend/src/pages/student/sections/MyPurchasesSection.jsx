import { useState } from "react";
import { FaStar, FaExclamationTriangle } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import RatingModal from "../components/RatingModal";
import { TYPE_INFO } from "../constants";
import { timeAgo } from "../utils/DashboardUtils";
import ZoomableImage from "../components/ZoomableImage";
import "./MyPurchasesSection.css";

const API_ORIGIN = "http://localhost:8081";

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}

// Newest first, by purchase time. Anything without a parseable time
// sinks to the bottom instead of throwing the sort off.
function sortByTimeDesc(items) {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.time).getTime();
    const timeB = new Date(b.time).getTime();
    const validA = !isNaN(timeA);
    const validB = !isNaN(timeB);
    if (!validA && !validB) return 0;
    if (!validA) return 1;
    if (!validB) return -1;
    return timeB - timeA;
  });
}

function MyPurchasesSection({ purchases, onRateSeller, onGoToComplaint }) {
  const [ratingFor, setRatingFor] = useState(null);

  // Optimistic overlay: as soon as a rating is submitted successfully,
  // record it here so the UI flips from "Rate Seller" to the readonly
  // stars immediately — regardless of whether the parent's `purchases`
  // prop gets refreshed with the new myRating in time (or at all).
  const [optimisticRatings, setOptimisticRatings] = useState({});

  const handleRatingSubmit = async (values) => {
    const target = ratingFor;
    await onRateSeller?.(target, values);
    setOptimisticRatings((prev) => ({ ...prev, [target.id]: values.rating }));
    setRatingFor(null);
  };

  const sortedPurchases = sortByTimeDesc(purchases);

  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>My Purchases</h1>
      </div>

      {purchases.length === 0 ? (
        <EmptyState subtitle="You haven't completed any purchases yet." />
      ) : (
        <div className="purchase-list">
          {sortedPurchases.map((p) => {
              const info = TYPE_INFO[p.type] || TYPE_INFO.Sell;
              const imageUrl = resolveImageUrl(p.productImage);
              const myRating = p.myRating ?? optimisticRatings[p.id] ?? null;
              const hasRated = myRating != null;

              return (
                <div key={p.id} className="purchase-card">
                                    <div className="purchase-card-thumb">
                    {imageUrl ? (
                      <ZoomableImage src={imageUrl} alt={p.productName} />
                    ) : (
                      <ImagePlaceholder />
                    )}
                  </div>

                  <div className="purchase-card-main">
                    <span className={`pcard-type-badge ${info.badgeClass}`}>{p.type}</span>
                    <h4>{p.productName}</h4>
                    <p>From {p.sellerName}</p>

                    {hasRated ? (
                      <div className="rating-readonly" title={`You rated ${myRating}/5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <FaStar key={n} style={{ opacity: n <= myRating ? 1 : 0.25 }} />
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="dash-btn dash-btn-outline dash-btn-sm"
                        onClick={() => setRatingFor(p)}
                      >
                        Rate Seller
                      </button>
                    )}
                  </div>

                  <div className="purchase-card-side">
                    <span className="purchase-price">
                      {p.type === "Sell" && p.price ? `₹${p.price}` : "Free"}
                    </span>
                    <span className="purchase-time">{timeAgo(p.time)}</span>
                    <button
                      type="button"
                      className="purchase-complaint-link"
                      onClick={() => onGoToComplaint?.(p)}
                    >
                      <FaExclamationTriangle /> Report a problem
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {ratingFor && (
        <RatingModal
          purchase={ratingFor}
          onCancel={() => setRatingFor(null)}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
}

export default MyPurchasesSection;