import { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll";
import "./ZoomableImage.css";

function ZoomableImage({ src, alt, className = "", onError }) {
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`zoomable-img ${className}`}
        onError={onError}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      />
      {open &&
        createPortal(
          <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
}

function ImageLightbox({ src, alt, onClose }) {
  useLockBodyScroll();

  return (
    <div className="img-lightbox-overlay" onClick={onClose}>
      <button
        type="button"
        className="img-lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        <FaTimes />
      </button>
      <img
        src={src}
        alt={alt}
        className="img-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default ZoomableImage;