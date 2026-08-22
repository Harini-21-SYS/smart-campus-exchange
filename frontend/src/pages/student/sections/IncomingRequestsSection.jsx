import { useEffect, useState } from "react";
import { FaCheck, FaBan, FaChevronDown, FaChevronUp, FaUser } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import { TYPE_INFO } from "../constants";
import { timeAgo } from "../utils/dashboardUtils";
import { getIncomingRequests, acceptRequest, rejectRequest } from "../../../services/requestService";
import "./RequestList.css";

// Normalizes whatever the backend sends (PENDING / Pending / pending)
// into the lowercase form the CSS classes and copy expect.
function normalizeStatus(status) {
  return (status || "pending").toLowerCase();
}

// Defensive mapping — backend field names can drift; this keeps the
// rest of the component simple even if some fields are missing.
function mapRequest(r) {
  const images = r.product?.images || [];
  const primary = images.find((img) => img.primary) || images[0];

  return {
    id: r.id,
    productId: r.product?.id,
    productName: r.product?.title || "Untitled listing",
    productImage: primary?.imageUrl || null,
    requesterName: r.requester?.fullName || "Unknown Student",
    department: r.requester?.department || "—",
    year: r.requester?.year || "—",
    type: r.type || r.product?.type || "Sell",
    message: r.message || "",
    time: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
    status: normalizeStatus(r.status),
  };
}

function IncomingRequestsSection({ onToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actingId, setActingId] = useState(null); // request currently being accepted/rejected
  const [expandedId, setExpandedId] = useState(null); // "view profile" panel

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

  const handleAccept = async (request) => {
    setActingId(request.id);
    try {
      await acceptRequest(request.id);
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "accepted" } : r))
      );
      notify(`Accepted ${request.requesterName}'s request for "${request.productName}".`);
    } catch (error) {
      console.error("Failed to accept request:", error);
      notify(error.response?.data?.message || "Couldn't accept the request. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (request) => {
    setActingId(request.id);
    try {
      await rejectRequest(request.id);
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "rejected" } : r))
      );
      notify(`Declined ${request.requesterName}'s request for "${request.productName}".`);
    } catch (error) {
      console.error("Failed to reject request:", error);
      notify(error.response?.data?.message || "Couldn't decline the request. Please try again.");
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
            const info = TYPE_INFO[r.type];
            const isPending = r.status === "pending";
            const isActing = actingId === r.id;
            const isExpanded = expandedId === r.id;

            return (
              <div key={r.id} className="request-card">
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
                        onClick={() => handleAccept(r)}
                      >
                        <FaCheck /> {isActing ? "..." : "Accept"}
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
    </div>
  );
}

export default IncomingRequestsSection;