import { FaShieldAlt } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import ZoomableImage from "../components/ZoomableImage";
import { timeAgo } from "../utils/DashboardUtils";
import "./ComplaintList.css";

const API_ORIGIN = "http://localhost:8081";

// FIX: this component rendered c.productImage directly, with no
// fallback of its own — it silently relied on whatever built the
// `complaints` prop having already prefixed the path with the
// backend origin. If that upstream mapping was ever missing, out of
// date, or this component gets reused somewhere that skips it, the
// image just never showed. resolveImageUrl is idempotent (it checks
// for an existing http:// prefix before adding one), so applying it
// here too is always safe, whether or not the parent already did it.
function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}

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
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .map((c) => {

              const imageUrl = resolveImageUrl(c.productImage);

              return (

              <div
                key={c.id}
                className="complaint-card"
              >

                {imageUrl ? (

                  <div className="complaint-card-thumb">
                    <ZoomableImage
                      src={imageUrl}
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

              );
            })}

        </div>

      )}

    </div>
  );
}

export default ComplaintsAgainstMeSection;