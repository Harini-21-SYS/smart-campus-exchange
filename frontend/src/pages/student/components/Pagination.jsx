import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const addRange = (start, end) => {
    for (let i = start; i <= end; i++) pages.push(i);
  };

  if (totalPages <= 7) {
    addRange(1, totalPages);
  } else if (page <= 4) {
    addRange(1, 5);
    pages.push("...");
    pages.push(totalPages);
  } else if (page >= totalPages - 3) {
    pages.push(1);
    pages.push("...");
    addRange(totalPages - 4, totalPages);
  } else {
    pages.push(1);
    pages.push("...");
    addRange(page - 1, page + 1);
    pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="pg-bar">
      <button className="pg-arrow" disabled={page === 1} onClick={() => onChange(Math.max(1, page - 1))}>
        <FaChevronLeft />
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`e-${idx}`} className="pg-ellipsis">...</span>
        ) : (
          <button key={p} className={`pg-num ${p === page ? "pg-active" : ""}`} onClick={() => onChange(p)}>
            {p}
          </button>
        )
      )}

      <button className="pg-arrow" disabled={page === totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>
        <FaChevronRight />
      </button>
    </div>
  );
}

export default Pagination;