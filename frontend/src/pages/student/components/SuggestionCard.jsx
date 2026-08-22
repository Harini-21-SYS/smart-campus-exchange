import ImagePlaceholder from "./ImagePlaceholder";

function SuggestionCard({ product, onOpen }) {
  return (
    <button type="button" className="sugg-card" onClick={() => onOpen(product)}>
      {product.images?.[product.primaryIndex ?? 0] ? (
        <div className="sugg-card-image">
          <img src={product.images[product.primaryIndex ?? 0].url} alt={product.name} />
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