/* ---------------------------------------------------------
   Shared helper functions used by StudentDashboard and its
   sections. Pure functions only — no React/state here.
--------------------------------------------------------- */

/* ----------- Browsing / purchase history (localStorage) ----------- */
export function loadHistory(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildInterestScores(browsingHistory, purchaseHistory) {
  const categoryScores = {};
  const typeScores = {};

  const bump = (store, key, weight) => {
    if (!key) return;
    store[key] = (store[key] || 0) + weight;
  };

  browsingHistory.forEach((entry) => {
    bump(categoryScores, entry.category, 1);
    bump(typeScores, entry.type, 1);
  });
  purchaseHistory.forEach((entry) => {
    bump(categoryScores, entry.category, 3);
    bump(typeScores, entry.type, 3);
  });

  return { categoryScores, typeScores };
}

/* ----------- Personalized recommendations ----------- */
export function getRecommendations(products, browsingHistory, purchaseHistory, limit = 6) {
  const { categoryScores, typeScores } = buildInterestScores(browsingHistory, purchaseHistory);
  const hasSignal = Object.keys(categoryScores).length > 0;

  const scored = products
    .map((p) => ({
      product: p,
      score: (categoryScores[p.category] || 0) + (typeScores[p.type] || 0) * 0.5,
    }))
    .sort((a, b) => b.score - a.score);

  const personalizedItems = scored.filter((s) => s.score > 0).map((s) => s.product);
  const items = personalizedItems.slice(0, limit);

  if (items.length < limit) {
    const usedIds = new Set(items.map((p) => p.id));
    const fillers = products.filter((p) => !usedIds.has(p.id)).slice(0, limit - items.length);
    items.push(...fillers);
  }

  return { items, personalized: hasSignal && personalizedItems.length > 0 };
}

/* ----------- Relative time helper (e.g. "3h ago") ----------- */
export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

/* ----------- Backend -> frontend product shape ----------- */
export function mapBackendProduct(product) {
  return {
    id: product.id,
    name: product.title,
    description: product.description,
    category: product.category,
    type: product.type,
    price: product.price ? Number(product.price) : 0,
    condition: product.condition,
    status: product.status,

    sellerName: product.owner?.fullName || "Unknown Student",
    department: product.owner?.department || "",

    ownerId: product.owner?.studentId,

    images: (product.images || []).map((img) => ({
      id: img.id,
      url: img.imageUrl,
      isPrimary: img.primary,
    })),

    primaryIndex: Math.max(
      0,
      (product.images || []).findIndex((img) => img.primary)
    ),
  };
}