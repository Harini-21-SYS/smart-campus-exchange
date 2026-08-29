import { useState } from "react";
import ImagePlaceholder from "./ImagePlaceholder";

function SuggestionCard({ product, onOpen }) {
  // Same fix as ProductCard.jsx: check for a real `.url`, not just that
  // an image object exists at that index. If mapBackendProduct's
  // `url: img.imageUrl` guess doesn't match the backend's actual field
  // name, the image object is still truthy but `.url` is undefined —
  // that used to render a broken <img src={undefined}>, and a broken
  // image ignores object-fit/aspect-ratio, so its native "broken icon +
  // alt text" spilled outside the card box. That's the "Popular Picks"
  // row breaking layout in the screenshot, not a CSS issue.
  const primaryImage = product.images?.[product.primaryIndex ?? 0];
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(primaryImage?.url) && !imageFailed;

  return (
    <button type="button" className="sugg-card" onClick={() => onOpen(product)}>
      {hasImage ? (
        <div className="sugg-card-image">
          <img
            src={primaryImage.url}
            alt={product.name}
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div className="sugg-card-image">
          <ImagePlaceholder />
        </div>
      )}
      <span className="sugg-card-name">{product.name}</span>
      <span className="sugg-card-price">{product.type === "Sell" ? `₹ ${product.price}` : "Free"}</span>
    </button>
  );
}

export default SuggestionCard;