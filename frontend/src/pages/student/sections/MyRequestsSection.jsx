import { useState, useEffect } from "react";
import { FaBan } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import ConfirmScheduleModal from "../components/ConfirmScheduleModal";
import DeliveryIssueModal from "../components/DeliveryIssueModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { TYPE_INFO } from "../constants";
import { timeAgo } from "../utils/DashboardUtils";
import "./RequestList.css";

// Combines the backend's separate pickupDate ("2026-09-13") and
// pickupTime ("11:00:00") into one readable string.
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
  onConfirmSchedule,
  onRequestReschedule,
  onConfirmReceived,
  onReportDeliveryIssue,
  notificationTargetId,
}) {

  // Buyer reviewing the seller's proposed schedule (confirm / ask to reschedule)
  const [schedulingFor, setSchedulingFor] = useState(null);

  // Buyer confirming they actually received the item (simple yes/no confirm)
  const [confirmingReceiptFor, setConfirmingReceiptFor] = useState(null);

  // Buyer reporting a delivery issue instead
  const [reportingIssueFor, setReportingIssueFor] = useState(null);

  const [cancelTarget, setCancelTarget] = useState(null);


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


  const handleScheduleConfirm = async () => {
    await onConfirmSchedule(schedulingFor);
    setSchedulingFor(null);
  };

  const handleScheduleReschedule = async (reason) => {
    await onRequestReschedule(schedulingFor, reason);
    setSchedulingFor(null);
  };

  const handleReceiptConfirm = async () => {
    await onConfirmReceived(confirmingReceiptFor);
    setConfirmingReceiptFor(null);
  };

  const handleIssueSubmit = async (issueDetails) => {
    await onReportDeliveryIssue(reportingIssueFor, issueDetails);
    setReportingIssueFor(null);
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

              // Real backend statuses: PENDING / ACCEPTED / REJECTED
              // on the request itself, and on the separate pickup
              // schedule: SCHEDULED -> CONFIRMED ->
              // BUYER_CONFIRMATION_PENDING -> COMPLETED, with
              // RESCHEDULE_REQUESTED and DELIVERY_ISSUE as branches.
              const status = (r.status || "").toUpperCase();
              const pickupStatus = (r.pickupStatus || "").toUpperCase();

              const isPending = status === "PENDING";

              // Seller proposed a time — buyer hasn't acted yet.
              const needsScheduleReview =
                status === "ACCEPTED" && pickupStatus === "SCHEDULED";

              // Buyer asked for a different time, waiting on seller.
              const rescheduleRequested =
                status === "ACCEPTED" && pickupStatus === "RESCHEDULE_REQUESTED";

              // Buyer confirmed — waiting for the in-person handover.
              const awaitingHandover =
                status === "ACCEPTED" && pickupStatus === "CONFIRMED";

              // Seller marked it handed over — buyer must say yes/no.
              const needsReceiptConfirmation =
                status === "ACCEPTED" && pickupStatus === "BUYER_CONFIRMATION_PENDING";

              // Buyer reported a problem — under review via complaint.
              const deliveryIssueReported =
                status === "ACCEPTED" && pickupStatus === "DELIVERY_ISSUE";

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


                    {needsScheduleReview && (

                      <div className="request-pickup-info">

                        <span>
                          📍 {r.pickupLocation || "—"}
                        </span>

                        <span>
                          🕓 {formatPickupDateTime(r.pickupDate, r.pickupTime)}
                        </span>

                        <span>
                          {r.sellerName} proposed this pickup — review and confirm.
                        </span>

                      </div>

                    )}


                    {rescheduleRequested && (

                      <div className="request-pickup-info">

                        <span>
                          📍 {r.pickupLocation || "—"}
                        </span>

                        <span>
                          🕓 {formatPickupDateTime(r.pickupDate, r.pickupTime)}
                        </span>

                        <span>
                          You asked for a different time. Waiting for {r.sellerName} to
                          propose a new one.
                        </span>

                      </div>

                    )}


                    {awaitingHandover && (

                      <div className="request-pickup-info">

                        <span>
                          📍 {r.pickupLocation || "—"}
                        </span>

                        <span>
                          🕓 {formatPickupDateTime(r.pickupDate, r.pickupTime)}
                        </span>

                        <span>
                          Waiting for the seller to hand over the item at the scheduled time.
                        </span>

                      </div>

                    )}


                    {needsReceiptConfirmation && (

                      <div className="request-pickup-info">

                        <span>
                          📍 {r.pickupLocation || "—"}
                        </span>

                        <span>
                          🕓 {formatPickupDateTime(r.pickupDate, r.pickupTime)}
                        </span>

                        <span>
                          The seller marked this as handed over. Did you receive it?
                        </span>

                      </div>

                    )}


                    {deliveryIssueReported && (

                      <div className="request-pickup-info">

                        <span>
                          Issue reported — a complaint has been filed and is under review.
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


                    {needsScheduleReview && (

                      <button
                        className="dash-btn dash-btn-primary dash-btn-sm"
                        onClick={() => setSchedulingFor(r)}
                      >
                        Review Schedule
                      </button>

                    )}


                    {needsReceiptConfirmation && (

                      <>
                        <button
                          className="dash-btn dash-btn-primary dash-btn-sm"
                          onClick={() => setConfirmingReceiptFor(r)}
                        >
                          Yes, Received
                        </button>

                        <button
                          className="dash-btn dash-btn-outline dash-btn-sm"
                          onClick={() => setReportingIssueFor(r)}
                        >
                          Report an Issue
                        </button>
                      </>

                    )}

                  </div>

                </div>

              );

            })}

        </div>

      )}


      {schedulingFor && (

        <ConfirmScheduleModal
          request={schedulingFor}
          onCancel={() => setSchedulingFor(null)}
          onConfirm={handleScheduleConfirm}
          onRequestReschedule={handleScheduleReschedule}
        />

      )}


      {confirmingReceiptFor && (

        <ConfirmDialog
          title="Confirm you received the item?"
          message={`This marks "${confirmingReceiptFor.productName}" as received and moves it to My Purchases.`}
          confirmLabel="Yes, I Received It"
          onCancel={() => setConfirmingReceiptFor(null)}
          onConfirm={handleReceiptConfirm}
        />

      )}


      {reportingIssueFor && (

        <DeliveryIssueModal
          request={reportingIssueFor}
          onCancel={() => setReportingIssueFor(null)}
          onSubmit={handleIssueSubmit}
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