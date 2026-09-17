import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { timeAgo } from "../utils/DashboardUtils";
import "./ComplaintList.css";

const API_ORIGIN = "http://localhost:8081";

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}

/* Complaints raised by the currently logged-in student */
function MyComplaintsSection({
  complaints = [],
  notificationTargetId,
}) {
  return (
    <div className="dash-section">

      <div className="section-header">
        <h1>My Complaints</h1>
      </div>

      {complaints.length === 0 ? (

        <EmptyState
          subtitle="You haven't raised any complaints yet."
        />

      ) : (

        <div className="complaint-list">

          {complaints.map((c) => {
            const imageUrl = resolveImageUrl(c.productImage);

            // FIX: the backend now sends resolutionNote on a RESOLVED
            // complaint (previously it was written by the admin but
            // never surfaced back to the student at all — the card had
            // nothing to show even once resolved).
            const isResolved =
              (c.status || "").toUpperCase() === "RESOLVED";
            const hasResolutionNote =
              isResolved && c.resolutionNote && c.resolutionNote.trim();

            return (
              <div
                key={c.id}
                className={`complaint-card ${
                  String(c.id) === String(notificationTargetId)
                    ? "complaint-card-highlight"
                    : ""
                }`}
              >

                <div className="complaint-card-thumb">
                  {imageUrl ? (
                    <img src={imageUrl} alt={c.productName} />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>

                <div className="complaint-card-main">

                  <span className="complaint-card-type">
                    {c.complaintType}
                  </span>

                  <h4>
                    {c.productName}
                  </h4>

                  {hasResolutionNote && (
                    <p className="complaint-resolution-note">
                      <strong>Resolution:</strong> {c.resolutionNote}
                    </p>
                  )}

                </div>

                <div className="complaint-card-side">

                  <span
                    className={
                      `complaint-status complaint-status-${(c.status || "pending").toLowerCase()}`
                    }
                  >
                    {c.status
                      ? c.status.replace(/_/g, " ")
                      : "PENDING"}
                  </span>

                  <span className="complaint-time">

                    {c.createdAt
                      ? timeAgo(c.createdAt)
                      : ""}

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

export default MyComplaintsSection;