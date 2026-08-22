import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { timeAgo } from "../utils/dashboardUtils";
import "./ComplaintList.css";

/* Complaints YOU raised — kept intentionally minimal per spec:
   which product, what type, and its current status. */
function MyComplaintsSection({ complaints }) {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>My Complaints</h1>
      </div>

      {complaints.length === 0 ? (
        <EmptyState subtitle="You haven't raised any complaints yet." />
      ) : (
        <div className="complaint-list">
          {complaints
            .slice()
            .reverse()
            .map((c) => (
              <div key={c.id} className="complaint-card">
                {c.productImage ? (
                  <div className="complaint-card-thumb">
                    <img src={c.productImage} alt={c.productName} />
                  </div>
                ) : (
                  <div className="complaint-card-thumb">
                    <ImagePlaceholder />
                  </div>
                )}

                <div className="complaint-card-main">
                  <span className="complaint-card-type">{c.complaintType}</span>
                  <h4>{c.productName}</h4>
                </div>

                <div className="complaint-card-side">
                  <span className={`complaint-status complaint-status-${c.status}`}>
                    {c.status.replace("_", " ")}
                  </span>
                  <span className="complaint-time">{timeAgo(c.createdAt)}</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default MyComplaintsSection;