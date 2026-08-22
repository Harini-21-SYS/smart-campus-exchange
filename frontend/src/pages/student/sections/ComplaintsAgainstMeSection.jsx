import { FaShieldAlt } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { timeAgo } from "../utils/dashboardUtils";
import "./ComplaintList.css";

/* Complaints OTHER students raised against you.
   Safety rule: the complainant's name and department are never shown
   here — and, by design, this component is never even passed that
   data (see SAMPLE_COMPLAINTS_AGAINST_ME in constants.js), so there's
   nothing to accidentally leak. */
function ComplaintsAgainstMeSection({ complaints }) {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Complaints Raised on Me</h1>
      </div>

      {complaints.length > 0 && (
        <p className="complaint-privacy-note">
          <FaShieldAlt /> Complainant identity is kept private and isn't shown here.
        </p>
      )}

      {complaints.length === 0 ? (
        <EmptyState subtitle="No complaints have been raised against you." />
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
                  {c.description && <p className="complaint-card-desc">{c.description}</p>}
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

export default ComplaintsAgainstMeSection;