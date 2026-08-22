import { useState } from "react";
import EmptyState from "./EmptyState";
import ImagePlaceholder from "./ImagePlaceholder";
import "./RequestModals.css";

/* Shown to the BUYER when requesting an Exchange — they must offer one
   of their own past purchases (products they previously acquired on
   this site) in return. `purchases` should be items from My Purchases. */
function SelectExchangeItemModal({ product, purchases, onCancel, onConfirm }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleConfirm = () => {
    const chosen = purchases.find((p) => p.id === selectedId);
    if (chosen) onConfirm(chosen);
  };

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal request-modal" onClick={(e) => e.stopPropagation()}>
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
            {purchases.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`exchange-picker-item ${selectedId === p.id ? "selected" : ""}`}
                onClick={() => setSelectedId(p.id)}
              >
                {p.productImage ? (
                  <div className="exchange-picker-thumb">
                    <img src={p.productImage} alt={p.productName} />
                  </div>
                ) : (
                  <div className="exchange-picker-thumb">
                    <ImagePlaceholder />
                  </div>
                )}
                <span>{p.productName}</span>
              </button>
            ))}
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