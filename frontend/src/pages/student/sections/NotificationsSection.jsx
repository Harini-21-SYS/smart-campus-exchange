// NotificationsSection.jsx
import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import { timeAgo } from "../utils/DashboardUtils";
import { getRequestById } from "../../../services/requestService";
import { getPickupById } from "../../../services/pickupService";
import "./NotificationsSection.css";

// Covers every notifyType the backend creates (pickup flow, complaints,
// and admin product moderation). Anything not listed falls through to
// "You have a new notification."
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
    case "PICKUP_CONFIRMED":
      return "The buyer confirmed the pickup schedule.";
    case "RESCHEDULE_REQUESTED":
      return "The buyer requested a different pickup time.";
    case "PICKUP_RESCHEDULED":
      return "The seller proposed a new pickup time — please review it.";
    case "BUYER_CONFIRMATION_REQUIRED":
      return "The scheduled pickup time has passed — please confirm whether you received the item.";
    case "PICKUP_REMINDER":
      return "⏰ Pickup's almost here! Don't forget to swing by.";
    case "TRANSACTION_COMPLETED":
      return "The buyer confirmed they received the item.";
    case "SELLER_RATED":
      return "You received a new rating.";
    case "DELIVERY_ISSUE_REPORTED":
      return "A delivery issue was reported for this transaction.";
    case "COMPLAINT_RECEIVED":
      return "A new complaint has been raised against you.";
    case "COMPLAINT_UPDATED":
      return "Your complaint has been updated.";
    case "COMPLAINT_RESOLVED":
      return "Your complaint has been resolved.";
    case "SELLER_WARNING":
      return "You received a warning from the admin.";
    case "PRODUCT_BLOCKED":
      return "One of your listings was blocked by the admin.";
    case "PRODUCT_UNBLOCKED":
      return "One of your listings is available again.";
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

// Same idea as formatPickupDetails, but reading from a
// PickupScheduleResponse shape (productTitle/location/pickupDate/
// pickupTime) instead of a RequestResponse — used for every
// notification whose relatedId is a pickup id rather than a request id.
function formatPickupScheduleDetails(pickup) {
  if (!pickup) return null;

  const dateStr = pickup.pickupDate
    ? new Date(pickup.pickupDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const timeStr = pickup.pickupTime ? pickup.pickupTime.slice(0, 5) : null;

  const whenPart = [dateStr, timeStr].filter(Boolean).join(" at ");
  const productPart = pickup.productTitle ? `"${pickup.productTitle}" — ` : "";

  return `${productPart}${pickup.location || "location TBD"}${whenPart ? `, ${whenPart}` : ""}.`;
}

// Notification types whose relatedId is a PICKUP id (see
// PickupScheduleServiceImpl / PickupReminderScheduler / BuyerConfirmationScheduler
// — all of these pass savedPickup.getPickupId() as relatedId).
// PRODUCT_BLOCKED / PRODUCT_UNBLOCKED are NOT here: their relatedId
// is a product id.
const PICKUP_ID_NOTIF_TYPES = new Set([
  "PICKUP_SCHEDULED",
  "PICKUP_CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "PICKUP_RESCHEDULED",
  "BUYER_CONFIRMATION_REQUIRED",
  "PICKUP_REMINDER",
]);

function NotificationsSection({
  notifications,
  onMarkAsRead,
}) {
  // Cache of fetched pickup details, keyed by request id (for
  // REQUEST_ACCEPTED notifications, whose relatedId is a request id).
  const [pickupDetailsByRequestId, setPickupDetailsByRequestId] = useState({});

  // Separate cache keyed by pickup id, for every notification type in
  // PICKUP_ID_NOTIF_TYPES above — a different id space from the one
  // above, so it needs its own cache and its own fetch.
  const [pickupDetailsByPickupId, setPickupDetailsByPickupId] = useState({});

  useEffect(() => {
    let cancelled = false;

    const acceptedNotifs = notifications.filter(
      (n) => n.notifyType === "REQUEST_ACCEPTED" && n.relatedId && !pickupDetailsByRequestId[n.relatedId]
    );

    if (acceptedNotifs.length === 0) return;

    acceptedNotifs.forEach(async (n) => {
      try {
        const requestData = await getRequestById(n.relatedId);
        if (!cancelled) {
          setPickupDetailsByRequestId((prev) => ({ ...prev, [n.relatedId]: requestData }));
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

  useEffect(() => {
    let cancelled = false;

    const pickupNotifs = notifications.filter(
      (n) =>
        PICKUP_ID_NOTIF_TYPES.has(n.notifyType) &&
        n.relatedId &&
        !pickupDetailsByPickupId[n.relatedId]
    );

    if (pickupNotifs.length === 0) return;

    pickupNotifs.forEach(async (n) => {
      try {
        const pickupData = await getPickupById(n.relatedId);
        if (!cancelled) {
          setPickupDetailsByPickupId((prev) => ({ ...prev, [n.relatedId]: pickupData }));
        }
      } catch (error) {
        console.error("Failed to load pickup schedule for notification:", error);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Sorted explicitly by time descending instead of blindly reversing
  // the array — the backend order isn't guaranteed.
  const sortedNotifications = notifications.slice().sort((a, b) => b.time - a.time);

  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Notifications</h1>
      </div>

      {sortedNotifications.length === 0 ? (
        <EmptyState subtitle="You're all caught up — no notifications yet." />
      ) : (
        <div className="notif-list">
          {sortedNotifications.map((notification) => {
            const baseMessage =
              notification.message || getFallbackMessage(notification.notifyType);

            let displayMessage = baseMessage;

            if (notification.notifyType === "REQUEST_ACCEPTED") {
              const request = pickupDetailsByRequestId[notification.relatedId];
              const pickupLine = formatPickupDetails(request);
              if (pickupLine) {
                displayMessage = `${baseMessage} ${pickupLine}`;
              }
            } else if (PICKUP_ID_NOTIF_TYPES.has(notification.notifyType)) {
              const pickup = pickupDetailsByPickupId[notification.relatedId];
              const pickupLine = formatPickupScheduleDetails(pickup);
              if (pickupLine) {
                displayMessage = `${baseMessage} ${pickupLine}`;
              }
            }

            return (
              <div
                key={notification.id}
                className={`notif-list-item ${
                  notification.read ? "" : "notif-list-item-unread"
                }`}
                onClick={() => onMarkAsRead(notification)}
                style={{ cursor: "pointer" }}
              >
                <span className="notif-list-icon">
                  <FaBell />
                </span>

                <div className="notif-list-text">
                  <p>{displayMessage}</p>
                  <span>{timeAgo(notification.time)}</span>
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