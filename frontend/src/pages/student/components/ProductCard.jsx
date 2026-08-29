import { useState } from "react";
import ImagePlaceholder from "./ImagePlaceholder";
import { TYPE_INFO } from "../constants";

// Fallback used when a product's `type` doesn't match any key in
// TYPE_INFO (e.g. a casing mismatch like "sell" vs "Sell", a stray
// space, or a type the backend added that TYPE_INFO hasn't been
// updated to include yet). Without this, `TYPE_INFO[product.type]`
// is undefined and reading `.badgeClass` off it throws — and since
// there's no error boundary in this app, that uncaught render error
// unmounts the *entire* tree, not just this card. That's why the
// whole dashboard was flashing and then disappearing: it rendered
// fine while `products` was still empty, then crashed the instant
// real product data (with a bad `type`) came in.
const UNKNOWN_TYPE_INFO = {
  badgeClass: "pcard-type-badge--unknown",
  actionLabel: "View",
};

/* Used both in the marketplace grid and the "My Products" grid
   (the `actions` render-prop differs between them) */
function ProductCard({ product, onOpen, actions }) {
  const info = TYPE_INFO[product.type] ?? UNKNOWN_TYPE_INFO;

  if (!TYPE_INFO[product.type]) {
    // Surface it in dev without crashing — this points straight at the
    // bad record instead of a blank page and a stack trace with no context.
    console.warn(
      `ProductCard: unrecognized product.type "${product.type}" for product`,
      product
    );
  }

  // Only render a real <img> when there's an actual url to load. Checking
  // just `product.images?.[index]` (object presence) isn't enough — if
  // mapBackendProduct's `url: img.imageUrl` guess doesn't match the
  // backend's real field name, the image object still exists but `.url`
  // is undefined, so this used to render a broken <img src={undefined}>.
  // A broken image doesn't respect object-fit/aspect-ratio like a loaded
  // one does, so its native "broken icon + alt text" spills outside the
  // card's fixed image box — which is what looked like misaligned CSS.
  const primaryImage = product.images?.[product.primaryIndex ?? 0];
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(primaryImage?.url) && !imageFailed;

  return (
    <div className="pcard" onClick={() => onOpen(product)}>
      {hasImage ? (
        <div className="pcard-image">
          <img
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

      <div className="pcard-footer">
        <span className="pcard-price">{product.type === "Sell" ? `₹ ${product.price}` : "Free"}</span>
        {actions(product)}
      </div>
    </div>
  );
}

export default ProductCard;