// ProductCard.jsx
import { useState } from "react";
import ImagePlaceholder from "./ImagePlaceholder";
import ZoomableImage from "./ZoomableImage"; // adjust path to wherever ZoomableImage.jsx lives
import { FaUser, FaStar } from "react-icons/fa";
import { TYPE_INFO } from "../constants";

const UNKNOWN_TYPE_INFO = {
  badgeClass: "pcard-type-badge--unknown",
  actionLabel: "View",
};

/* Used both in the marketplace grid and the "My Products" grid
   (the `actions` render-prop differs between them). `actions` is
   optional now — MyProductsSection omits it for completed listings,
   so it's guarded here instead of called unconditionally. */
function ProductCard({ product, onOpen, actions }) {
  const info = TYPE_INFO[product.type] ?? UNKNOWN_TYPE_INFO;

  if (!TYPE_INFO[product.type]) {
    console.warn(
      `ProductCard: unrecognized product.type "${product.type}" for product`,
      product
    );
  }

  const primaryImage = product.images?.[product.primaryIndex ?? 0];
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(primaryImage?.url) && !imageFailed;

  // Confirmed field names from the actual API response.
  const sellerName = product.sellerName || "Unknown student";
  const sellerDepartment = product.department || null;
  const sellerAvatarUrl = product.sellerProfileImage || null; // not sent by backend yet

  // TRUST SCORE — not a confirmed field yet (there's no trust score key
  // in the product responses we've inspected so far, since it lives in
  // a separate trust_scores table per the schema). Trying the likely
  // names defensively; if none hit, we render nothing here (no clutter)
  // but log a warning so we can find the real field name the same way
  // we found `sellerName`/`department` earlier.
  const trustScore =
    product.sellerTrustScore ??
    product.trustScore ??
    product.sellerRating ??
    product.ownerTrustScore ??
    null;

  if (trustScore === null) {
    console.warn(
      "ProductCard: no trust score field found on this product — trust score will stay hidden until the backend includes one. Full product object:",
      product
    );
  }

  const [avatarFailed, setAvatarFailed] = useState(false);
  const hasAvatar = Boolean(sellerAvatarUrl) && !avatarFailed;

  return (
    <div className="pcard" onClick={() => onOpen(product)}>
      {hasImage ? (
        <div className="pcard-image">
          <ZoomableImage
            src={primaryImage.url}
            alt={product.name}
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <ImagePlaceholder />
      )}

      <span className={`pcard-type-badge ${info.badgeClass}`}>{product.type}</span>

      <h4 className="pcard-name">{product.name}</h4>
      <span className="pcard-category">{product.category}</span>

      {/* Price now sits right under category, not in the footer */}
      <span className="pcard-price pcard-price-top">
        {product.type === "Sell" ? `₹ ${product.price}` : "Free"}
      </span>

      <div className="pcard-seller-row">
        <div className="pcard-seller-avatar">
          {hasAvatar ? (
            <img src={sellerAvatarUrl} alt={sellerName} onError={() => setAvatarFailed(true)} />
          ) : (
            <FaUser />
          )}
        </div>
        <div className="pcard-seller-text">
          <span className="pcard-seller-name">{sellerName}</span>
          <span className="pcard-seller-dept">{sellerDepartment || "Department not available"}</span>
        </div>
        {trustScore !== null && (
          <span className="pcard-trust-badge">
            <FaStar /> {Math.round(trustScore)}
          </span>
        )}
      </div>

      {typeof actions === "function" && (
        <div className="pcard-footer">
          {actions(product)}
        </div>
      )}
    </div>
  );
}

export default ProductCard;