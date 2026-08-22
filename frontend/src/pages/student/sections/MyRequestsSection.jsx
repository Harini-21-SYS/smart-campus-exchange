import { useState } from "react";
import { FaBan } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import ConfirmPickupModal from "../components/ConfirmPickupModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { TYPE_INFO, REQUEST_STATUS } from "../constants";
import { timeAgo } from "../utils/DashboardUtils";
import "./RequestList.css";

/* Requests YOU sent for other students' listings.
   - Pending: can still be cancelled.
   - Awaiting confirmation: seller accepted and proposed pickup details —
     review and confirm them here.
   - Confirmed / Rejected: read-only status. */
function MyRequestsSection({ requests, onCancel, onConfirmPickup }) {
  const [confirmingPickupFor, setConfirmingPickupFor] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const handleConfirmPickup = () => {
    onConfirmPickup(confirmingPickupFor);
    setConfirmingPickupFor(null);
  };

  const handleConfirmCancel = () => {
    onCancel(cancelTarget);
    setCancelTarget(null);
  };

  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>My Requests</h1>
      </div>

      {requests.length === 0 ? (
        <EmptyState subtitle="You haven't requested anything yet." />
      ) : (
        <div className="request-list">
          {requests
            .slice()
            .reverse()
            .map((r) => {
              const info = TYPE_INFO[r.type] || TYPE_INFO.Sell;
              return (
                <div key={r.id} className="request-card">
                  <div className="request-card-main">
                    <span className={`pcard-type-badge ${info.badgeClass}`}>{r.type}</span>
                    <h4>{r.productName}</h4>
                    <p>To {r.sellerName}</p>
                    {r.message && <p className="request-message">"{r.message}"</p>}

                    {r.type === "Exchange" && r.offeredProduct && (
                      <div className="request-offered-item">
                        {r.offeredProduct.productImage ? (
                          <div className="request-offered-item-thumb">
                            <img
                              src={r.offeredProduct.productImage}
                              alt={r.offeredProduct.productName}
                            />
                          </div>
                        ) : (
                          <div className="request-offered-item-thumb">
                            <ImagePlaceholder />
                          </div>
                        )}
                        <span>You offered: {r.offeredProduct.productName}</span>
                      </div>
                    )}

                    {r.status === REQUEST_STATUS.AWAITING_CONFIRMATION && (
                      <div className="request-pickup-info">
                        <span>📍 {r.pickupLocation}</span>
                        <span>
                          🕓 {r.pickupTime ? new Date(r.pickupTime).toLocaleString() : "—"}
                        </span>
                      </div>
                    )}

                    {r.status === REQUEST_STATUS.CONFIRMED && (
                      <div className="request-pickup-info">
                        <span>📍 {r.pickupLocation}</span>
                        <span>
                          🕓 {r.pickupTime ? new Date(r.pickupTime).toLocaleString() : "—"} (confirmed)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="request-card-side">
                    <span className={`request-status request-status-${r.status}`}>
                      {r.status.replace("_", " ")}
                    </span>
                    <span className="request-time">{timeAgo(r.time)}</span>

                    {r.status === REQUEST_STATUS.PENDING && (
                      <button
                        className="dash-btn dash-btn-danger dash-btn-sm"
                        onClick={() => setCancelTarget(r)}
                      >
                        <FaBan /> Cancel
                      </button>
                    )}

                    {r.status === REQUEST_STATUS.AWAITING_CONFIRMATION && (
                      <button
                        className="dash-btn dash-btn-primary dash-btn-sm"
                        onClick={() => setConfirmingPickupFor(r)}
                      >
                        Confirm Pickup
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {confirmingPickupFor && (
        <ConfirmPickupModal
          request={confirmingPickupFor}
          onCancel={() => setConfirmingPickupFor(null)}
          onConfirm={handleConfirmPickup}
        />
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel this request?"
          message={`Your request for "${cancelTarget.productName}" will be withdrawn.`}
          confirmLabel="Cancel Request"
          onCancel={() => setCancelTarget(null)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}

export default MyRequestsSection;