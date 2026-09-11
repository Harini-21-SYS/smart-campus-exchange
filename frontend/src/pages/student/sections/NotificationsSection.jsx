import { FaBell } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import { timeAgo } from "../utils/DashboardUtils";
import "./NotificationsSection.css";

function NotificationsSection({
  notifications,
  onMarkAsRead,
}) {

  return (

    <div className="dash-section">

      <div className="section-header">

        <h1>
          Notifications
        </h1>

      </div>


      {notifications.length === 0 ? (

        <EmptyState
          subtitle="You're all caught up — no notifications yet."
        />

      ) : (

        <div className="notif-list">

          {notifications
            .slice()
            .reverse()
            .map((notification) => (

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
                    {notification.message}
                  </p>

                  <span>

                    {timeAgo(
                      notification.time
                    )}

                  </span>

                </div>

              </div>

            ))}

        </div>

      )}

    </div>

  );
}

export default NotificationsSection;