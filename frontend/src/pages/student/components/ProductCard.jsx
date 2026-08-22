import ImagePlaceholder from "./ImagePlaceholder";
import { TYPE_INFO } from "../constants";

/* Used both in the marketplace grid and the "My Products" grid
   (the `actions` render-prop differs between them) */
function ProductCard({ product, onOpen, actions }) {
  const info = TYPE_INFO[product.type];

  return (
    <div className="pcard" onClick={() => onOpen(product)}>
      {product.images?.[product.primaryIndex ?? 0] ? (
        <div className="pcard-image">
          <img src={product.images[product.primaryIndex ?? 0].url} alt={product.name} />
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