import { useState, useRef, useEffect, useMemo } from "react";
import { FaSearch, FaHistory, FaFire } from "react-icons/fa";
import ImagePlaceholder from "../components/ImagePlaceholder";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";
import SuggestionCard from "../components/SuggestionCard";
import { CATEGORIES, TYPE_INFO, PAGE_SIZE } from "../constants";
import "./BrowseProductsSection.css";

/* Marketplace "Products" — browse everyone else's listings. Search
   box surfaces personalized suggestions driven by browsing +
   purchase history (see getRecommendations in utils/dashboardUtils). */
function BrowseProductsSection({ products, onOpen, recommendations }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All Categories" || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => setPage(1), [query, category]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Close the suggestions dropdown on an outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // What shows in the dropdown while the search box is focused:
  // - empty query  -> personalized picks (browsing + purchase history)
  // - typed query  -> matching products, most relevant to this student first
  const dropdownItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      return recommendations.items.slice(0, 5);
    }

    const recommendedIds = new Set(recommendations.items.map((p) => p.id));
    return products
      .filter((p) => p.name.toLowerCase().includes(trimmed))
      .sort((a, b) => Number(recommendedIds.has(b.id)) - Number(recommendedIds.has(a.id)))
      .slice(0, 6);
  }, [query, products, recommendations]);

  const dropdownLabel = query.trim()
    ? "Matching products"
    : recommendations.personalized
    ? "Based on your activity"
    : "Popular right now";

  const handleSuggestionClick = (product) => {
    setShowSuggestions(false);
    onOpen(product);
  };

  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Products</h1>
      </div>

      <div className="dash-filter-bar">
        <div className="dash-search-box dash-search-box-wrap" ref={searchWrapRef}>
          <FaSearch className="dash-search-icon" />
          <input
            type="text"
            placeholder="Search products"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
          />

          {showSuggestions && dropdownItems.length > 0 && (
            <div className="search-suggest-dropdown">
              <div className="search-suggest-header">
                {query.trim() ? (
                  <FaSearch />
                ) : recommendations.personalized ? (
                  <FaHistory />
                ) : (
                  <FaFire />
                )}
                <span>{dropdownLabel}</span>
              </div>

              {dropdownItems.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="search-suggest-item"
                  onClick={() => handleSuggestionClick(p)}
                >
                  {p.images?.[p.primaryIndex ?? 0] ? (
                    <div className="search-suggest-thumb">
                      <img src={p.images[p.primaryIndex ?? 0].url} alt="" />
                    </div>
                  ) : (
                    <div className="search-suggest-thumb">
                      <ImagePlaceholder />
                    </div>
                  )}
                  <div className="search-suggest-text">
                    <span className="search-suggest-name">{p.name}</span>
                    <span className="search-suggest-meta">
                      {p.category} • {p.type === "Sell" ? `₹${p.price}` : "Free"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Personalized strip — only shown while browsing (no active search text)
          so it doesn't compete with search results. */}
      {!query.trim() && category === "All Categories" && recommendations.items.length > 0 && (
        <div className="sugg-strip">
          <div className="sugg-strip-header">
            {recommendations.personalized ? <FaHistory /> : <FaFire />}
            <h3>{recommendations.personalized ? "Recommended for You" : "Popular Picks"}</h3>
          </div>
          <div className="sugg-strip-row">
            {recommendations.items.map((p) => (
              <SuggestionCard key={p.id} product={p} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}

      {pageItems.length === 0 ? (
        <EmptyState subtitle="Try a different search term or category." />
      ) : (
        <>
          <div className="product-grid">
            {pageItems.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={onOpen}
                actions={(product) => {
                  const info = TYPE_INFO[product.type];
                  return (
                    <button
                      className={`pcard-action-btn ${info.badgeClass}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(product);
                      }}
                    >
                      {info.actionLabel}
                    </button>
                  );
                }}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export default BrowseProductsSection;