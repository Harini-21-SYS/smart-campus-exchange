// MyProductsSection.jsx
//
// Completed products: once a product's transaction is completed, the
// backend marks it "SOLD" (Buy), "EXCHANGED" (Exchange), or "DONATED"
// (Donate) and transfers ownership to the other party — see
// ProductService.ACQUIRED_STATUSES / PickupScheduleServiceImpl
// .confirmProductReceived() on the backend. A fresh getMyProducts()
// call already excludes these entirely, so in practice a completed
// item just disappears from this list on reload. This check exists
// as a safety net for the window between completion and the next
// refresh, so a stale in-memory copy doesn't keep showing live
// Edit/Delete buttons in the meantime.
//
// Blocked products: when an admin blocks a product its status becomes
// "BLOCKED". It stays in the seller's list (so they can see what
// happened), shows a Blocked badge, and Edit / Delete are hidden
// until the admin unblocks it.
import { useState, useEffect } from "react";
import { FaPlus, FaPen, FaTrashAlt, FaCheckCircle, FaBan } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";
import { PAGE_SIZE } from "../constants";
import "./BrowseProductsSection.css";

const COMPLETED_STATUSES = ["SOLD", "EXCHANGED", "DONATED"];

function isCompleted(product) {
  return COMPLETED_STATUSES.includes(String(product?.status).toUpperCase());
}

function isBlocked(product) {
  return String(product?.status).toUpperCase() === "BLOCKED";
}

function MyProductsSection({ products = [], onOpen, onAdd, onEdit, onDelete }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Chooses which owner actions a card shows, based on its status.
  const renderActions = (p) => {
    if (isCompleted(p)) {
      return (product) => (
        <div className="pcard-owner-actions" onClick={(e) => e.stopPropagation()}>
          <span className="pcard-completed-badge">
            <FaCheckCircle /> Completed
          </span>
        </div>
      );
    }

    if (isBlocked(p)) {
      return (product) => (
        <div className="pcard-owner-actions" onClick={(e) => e.stopPropagation()}>
          <span className="pcard-blocked-badge">
            <FaBan /> Blocked by admin
          </span>
        </div>
      );
    }

    return (product) => (
      <div className="pcard-owner-actions" onClick={(e) => e.stopPropagation()}>
        <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => onEdit(product)}>
          <FaPen /> Edit
        </button>
        <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => onDelete(product)}>
          <FaTrashAlt /> Delete
        </button>
      </div>
    );
  };

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
                actions={renderActions(p)}
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