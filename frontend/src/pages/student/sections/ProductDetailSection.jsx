// ProductDetailSection.jsx
import { useState, useEffect } from "react";
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaUser, FaPen, FaTrashAlt, FaStar, FaCheckCircle, FaBan, FaChevronRight as FaChevronRightSmall } from "react-icons/fa";
import ImagePlaceholder from "../components/ImagePlaceholder";
import ZoomableImage from "../components/ZoomableImage"; // adjust path if it lives elsewhere
import { TYPE_INFO } from "../constants";
import { getMyProducts } from "../../../services/productService";
import "./ProductDetailSection.css";

// Same real backend statuses as MyProductsSection — a product only
// ever reaches one of these via confirmProductReceived() completing a
// BUY/EXCHANGE/DONATE request, at which point ownership also transfers
// to the other party (see ProductService.ACQUIRED_STATUSES on the
// backend). Kept in sync with MyProductsSection's COMPLETED_STATUSES.
const COMPLETED_STATUSES = ["SOLD", "EXCHANGED", "DONATED"];

function isCompleted(product) {
  return COMPLETED_STATUSES.includes(String(product?.status).toUpperCase());
}

// Admin moderation: a blocked product is hidden from buyers, and the
// seller can neither edit nor delete it until it is unblocked.
function isBlockedStatus(product) {
  return String(product?.status).toUpperCase() === "BLOCKED";
}

function ProductDetailSection({
  product,
  isOwner,
  isBlocked = false,
  onBack,
  onRequest,
  onEdit,
  onDelete,
  onViewSeller,
}) {
  const [activeImg, setActiveImg] = useState(product.primaryIndex ?? 0);
  const info = TYPE_INFO[product.type] || TYPE_INFO.Sell;
  const images = product.images || [];
  const hasMultiple = images.length > 1;

  const [ownershipChecked, setOwnershipChecked] = useState(false);
  const [actualIsOwner, setActualIsOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkOwnership = async () => {
      try {
        const myProducts = await getMyProducts();
        const myIds = new Set((myProducts || []).map((p) => String(p.id)));
        if (!cancelled) {
          setActualIsOwner(myIds.has(String(product.id)));
          setOwnershipChecked(true);
        }
      } catch (err) {
        console.warn(
          "ProductDetailSection: couldn't verify ownership via getMyProducts, falling back to isOwner prop",
          err
        );
        if (!cancelled) {
          setActualIsOwner(Boolean(isOwner));
          setOwnershipChecked(true);
        }
      }
    };

    checkOwnership();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const ownerName = product.sellerName || "Unknown student";
  const ownerDepartment = product.department || null;
  const ownerAvatarUrl = product.sellerProfileImage || null;

  const ownerTrustScore =
    product.sellerTrustScore !== null && product.sellerTrustScore !== undefined
      ? product.sellerTrustScore
      : null;

  const [avatarFailed, setAvatarFailed] = useState(false);
  const hasAvatar = Boolean(ownerAvatarUrl) && !avatarFailed;

  const goPrev = () => setActiveImg((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveImg((i) => (i + 1) % images.length);

  // Guarded on both the callback and product.ownerId existing, since
  // without an id there's nothing to look the seller up by.
  const canViewSeller = typeof onViewSeller === "function" && product.ownerId != null;
  const handleSellerClick = () => {
    if (canViewSeller) onViewSeller(product);
  };

  const completed = isCompleted(product);

  // Blocked if the parent says so OR the product's own status says so.
  const blocked = isBlocked || isBlockedStatus(product);

  return (
    <div className="dash-section">
      <button className="dash-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="pdetail-grid">
        <div className="pdetail-gallery">
          <div className="pdetail-main-image">
            {images[activeImg] ? (
              <ZoomableImage
                src={images[activeImg].url}
                alt={product.title || product.name}
              />
            ) : (
              <ImagePlaceholder />
            )}

            {hasMultiple && (
              <>
                <button type="button" className="carousel-arrow carousel-arrow-left" onClick={goPrev} aria-label="Previous image">
                  <FaChevronLeft />
                </button>
                <button type="button" className="carousel-arrow carousel-arrow-right" onClick={goNext} aria-label="Next image">
                  <FaChevronRight />
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="carousel-dots">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`carousel-dot ${idx === activeImg ? "carousel-dot-active" : ""}`}
                  onClick={() => setActiveImg(idx)}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {hasMultiple && (
            <div className="pdetail-thumbs">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  className={`pdetail-thumb ${idx === activeImg ? "pdetail-thumb-active" : ""}`}
                  onClick={() => setActiveImg(idx)}
                >
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdetail-info">
          <span className={`pcard-type-badge pdetail-badge ${info.badgeClass}`}>{product.type}</span>

          {blocked && (
            <span className="pdetail-blocked-badge">
              <FaBan /> Blocked
            </span>
          )}

          <h1 className="pdetail-name">{product.title || product.name}</h1>
          <p className="pdetail-meta">
            {product.category} &middot; {product.condition}
          </p>

          <p className="pdetail-price">{product.type === "Sell" ? `₹${product.price}` : "Free"}</p>

          <p className="pdetail-desc">{product.description}</p>

          <button
            type="button"
            className={`pdetail-seller-card ${canViewSeller ? "pdetail-seller-card-clickable" : ""}`}
            onClick={handleSellerClick}
            disabled={!canViewSeller}
          >
            <div className="pdetail-seller-avatar">
              {hasAvatar ? (
                <img src={ownerAvatarUrl} alt={ownerName} onError={() => setAvatarFailed(true)} />
              ) : (
                <FaUser />
              )}
            </div>
            <div className="pdetail-seller-text">
              <strong>{ownerName}</strong>
              <span>{ownerDepartment || "Department not available"}</span>
            </div>
            {ownerTrustScore !== null && (
              <span className="pdetail-trust-badge">
                <FaStar /> {Math.round(ownerTrustScore)}
              </span>
            )}
            {canViewSeller && <FaChevronRightSmall className="pdetail-seller-chevron" />}
          </button>

          <div className="pdetail-actions">
            {!ownershipChecked ? null : actualIsOwner ? (
              completed ? (
                <span className="pdetail-completed-badge">
                  <FaCheckCircle /> Transaction Completed
                </span>
              ) : blocked ? (
                // Blocked by admin: no Edit / Delete, and no Request
                // button either (it's the seller's own product).
                <p className="pdetail-blocked-note">
                  <FaBan /> This product has been blocked by the admin and is
                  hidden from buyers. You can't edit or delete it unless the
                  admin unblocks it.
                </p>
              ) : (
                <>
                  <button className="dash-btn dash-btn-outline dash-btn-block" onClick={() => onEdit(product)}>
                    <FaPen /> Edit Listing
                  </button>
                  <button className="dash-btn dash-btn-danger dash-btn-block" onClick={() => onDelete(product)}>
                    <FaTrashAlt /> Delete Listing
                  </button>
                </>
              )
            ) : (
              <button className={`dash-request-btn ${info.badgeClass}`} onClick={() => onRequest(product)}>
                {info.actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailSection;