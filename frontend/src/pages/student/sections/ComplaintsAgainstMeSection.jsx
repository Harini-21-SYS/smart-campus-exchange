import { FaShieldAlt } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { timeAgo } from "../utils/DashboardUtils";
import "./ComplaintList.css";

function ComplaintsAgainstMeSection({ complaints = [] }) {
  return (
    <div className="dash-section">

      <div className="section-header">
        <h1>Complaints Raised on Me</h1>
      </div>

      {complaints.length > 0 && (
        <p className="complaint-privacy-note">
          <FaShieldAlt />
          Complainant identity is kept private and isn't shown here.
        </p>
      )}

      {complaints.length === 0 ? (

        <EmptyState
          subtitle="No complaints have been raised against you."
        />

      ) : (

        <div className="complaint-list">

          {complaints
            .slice()
            .reverse()
            .map((c) => (

              <div
                key={c.id}
                className="complaint-card"
              >

                {c.productImage ? (

                  <div className="complaint-card-thumb">
                    <img
                      src={c.productImage}
                      alt={c.productName}
                    />
                  </div>

                ) : (

                  <div className="complaint-card-thumb">
                    <ImagePlaceholder />
                  </div>

                )}

                <div className="complaint-card-main">

                  <span className="complaint-card-type">
                    {c.complaintType || "Complaint"}
                  </span>

                  <h4>
                    {c.productName || "Unknown Product"}
                  </h4>

                  {c.description && (
                    <p className="complaint-card-desc">
                      {c.description}
                    </p>
                  )}

                </div>

                <div className="complaint-card-side">

                  <span
                    className={
                      `complaint-status complaint-status-${
                        c.status 
                      }`
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

export default ComplaintsAgainstMeSection;