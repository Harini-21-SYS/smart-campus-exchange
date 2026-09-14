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
   Register number -> Year derivation

   Same parsing logic as Auth.jsx's deriveYearAndFinanceType,
   extracted here so IncomingRequestsSection (and anywhere else
   that needs a student's year from their register number) doesn't
   have to duplicate it. Year itself is never stored in the
   database — it's always derived from the register number on
   demand, on whichever side needs it.
   ========================================================= */

const REGISTER_NUMBER_PARSE_REGEX = /^(\d{2})([Ss]?)([Aa]?)([UuPp])([A-Za-z]+)(\d{2})$/;
const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year"];

export function deriveYearFromRegisterNumber(registerNumber) {
  if (!registerNumber) return "—";

  const match = registerNumber.trim().match(REGISTER_NUMBER_PARSE_REGEX);
  if (!match) return "—";

  const [, yearDigits, , , levelChar] = match;
  const admissionYear = 2000 + parseInt(yearDigits, 10);
  const currentYear = new Date().getFullYear();

  const isPG = levelChar.toUpperCase() === "P";
  const maxYears = isPG ? 2 : 3;

  let yearNumber = currentYear - admissionYear + 1;
  if (yearNumber < 1) yearNumber = 1;
  if (yearNumber > maxYears) return "—";

  return admissionYear <= currentYear ? YEAR_LABELS[yearNumber - 1] : "—";
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

    department: product.ownerDepartment || "",

    sellerProfileImage: product.ownerProfileImage
      ? `${PROFILE_IMAGE_BASE_URL}${product.ownerProfileImage}`
      : null,

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