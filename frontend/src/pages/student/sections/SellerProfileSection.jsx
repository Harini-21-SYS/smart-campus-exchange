// SellerProfileSection.jsx
import { useState } from "react";
import { FaArrowLeft, FaUser, FaStar, FaBoxOpen } from "react-icons/fa";
import ProductCard from "../components/ProductCard";
import "./SellerProfileSection.css";

// Receives already-loaded, already-mapped data from StudentDashboard —
// no network call here. `seller` is built directly from the product
// that was clicked (it already carries sellerName/department/
// sellerProfileImage/sellerTrustScore), and `products` is the seller's
// full listing set, filtered client-side from products the dashboard
// already fetched. This avoids the earlier bug where getProductsBySeller
// filtered on a `sellerId` field that doesn't exist on real product
// objects (the real field is `ownerId`), which meant it always came
// back empty.
function SellerProfileSection({ seller, products, onBack, onOpenProduct }) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  if (!seller) {
    return (
      <div className="dash-section">
        <button className="dash-back-link" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>
        <p className="sprofile-error">Profile not found.</p>
      </div>
    );
  }

  const hasAvatar = Boolean(seller.avatarUrl) && !avatarFailed;
  const hasTrustScore = seller.trustScore !== null && seller.trustScore !== undefined;

  return (
    <div className="dash-section">
      <button className="dash-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="sprofile-header">
        <div className="sprofile-avatar">
          {hasAvatar ? (
            <img src={seller.avatarUrl} alt={seller.name} onError={() => setAvatarFailed(true)} />
          ) : (
            <FaUser />
          )}
        </div>

        <div className="sprofile-headline">
          <h1 className="sprofile-name">{seller.name}</h1>
          <p className="sprofile-department">{seller.department || "Department not available"}</p>

          <div className="sprofile-stats">
            {hasTrustScore && (
              <span className="sprofile-stat">
                <FaStar /> {seller.trustScore} trust score
              </span>
            )}
            <span className="sprofile-stat">
              <FaBoxOpen /> {products.length} {products.length === 1 ? "product" : "products"} listed
            </span>
          </div>
        </div>
      </div>

      <div className="sprofile-products">
        <h2 className="sprofile-section-title">Listings</h2>
        {products.length === 0 ? (
          <p className="sprofile-empty">No products listed yet.</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              // FIX: ProductCard doesn't have an `onClick` prop (it uses
              // `onOpen`, called internally), and it unconditionally
              // calls `actions(product)` in its footer — passing neither
              // before meant this would crash the instant a product
              // rendered. `actions={() => null}` renders no button here,
              // since the whole card already opens the product on click.
              <ProductCard key={p.id} product={p} onOpen={onOpenProduct} actions={() => null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerProfileSection;