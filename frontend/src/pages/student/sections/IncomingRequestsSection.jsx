// IncomingRequestsSection.jsx
import { useEffect, useState } from "react";
import { FaCheck, FaBan, FaChevronDown, FaChevronUp, FaUser } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import { TYPE_INFO } from "../constants";
import { timeAgo, deriveYearFromRegisterNumber } from "../utils/DashboardUtils";
import { getIncomingRequests, acceptRequest, rejectRequest } from "../../../services/requestService";
import {
  getPickupByRequestId,
  markAsHandedOver,
  reschedulePickup,
} from "../../../services/pickupService";
import "./RequestList.css";
import PickupDetailsModal from "../components/PickupDetailsModal";
import ProposeNewTimeModal from "../components/ProposeNewTimeModal";

const API_ORIGIN = "http://localhost:8081";

function normalizeStatus(status) {
  return (status || "pending").toLowerCase();
}

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}

function mapRequest(r) {
  return {
    id: r.id,

    productId:
      r.productId ??
      r.product?.id,

    productName:
      r.productTitle ??
      r.product?.title ??
      "Untitled listing",

    productImage: resolveImageUrl(
      r.productImage ??
      r.product?.images?.[0]?.imageUrl ??
      r.product?.images?.[0]?.url ??
      null
    ),

    requesterId:
      r.requesterId ??
      r.requester?.studentId,

    requesterName:
      r.requesterName ??
      r.requester?.fullName ??
      "Unknown Student",

    department:
      r.requesterDepartment ??
      r.requester?.department ??
      "—",

    year: deriveYearFromRegisterNumber(
      r.requesterRegisterNumber ?? r.requester?.registerNumber
    ),

   type:
  r.productType ??
  r.product?.type ??
  (r.requestType === "BUY"
    ? "Sell"
    : r.requestType === "EXCHANGE"
    ? "Exchange"
    : r.requestType === "DONATE"
    ? "Donate"
    : "Sell"),

    message:
      r.message ?? "",

    time:
      r.createdAt
        ? new Date(r.createdAt).getTime()
        : Date.now(),

    status:
  normalizeStatus(r.status),

pickupLocation:
  r.pickupLocation ??
  null,

pickupDate:
  r.pickupDate ??
  null,

pickupTime:
  r.pickupTime ??
  null,

pickupStatus:
  r.pickupStatus ??
  null,

// FIX: this is the buyer's explanation for asking for a different
// time (RequestServiceImpl.convertToResponse() only fills it in
// while pickupStatus is RESCHEDULE_REQUESTED). Without mapping it
// here, the seller had no way to see why the buyer objected to the
// proposed pickup.
rescheduleReason:
  r.rescheduleReason ??
  null,
};
}

function IncomingRequestsSection({
  requests,
  onToast,
  onRequestUpdated,
  notificationTargetId
}) {
  
 // const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reschedulingRequest, setReschedulingRequest] = useState(null);
  useEffect(() => {
  if (!notificationTargetId) return;

  setTimeout(() => {
    const element = document.getElementById(
      `request-${notificationTargetId}`
    );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setExpandedId(notificationTargetId);
    }
  }, 100);

}, [notificationTargetId, requests]);
  const notify = (message) => (onToast ? onToast(message) : console.log(message));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getIncomingRequests();
        if (!cancelled) setRequests((data || []).map(mapRequest));
      } catch (error) {
        console.error("Failed to load incoming requests:", error);
        if (!cancelled) {
          setLoadError(
            error.response?.data?.message || "Couldn't load incoming requests. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);


const handlePickupAccept = async ({ location, date, time }) => {

  if (!selectedRequest) return;

  const requestId = selectedRequest.id;

  setActingId(requestId);

  try {

    const response =
      await acceptRequest(
        requestId,
        {
          location,
          pickupDate: date,
          pickupTime: time,
        }
      );

    setRequests((prev) =>
      prev.map((r) =>
        String(r.id) === String(requestId)
          ? {
              ...r,

              status:
                normalizeStatus(
                  response.status ??
                  "ACCEPTED"
                ),

              pickupLocation:
                response.pickupLocation ??
                location,

              pickupDate:
                response.pickupDate ??
                date,

              pickupTime:
                response.pickupTime ??
                time,

              pickupStatus:
                response.pickupStatus ??
                "SCHEDULED",

              rescheduleReason: null,
            }
          : r
      )
    );

    await onRequestUpdated?.();

    notify(
      `Accepted ${selectedRequest.requesterName}'s request for "${selectedRequest.productName}".`
    );

    setSelectedRequest(null);

  } catch (error) {

    console.error(
      "Failed to accept request:",
      error
    );

    notify(
      error.response?.data?.message ||
      "Couldn't accept the request. Please try again."
    );

  } finally {

    setActingId(null);

  }

};
  const handleReject = async (request) => {

  setActingId(request.id);

  try {

    await rejectRequest(
      request.id
    );

    setRequests((prev) =>
      prev.map((r) =>
        String(r.id) ===
        String(request.id)
          ? {
              ...r,
              status: "rejected",
            }
          : r
      )
    );

    await onRequestUpdated?.();

    notify(
      `Declined ${request.requesterName}'s request for "${request.productName}".`
    );

  } catch (error) {

    console.error(
      "Failed to reject request:",
      error
    );

    notify(
      error.response?.data?.message ||
      "Couldn't decline the request. Please try again."
    );

  } finally {

    setActingId(null);

  }

};

  // ========================================
  // SELLER MARKS THE PRODUCT AS HANDED OVER
  // ========================================
  const handleMarkHandedOver = async (request) => {

    setActingId(request.id);

    try {

      const pickup = await getPickupByRequestId(request.id);
      const pickupId = pickup.pickupId ?? pickup.id;

      const updatedPickup = await markAsHandedOver(pickupId);

      setRequests((prev) =>
        prev.map((r) =>
          String(r.id) === String(request.id)
            ? {
                ...r,
                pickupStatus:
                  updatedPickup.status ??
                  "BUYER_CONFIRMATION_PENDING",
              }
            : r
        )
      );

      await onRequestUpdated?.();

      notify(
        `Marked "${request.productName}" as handed over to ${request.requesterName}. Waiting for their confirmation.`
      );

    } catch (error) {

      console.error(
        "Failed to mark as handed over:",
        error
      );

      notify(
        error.response?.data?.message ||
        "Couldn't mark this as handed over. Please try again."
      );

    } finally {

      setActingId(null);

    }
  };

  // ========================================
  // SELLER RE-PROPOSES A NEW TIME/LOCATION
  // ========================================
  const handleProposeNewTime = async ({ location, date, time }) => {

    if (!reschedulingRequest) return;

    const requestId = reschedulingRequest.id;

    setActingId(requestId);

    try {

      const pickup = await getPickupByRequestId(requestId);
      const pickupId = pickup.pickupId ?? pickup.id;

      const updatedPickup = await reschedulePickup(pickupId, {
        location,
        pickupDate: date,
        pickupTime: time,
      });

      setRequests((prev) =>
        prev.map((r) =>
          String(r.id) === String(requestId)
            ? {
                ...r,
                pickupLocation:
                  updatedPickup.pickupLocation ??
                  location,
                pickupDate:
                  updatedPickup.pickupDate ??
                  date,
                pickupTime:
                  updatedPickup.pickupTime ??
                  time,
                pickupStatus:
                  updatedPickup.status ??
                  "SCHEDULED",
                rescheduleReason: null,
              }
            : r
        )
      );

      await onRequestUpdated?.();

      notify(
        `Proposed a new pickup time to ${reschedulingRequest.requesterName} for "${reschedulingRequest.productName}".`
      );

      setReschedulingRequest(null);

    } catch (error) {

      console.error(
        "Failed to propose a new pickup time:",
        error
      );

      notify(
        error.response?.data?.message ||
        "Couldn't send the new time. Please try again."
      );

    } finally {

      setActingId(null);

    }
  };

  if (loading) {
    return (
      <div className="dash-section">
        <div className="section-header">
          <h1>Incoming Requests</h1>
        </div>
        <p className="request-list-status">Loading requests…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dash-section">
        <div className="section-header">
          <h1>Incoming Requests</h1>
        </div>
        <EmptyState subtitle={loadError} />
      </div>
    );
  }

  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Incoming Requests</h1>
      </div>

      {requests.length === 0 ? (
        <EmptyState subtitle="No one has requested your products yet." />
      ) : (
        <div className="request-list">
          {requests.map((r) => {
            const info = TYPE_INFO[r.type] || TYPE_INFO.Sell;
            const isPending = r.status === "pending";
            const isActing = actingId === r.id;
            const isExpanded = expandedId === r.id;

            const pickupStatus = (r.pickupStatus || "").toUpperCase();

            const isAwaitingBuyerReview =
              r.status === "accepted" && pickupStatus === "SCHEDULED";

            const isRescheduleRequested =
              r.status === "accepted" && pickupStatus === "RESCHEDULE_REQUESTED";

            const isAwaitingHandover =
              r.status === "accepted" && pickupStatus === "CONFIRMED";

            const isAwaitingBuyerConfirmation =
              r.status === "accepted" && pickupStatus === "BUYER_CONFIRMATION_PENDING";

            const isDeliveryIssue =
              r.status === "accepted" && pickupStatus === "DELIVERY_ISSUE";

            const isPickupCompleted =
              r.status === "accepted" && pickupStatus === "COMPLETED";

            return (
            <div
              key={r.id}
              id={`request-${r.id}`}
              className="request-card"
            >
                <div className="request-card-top">
                  <div
                    className="request-thumb"
                    style={{
                      width: 64,
                      height: 64,
                      minWidth: 64,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "#f2efe6",
                      flexShrink: 0,
                    }}
                  >
                    {r.productImage ? (
                      <img
                        src={r.productImage}
                        alt={r.productName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span className="request-thumb-empty" />
                    )}
                  </div>

                  <div className="request-card-main">
                    <span className={`pcard-type-badge ${info.badgeClass}`}>{r.type}</span>
                    <h4>{r.productName}</h4>
                    <p>
                      From {r.requesterName} &middot; {r.department}
                    </p>
                    {r.message && <p className="request-message">"{r.message}"</p>}

                    <button
                      type="button"
                      className="request-profile-toggle"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#1f3d2b",
                        fontWeight: 600,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 0",
                        cursor: "pointer",
                      }}
                    >
                      <FaUser /> {isExpanded ? "Hide" : "View"} requester profile
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>

                    {isExpanded && (
                      <div
                        className="request-profile-panel"
                        style={{
                          background: "#faf8f2",
                          border: "1px solid #e5e0d8",
                          borderRadius: 10,
                          padding: "10px 14px",
                          marginTop: 4,
                        }}
                      >
                        <div className="request-profile-row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                          <span className="request-profile-label" style={{ color: "#7a8a7d", fontWeight: 600 }}>Name</span>
                          <span className="request-profile-value">{r.requesterName}</span>
                        </div>
                        <div className="request-profile-row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                          <span className="request-profile-label" style={{ color: "#7a8a7d", fontWeight: 600 }}>Department</span>
                          <span className="request-profile-value">{r.department}</span>
                        </div>
                        <div className="request-profile-row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                          <span className="request-profile-label" style={{ color: "#7a8a7d", fontWeight: 600 }}>Year</span>
                          <span className="request-profile-value">{r.year}</span>
                        </div>
                      </div>
                    )}

                    {isAwaitingBuyerReview && (
                      <p className="request-message" style={{ fontStyle: "normal" }}>
                        Waiting for {r.requesterName} to confirm the proposed pickup.
                      </p>
                    )}

                    {isRescheduleRequested && (
                      <div
                        style={{
                          background: "#fdf6e8",
                          border: "1px solid #ecd9a8",
                          borderRadius: 10,
                          padding: "10px 12px",
                          marginTop: 6,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#7a5a10" }}>
                          {r.requesterName} asked for a different time:
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4d4326", fontStyle: "italic" }}>
                          "{r.rescheduleReason || "No reason given."}"
                        </p>
                      </div>
                    )}

                    {isDeliveryIssue && (
                      <p className="request-message" style={{ fontStyle: "normal" }}>
                        {r.requesterName} reported a delivery issue — a complaint is under review.
                      </p>
                    )}
                  </div>
                </div>

                <div className="request-card-side">
                  {isPending ? (
                    <div className="request-actions">
                      <button
  className="dash-btn dash-btn-primary dash-btn-sm"
  disabled={isActing}
  onClick={() => setSelectedRequest(r)}
>
  <FaCheck />
  {isActing ? "..." : "Accept"}
</button>
                      <button
                        className="dash-btn dash-btn-danger dash-btn-sm"
                        disabled={isActing}
                        onClick={() => handleReject(r)}
                      >
                        <FaBan /> {isActing ? "..." : "Reject"}
                      </button>
                    </div>
                  ) : (
                    <span className={`request-status request-status-${r.status}`}>{r.status}</span>
                  )}

                  {isRescheduleRequested && (
                    <button
                      className="dash-btn dash-btn-primary dash-btn-sm"
                      disabled={isActing}
                      onClick={() => setReschedulingRequest(r)}
                    >
                      {isActing ? "..." : "Propose New Time"}
                    </button>
                  )}

                  {isAwaitingHandover && (
                    <button
                      className="dash-btn dash-btn-primary dash-btn-sm"
                      disabled={isActing}
                      onClick={() => handleMarkHandedOver(r)}
                    >
                      {isActing ? "..." : "Mark as Handed Over"}
                    </button>
                  )}

                  {isAwaitingBuyerConfirmation && (
                    <span className="request-status">Awaiting buyer confirmation</span>
                  )}

                  {isDeliveryIssue && (
                    <span className="request-status request-status-rejected">Delivery issue</span>
                  )}

                  {isPickupCompleted && (
                    <span className="request-status request-status-completed">Completed</span>
                  )}

                  <span className="request-time" title={new Date(r.time).toLocaleString()}>
                    {timeAgo(r.time)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedRequest && (
  <PickupDetailsModal
    request={selectedRequest}
    onCancel={() => setSelectedRequest(null)}
    onAccept={handlePickupAccept}
    onReject={() => {
      handleReject(selectedRequest);
      setSelectedRequest(null);
    }}
  />
)}

      {reschedulingRequest && (
        <ProposeNewTimeModal
          request={reschedulingRequest}
          onCancel={() => setReschedulingRequest(null)}
          onSubmit={handleProposeNewTime}
        />
      )}
    </div>
  );
}

export default IncomingRequestsSection;