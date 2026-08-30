/* ---------------------------------------------------------
   Shared helper functions used by StudentDashboard and its
   sections. Pure functions only — no React/state here.
--------------------------------------------------------- */

import { TYPES, PROFILE_IMAGE_BASE_URL } from "../constants";

/* =========================================================
   Browsing / purchase history
   ========================================================= */

export function loadHistory(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


/* =========================================================
   Interest scores
   ========================================================= */

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

  return {
    categoryScores,
    typeScores,
  };
}


/* =========================================================
   Personalized recommendations
   ========================================================= */

export function getRecommendations(
  products,
  browsingHistory,
  purchaseHistory,
  limit = 6
) {
  const {
    categoryScores,
    typeScores,
  } = buildInterestScores(
    browsingHistory,
    purchaseHistory
  );

  const hasSignal =
    Object.keys(categoryScores).length > 0;

  const scored = products
    .map((p) => ({
      product: p,
      score:
        (categoryScores[p.category] || 0) +
        (typeScores[p.type] || 0) * 0.5,
    }))
    .sort((a, b) => b.score - a.score);

  const personalizedItems = scored
    .filter((s) => s.score > 0)
    .map((s) => s.product);

  const items = personalizedItems.slice(0, limit);

  if (items.length < limit) {
    const usedIds = new Set(
      items.map((p) => p.id)
    );

    const fillers = products
      .filter((p) => !usedIds.has(p.id))
      .slice(0, limit - items.length);

    items.push(...fillers);
  }

  return {
    items,
    personalized:
      hasSignal &&
      personalizedItems.length > 0,
  };
}


/* =========================================================
   Relative time helper
   ========================================================= */

export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);

  const mins = Math.round(diff / 60000);

  if (mins < 1) return "just now";

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs = Math.round(mins / 60);

  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  const days = Math.round(hrs / 24);

  return `${days}d ago`;
}


/* =========================================================
   Normalize backend product type
   ========================================================= */

function normalizeProductType(rawType) {
  if (typeof rawType !== "string") {
    return rawType;
  }

  const trimmed = rawType.trim();

  const match = TYPES.find(
    (t) =>
      t.toLowerCase() ===
      trimmed.toLowerCase()
  );

  return match || trimmed;
}


/* =========================================================
   Backend API origin
   ========================================================= */

const API_ORIGIN = "http://localhost:8081";


/* =========================================================
   Backend -> Frontend product shape
   ========================================================= */

export function mapBackendProduct(product) {

  const resolvedId =
    product.productId ??
    product.id ??
    product._id;

  if (resolvedId === undefined) {
    console.warn(
      "mapBackendProduct: product has no productId/id/_id field",
      product
    );
  }

  return {
    id: resolvedId,

    name: product.title,

    description: product.description,

    category: product.category,

    type: normalizeProductType(
      product.type
    ),

    price:
      product.price !== null &&
      product.price !== undefined
        ? Number(product.price)
        : 0,

    condition: product.condition,

    status: product.status,

    sellerName:
      product.ownerName ||
      "Unknown Student",

    ownerId: product.ownerId,

    // FIX: this was hardcoded to "" before, silently discarding
    // `ownerDepartment` even though the backend DTO (ProductResponse)
    // already sends it. The Student entity has department as
    // nullable = false, so every product's owner genuinely has one —
    // it just never made it past this mapper.
    department: product.ownerDepartment || "",

    // FIX: previously not mapped at all — the key from the backend
    // (`ownerProfileImage`) was silently dropped. Same treatment as
    // the student's own profile image in StudentDashboard.jsx
    // (PROFILE_IMAGE_BASE_URL + the stored path), so seller avatars
    // resolve the same way your own avatar already does.
    sellerProfileImage: product.ownerProfileImage
      ? `${PROFILE_IMAGE_BASE_URL}${product.ownerProfileImage}`
      : null,

    // FIX: previously not mapped at all. `null` here (rather than a
    // fallback number) is intentional — it means "no trust score yet
    // computed for this student" (e.g. no completed transactions),
    // which ProductCard/ProductDetailSection already handle by hiding
    // the trust badge instead of showing a fake 0.
    sellerTrustScore:
      product.trustScore !== null &&
      product.trustScore !== undefined
        ? product.trustScore
        : null,

    images: (product.images || []).map(
      (img) => ({
        id: img.imageId,

        imageId: img.imageId,

        url: img.imageUrl
          ? `${API_ORIGIN}${img.imageUrl}`
          : "",

        isPrimary: img.primary,

        file: null,
      })
    ),

    primaryIndex: Math.max(
      0,
      (product.images || []).findIndex(
        (img) => img.primary
      )
    ),
  };
}