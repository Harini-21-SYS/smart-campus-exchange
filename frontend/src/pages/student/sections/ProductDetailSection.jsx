import { useState } from "react";
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaUser, FaPen, FaTrashAlt } from "react-icons/fa";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { TYPE_INFO } from "../constants";
import "./ProductDetailSection.css";

/* Its own full-width in-page SECTION, not a popup. The main image is
   capped to a sensible size and, when a listing has more than one
   photo, a carousel (arrows + dots, plus a thumbnail strip) lets the
   buyer step through them. */
function ProductDetailSection({ product, isOwner, onBack, onRequest, onEdit, onDelete }) {
  const [activeImg, setActiveImg] = useState(product.primaryIndex ?? 0);
  const info = TYPE_INFO[product.type];
  const images = product.images || [];
  const hasMultiple = images.length > 1;

  const goPrev = () => setActiveImg((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveImg((i) => (i + 1) % images.length);

  return (
    <div className="dash-section">
      <button className="dash-back-link" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="pdetail-grid">
        <div className="pdetail-gallery">
          <div className="pdetail-main-image">
            {images[activeImg] ? (
              <img src={images[activeImg].url} alt={product.name} />
            ) : (
              <ImagePlaceholder />
            )}

            {hasMultiple && (
              <>
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-left"
                  onClick={goPrev}
                  aria-label="Previous image"
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-right"
                  onClick={goNext}
                  aria-label="Next image"
                >
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

          <h1 className="pdetail-name">{product.name}</h1>
          <p className="pdetail-meta">
            {product.category} &middot; {product.condition}
          </p>

          <p className="pdetail-price">{product.type === "Sell" ? `₹${product.price}` : "Free"}</p>

          <p className="pdetail-desc">{product.description}</p>

          <div className="pdetail-seller-card">
            <div className="pdetail-seller-avatar">
              <FaUser />
            </div>
            <div>
              <strong>{product.sellerName}</strong>
              <span>{product.department}</span>
            </div>
          </div>

          <div className="pdetail-actions">
            {isOwner ? (
              <>
                <button className="dash-btn dash-btn-outline dash-btn-block" onClick={() => onEdit(product)}>
                  <FaPen /> Edit Listing
                </button>
                <button className="dash-btn dash-btn-danger dash-btn-block" onClick={() => onDelete(product)}>
                  <FaTrashAlt /> Delete Listing
                </button>
              </>
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