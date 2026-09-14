import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { timeAgo } from "../utils/DashboardUtils";
import "./ComplaintList.css";

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

          {complaints.map((c) => (

  <div
    key={c.complaintId}
    className="complaint-card"
  >

    <div className="complaint-card-thumb">
      <ImagePlaceholder />
    </div>

    <div className="complaint-card-main">

      <span className="complaint-card-type">
        {c.complaintType}
      </span>

      <h4>
        {c.productTitle}
      </h4>

    </div>

    <div className="complaint-card-side">

      <span
        className={
          `complaint-status complaint-status-${c.status}`
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

))}

        </div>

      )}

    </div>
  );
}

export default MyComplaintsSection;