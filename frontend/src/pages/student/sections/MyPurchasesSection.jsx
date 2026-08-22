import EmptyState from "../components/EmptyState";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { TYPE_INFO } from "../constants";
import { timeAgo } from "../utils/DashboardUtils";
import "./MyPurchasesSection.css";

/* Products YOU acquired — requests you sent where the seller accepted
   AND you confirmed the pickup. Covers all three listing types
   (Sell/Exchange/Donate). These are also the only items you're
   allowed to offer when requesting a future Exchange. */
function MyPurchasesSection({ purchases }) {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>My Purchases</h1>
      </div>

      {purchases.length === 0 ? (
        <EmptyState subtitle="You haven't completed any purchases yet." />
      ) : (
        <div className="purchase-list">
          {purchases
            .slice()
            .reverse()
            .map((p) => {
              const info = TYPE_INFO[p.type] || TYPE_INFO.Sell;
              return (
                <div key={p.id} className="purchase-card">
                  {p.productImage ? (
                    <div className="purchase-card-thumb">
                      <img src={p.productImage} alt={p.productName} />
                    </div>
                  ) : (
                    <div className="purchase-card-thumb">
                      <ImagePlaceholder />
                    </div>
                  )}

                  <div className="purchase-card-main">
                    <span className={`pcard-type-badge ${info.badgeClass}`}>{p.type}</span>
                    <h4>{p.productName}</h4>
                    <p>From {p.sellerName}</p>
                  </div>
                  <div className="purchase-card-side">
                    <span className="purchase-price">
                      {p.type === "Sell" && p.price ? `₹${p.price}` : "Free"}
                    </span>
                    <span className="purchase-time">{timeAgo(p.time)}</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default MyPurchasesSection;