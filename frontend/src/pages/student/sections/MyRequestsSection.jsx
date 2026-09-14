import { useState, useEffect } from "react";
import { FaBan } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import ConfirmPickupModal from "../components/ConfirmPickupModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { TYPE_INFO } from "../constants";
import { timeAgo } from "../utils/DashboardUtils";
import "./RequestList.css";

// Combines the backend's separate pickupDate ("2026-09-13") and
// pickupTime ("11:00:00") into one readable string. Previously this
// tried `new Date(r.pickupTime).toLocaleString()` on just the time
// value alone, which isn't a valid date and would render "Invalid
// Date" or similar.
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

function MyRequestsSection({
  requests,
  onCancel,
  onConfirmPickup,
  notificationTargetId,
}) {

  const [confirmingPickupFor, setConfirmingPickupFor] =
    useState(null);

  const [cancelTarget, setCancelTarget] =
    useState(null);


  // ========================================
  // NOTIFICATION TARGET HANDLING
  // ========================================

  useEffect(() => {

    if (!notificationTargetId) return;

    setTimeout(() => {

      const element =
        document.getElementById(
          `my-request-${notificationTargetId}`
        );

      if (element) {

        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

      }

    }, 100);

  }, [notificationTargetId, requests]);


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

        <EmptyState
          subtitle="You haven't requested anything yet."
        />

      ) : (

        <div className="request-list">

          {requests
            .slice()
            .reverse()
            .map((r) => {

              const info =
                TYPE_INFO[r.type] ||
                TYPE_INFO.Sell;

              // FIX: real backend statuses are PENDING / ACCEPTED /
              // REJECTED on the request itself, and SCHEDULED /
              // COMPLETED on the separate pickup schedule — there is
              // no AWAITING_CONFIRMATION or CONFIRMED request status
              // on the backend at all (those were mock-only values).
              const status = (r.status || "").toUpperCase();
              const pickupStatus = (r.pickupStatus || "").toUpperCase();

              const isPending = status === "PENDING";
              const needsPickupConfirmation =
                status === "ACCEPTED" && pickupStatus === "SCHEDULED";
              const pickupConfirmed =
                status === "ACCEPTED" && pickupStatus === "COMPLETED";


              return (

                <div
                  key={r.id}
                  id={`my-request-${r.id}`}
                  className="request-card"
                >

                  <div className="request-card-main">

                    <span
                      className={`pcard-type-badge ${info.badgeClass}`}
                    >
                      {r.type}
                    </span>


                    <h4>
                      {r.productName}
                    </h4>


                    <p>
                      To {r.sellerName}
                    </p>


                    {r.message && (

                      <p className="request-message">
                        "{r.message}"
                      </p>

                    )}


                    {r.type === "Exchange" &&
                      r.offeredProduct && (

                      <div className="request-offered-item">

                        {r.offeredProduct.productImage ? (

                          <div className="request-offered-item-thumb">

                            <img
                              src={
                                r.offeredProduct
                                  .productImage
                              }
                              alt={
                                r.offeredProduct
                                  .productName
                              }
                            />

                          </div>

                        ) : (

                          <div className="request-offered-item-thumb">

                            <ImagePlaceholder />

                          </div>

                        )}


                        <span>

                          You offered:{" "}

                          {
                            r.offeredProduct
                              .productName
                          }

                        </span>

                      </div>

                    )}


                    {needsPickupConfirmation && (

                      <div className="request-pickup-info">

                        <span>
                          📍 {r.pickupLocation || "—"}
                        </span>

                        <span>
                          🕓 {formatPickupDateTime(r.pickupDate, r.pickupTime)}
                        </span>

                      </div>

                    )}


                    {pickupConfirmed && (

                      <div className="request-pickup-info">

                        <span>
                          📍 {r.pickupLocation || "—"}
                        </span>

                        <span>
                          🕓 {formatPickupDateTime(r.pickupDate, r.pickupTime)}
                          {" (confirmed)"}
                        </span>

                      </div>

                    )}

                  </div>


                  <div className="request-card-side">

                    <span
                      className={`request-status request-status-${status.toLowerCase()}`}
                    >

                      {status.replace("_", " ")}

                    </span>


                    <span className="request-time">

                      {timeAgo(r.time)}

                    </span>


                    {isPending && (

                      <button
                        className="dash-btn dash-btn-danger dash-btn-sm"
                        onClick={() =>
                          setCancelTarget(r)
                        }
                      >

                        <FaBan />

                        Cancel

                      </button>

                    )}


                    {needsPickupConfirmation && (

                      <button
                        className="dash-btn dash-btn-primary dash-btn-sm"
                        onClick={() =>
                          setConfirmingPickupFor(r)
                        }
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
          onCancel={() =>
            setConfirmingPickupFor(null)
          }
          onConfirm={handleConfirmPickup}
        />

      )}


      {cancelTarget && (

        <ConfirmDialog
          title="Cancel this request?"
          message={`Your request for "${cancelTarget.productName}" will be withdrawn.`}
          confirmLabel="Cancel Request"
          onCancel={() =>
            setCancelTarget(null)
          }
          onConfirm={
            handleConfirmCancel
          }
        />

      )}

    </div>

  );

}

export default MyRequestsSection;