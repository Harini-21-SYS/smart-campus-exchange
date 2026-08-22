import { FaBell } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import { timeAgo } from "../utils/dashboardUtils";
import "./NotificationsSection.css";

function NotificationsSection({ notifications }) {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <EmptyState subtitle="You're all caught up — no notifications yet." />
      ) : (
        <div className="notif-list">
          {notifications
            .slice()
            .reverse()
            .map((n) => (
              <div key={n.id} className={`notif-list-item ${n.read ? "" : "notif-list-item-unread"}`}>
                <span className="notif-list-icon">
                  <FaBell />
                </span>
                <div className="notif-list-text">
                  <p>{n.message}</p>
                  <span>{timeAgo(n.time)}</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsSection;