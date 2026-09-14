// NotificationsSection.jsx
import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import { timeAgo } from "../utils/DashboardUtils";
import { getRequestById } from "../../../services/requestService";
import "./NotificationsSection.css";

// FIX: only REQUEST_ACCEPTED had generic copy before ("Your request has
// been accepted."), with no pickup info — and PICKUP_SCHEDULED (a
// second notification your backend creates on every accept) had no
// case at all, falling through to the unhelpful "You have a new
// notification." This gives PICKUP_SCHEDULED a real message on its own,
// while REQUEST_ACCEPTED gets enriched with actual pickup details below
// via a one-time fetch, since RequestResponse already carries
// pickupLocation/pickupDate/pickupTime.
function getFallbackMessage(type) {
  switch (type) {
    case "REQUEST_RECEIVED":
      return "You received a new request.";
    case "REQUEST_ACCEPTED":
      return "Your request has been accepted.";
    case "REQUEST_REJECTED":
      return "Your request has been rejected.";
    case "REQUEST_CANCELLED":
      return "A request has been cancelled.";
    case "PICKUP_SCHEDULED":
      return "Pickup details are ready — check My Requests.";
    case "COMPLAINT_RECEIVED":
      return "A new complaint has been raised against you.";
    case "COMPLAINT_UPDATED":
      return "Your complaint has been updated.";
    case "COMPLAINT_RESOLVED":
      return "Your complaint has been resolved.";
    default:
      return "You have a new notification.";
  }
}

function formatPickupDetails(request) {
  if (!request?.pickupLocation && !request?.pickupDate && !request?.pickupTime) {
    return null;
  }

  const dateStr = request.pickupDate
    ? new Date(request.pickupDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const timeStr = request.pickupTime
    ? request.pickupTime.slice(0, 5) // "07:00:00" -> "07:00"
    : null;

  const whenPart = [dateStr, timeStr].filter(Boolean).join(" at ");

  return `Pickup: ${request.pickupLocation || "location TBD"}${whenPart ? `, ${whenPart}` : ""}.`;
}

function NotificationsSection({
  notifications,
  onMarkAsRead,
}) {
  // Cache of fetched pickup details, keyed by request id (the
  // relatedId on a REQUEST_ACCEPTED notification), so each request is
  // only fetched once even if the notification re-renders.
  const [pickupDetails, setPickupDetails] = useState({});

  useEffect(() => {
    let cancelled = false;

    const acceptedNotifs = notifications.filter(
      (n) => n.notifyType === "REQUEST_ACCEPTED" && n.relatedId && !pickupDetails[n.relatedId]
    );

    if (acceptedNotifs.length === 0) return;

    acceptedNotifs.forEach(async (n) => {
      try {
        const requestData = await getRequestById(n.relatedId);
        if (!cancelled) {
          setPickupDetails((prev) => ({ ...prev, [n.relatedId]: requestData }));
        }
      } catch (error) {
        console.error("Failed to load pickup details for notification:", error);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // FIX: sorted explicitly by time descending instead of blindly
  // reversing the array — .reverse() only produced "latest first" if
  // the backend happened to already return oldest-first, which isn't
  // guaranteed.
  const sortedNotifications = notifications.slice().sort((a, b) => b.time - a.time);

  return (

    <div className="dash-section">

      <div className="section-header">

        <h1>
          Notifications
        </h1>

      </div>


      {sortedNotifications.length === 0 ? (

        <EmptyState
          subtitle="You're all caught up — no notifications yet."
        />

      ) : (

        <div className="notif-list">

          {sortedNotifications.map((notification) => {

            const baseMessage =
              notification.message || getFallbackMessage(notification.notifyType);

            // Enrich REQUEST_ACCEPTED with real pickup info once loaded.
            let displayMessage = baseMessage;
            if (notification.notifyType === "REQUEST_ACCEPTED") {
              const request = pickupDetails[notification.relatedId];
              const pickupLine = formatPickupDetails(request);
              if (pickupLine) {
                displayMessage = `${baseMessage} ${pickupLine}`;
              }
            }

            return (
              <div

                key={notification.id}

                className={`notif-list-item ${
                  notification.read
                    ? ""
                    : "notif-list-item-unread"
                }`}

                onClick={() =>
                  onMarkAsRead(notification)
                }

                style={{
                  cursor: "pointer",
                }}
              >

                <span className="notif-list-icon">

                  <FaBell />

                </span>


                <div className="notif-list-text">

                  <p>
                    {displayMessage}
                  </p>

                  <span>

                    {timeAgo(
                      notification.time
                    )}

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

export default NotificationsSection;