/* Wireframe-style crossed box shown when a product has no image */
function ImagePlaceholder() {
  return (
    <div className="pcard-image">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pcard-image-cross">
        <rect x="1" y="1" width="98" height="98" rx="6" />
        <line x1="1" y1="1" x2="99" y2="99" />
        <line x1="99" y1="1" x2="1" y2="99" />
      </svg>
    </div>
  );
}

export default ImagePlaceholder;