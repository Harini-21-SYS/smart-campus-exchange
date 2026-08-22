import { useState, useEffect } from "react";
import { FaPlus, FaPen, FaTrashAlt } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";
import { PAGE_SIZE } from "../constants";
// Reuses the product-grid / pcard / filter-bar styles already
// defined in BrowseProductsSection.css — no need to redeclare them.
import "./BrowseProductsSection.css";

function MyProductsSection({ products, onOpen, onAdd, onEdit, onDelete }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>My Products</h1>
        <button className="dash-btn dash-btn-primary" onClick={onAdd}>
          <FaPlus /> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          subtitle="You haven't listed any products yet."
          action={
            <button className="dash-btn dash-btn-primary" onClick={onAdd} style={{ marginTop: 18 }}>
              <FaPlus /> List Your First Product
            </button>
          }
        />
      ) : (
        <>
          <div className="product-grid">
            {pageItems.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={onOpen}
                actions={(product) => (
                  <div className="pcard-owner-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => onEdit(product)}>
                      <FaPen /> Edit
                    </button>
                    <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => onDelete(product)}>
                      <FaTrashAlt /> Delete
                    </button>
                  </div>
                )}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export default MyProductsSection;