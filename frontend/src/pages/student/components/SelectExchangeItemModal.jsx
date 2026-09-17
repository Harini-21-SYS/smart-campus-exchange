import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import EmptyState from "./EmptyState";
import ImagePlaceholder from "./ImagePlaceholder";
import "./RequestModals.css";

const API_ORIGIN = "http://localhost:8081";

// FIX: same class of bug fixed elsewhere — productImage came through
// as a raw backend-relative path with no origin prefix, so the <img>
// tried to load from localhost:5173 instead of localhost:8081 and
// failed, falling back to showing the raw alt text (exactly what the
// screenshot showed).
function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}

/* Shown to the BUYER when requesting an Exchange — they must offer one
   of their own past purchases (products they previously acquired on
   this site) in return. `purchases` should be items from My Purchases. */
function SelectExchangeItemModal({ product, purchases, onCancel, onConfirm }) {
  const [selectedId, setSelectedId] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  const handleConfirm = () => {
    const chosen = purchases.find((p) => p.id === selectedId);
    if (chosen) onConfirm(chosen);
  };

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal exchange-picker-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Select an Item to Offer</h2>
        <p className="dash-modal-desc">
          Choose one of your past purchases to offer in exchange for{" "}
          <strong>{product.name}</strong>. You can only offer items you've
          previously acquired on this site.
        </p>

        {purchases.length === 0 ? (
          <EmptyState subtitle="You need at least one confirmed purchase before you can request an exchange." />
        ) : (
          <div className="exchange-picker-list">
            {purchases.map((p) => {
              const imageUrl = resolveImageUrl(p.productImage);
              const isSelected = selectedId === p.id;
              const showImage = imageUrl && !failedImages[p.id];

              return (
                <button
                  key={p.id}
                  type="button"
                  className={`exchange-picker-item ${isSelected ? "exchange-picker-item-selected" : ""}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="exchange-picker-thumb">
                    {showImage ? (
                      <img
                        src={imageUrl}
                        alt={p.productName}
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [p.id]: true }))
                        }
                      />
                    ) : (
                      <ImagePlaceholder />
                    )}
                    {isSelected && (
                      <span className="exchange-picker-check">
                        <FaCheckCircle />
                      </span>
                    )}
                  </div>
                  <span className="exchange-picker-name">{p.productName}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="confirm-btn-row">
          <button className="dash-btn dash-btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="dash-btn dash-btn-primary"
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Offer This Item
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectExchangeItemModal;