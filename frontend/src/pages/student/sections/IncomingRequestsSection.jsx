import { useEffect, useState } from "react";
import { FaCheck, FaBan, FaChevronDown, FaChevronUp, FaUser } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import { TYPE_INFO } from "../constants";
import { timeAgo } from "../utils/DashboardUtils";
import { getIncomingRequests, acceptRequest, rejectRequest } from "../../../services/requestService";
import "./RequestList.css";
import PickupDetailsModal from "../components/PickupDetailsModal";
// Normalizes whatever the backend sends (PENDING / Pending / pending)
// into the lowercase form the CSS classes and copy expect.
function normalizeStatus(status) {
  return (status || "pending").toLowerCase();
}

// Defensive mapping — backend field names can drift; this keeps the
// rest of the component simple even if some fields are missing.
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

    productImage:
      r.productImage ??
      r.product?.images?.[0]?.imageUrl ??
      r.product?.images?.[0]?.url ??
      null,

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

    year:
      r.requesterYear ??
      r.requester?.year ??
      "—",

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

pickupTime:
  r.pickupTime ??
  null,
};
}

function IncomingRequestsSection({
  onToast,
  notificationTargetId,
  onRequestUpdated
}) {
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actingId, setActingId] = useState(null); // request currently being accepted/rejected
  const [expandedId, setExpandedId] = useState(null); // "view profile" panel
  const [selectedRequest, setSelectedRequest] = useState(null);
  useEffect(() => {
  if (!notificationTargetId) return;

  // Wait for request cards to render
  setTimeout(() => {
    const element = document.getElementById(
      `request-${notificationTargetId}`
    );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Optional: automatically expand requester profile
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


const handlePickupAccept = async ({ location, time }) => {

  if (!selectedRequest) return;

  const requestId =
    selectedRequest.id;

  setActingId(requestId);

  try {

    const response =
      await acceptRequest(
        requestId,
        {
          pickupLocation: location,
          pickupTime: time,
        }
      );

    // Update local request card
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

              pickupTime:
                response.pickupTime ??
                time,
            }
          : r
      )
    );

    // IMPORTANT:
    // Refresh Dashboard data
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

    // Refresh dashboard data
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

            return (
            <div
  key={r.id}
  id={`request-${r.id}`}
  className={`request-card ${
    String(r.id) === String(notificationTargetId)
      ? "notification-highlight"
      : ""
  }`}
>
                <div className="request-card-top">
                  <div className="request-thumb">
                    {r.productImage ? (
                      <img src={r.productImage} alt={r.productName} />
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
                    {r.message && <p className="request-message">“{r.message}”</p>}

                    <button
                      type="button"
                      className="request-profile-toggle"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      <FaUser /> {isExpanded ? "Hide" : "View"} requester profile
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>

                    {isExpanded && (
                      <div className="request-profile-panel">
                        <div>
                          <small>Name</small>
                          <span>{r.requesterName}</span>
                        </div>
                        <div>
                          <small>Department</small>
                          <span>{r.department}</span>
                        </div>
                        <div>
                          <small>Year</small>
                          <span>{r.year}</span>
                        </div>
                      </div>
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
    </div>
  );
}

export default IncomingRequestsSection;