// productApi.js
import axios from "axios";

const BASE_URL = "http://localhost:8081/api/products";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

/* =========================================================
   CURRENT LOGGED-IN STUDENT ID
   Decoded straight from the JWT stored in localStorage (no extra
   network call). Used anywhere the UI needs to know "is this MY
   product" — e.g. hiding the Buy/Donate/Exchange button on your
   own listing in ProductDetailSection.
   ========================================================= */
export const getCurrentStudentId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payloadSegment = token.split(".")[1];
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(normalized);
    const payload = JSON.parse(payloadJson);

    // Different backends put the id under different claim names —
    // check the common ones rather than assuming just one.
    return payload.studentId ?? payload.id ?? payload.userId ?? payload.sub ?? null;
  } catch (err) {
    console.warn("getCurrentStudentId: failed to decode token", err);
    return null;
  }
};

/* =========================================================
   ADD PRODUCT + IMAGES
   POST /api/products
   ========================================================= */

export const addProduct = async (
  product,
  imageFiles = [],
  primaryImageIndex = null
) => {
  const formData = new FormData();

  formData.append(
    "product",
    new Blob(
      [JSON.stringify(product)],
      {
        type: "application/json",
      }
    )
  );

  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  if (
    primaryImageIndex !== null &&
    primaryImageIndex !== undefined
  ) {
    formData.append(
      "primaryImageIndex",
      primaryImageIndex
    );
  }

  const response = await axios.post(
    BASE_URL,
    formData,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


/* =========================================================
   GET ALL / OTHER STUDENTS' PRODUCTS
   GET /api/products
   ========================================================= */

export const getAllProducts = async () => {
  const response = await axios.get(
    BASE_URL,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


/* =========================================================
   GET MY PRODUCTS
   GET /api/products/my
   ========================================================= */

export const getMyProducts = async () => {
  const response = await axios.get(
    `${BASE_URL}/my`,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


/* =========================================================
   GET PRODUCT BY ID
   GET /api/products/{id}
   ========================================================= */

export const getProductById = async (id) => {
  const response = await axios.get(
    `${BASE_URL}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


/* =========================================================
   UPDATE PRODUCT DETAILS
   PUT /api/products/{id}
   ========================================================= */

export const updateProduct = async (
  id,
  product
) => {
  const response = await axios.put(
    `${BASE_URL}/${id}`,
    product,
    {
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};


/* =========================================================
   DELETE PRODUCT
   DELETE /api/products/{id}
   ========================================================= */

export const deleteProduct = async (id) => {
  await axios.delete(
    `${BASE_URL}/${id}`,
    {
      headers: authHeaders(),
    }
  );
};


/* =========================================================
   ADD MORE PRODUCT IMAGES
   POST /api/products/{id}/images
   ========================================================= */

export const uploadProductImages = async (
  productId,
  imageFiles = [],
  primaryImageIndex = null
) => {
  const formData = new FormData();

  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  if (
    primaryImageIndex !== null &&
    primaryImageIndex !== undefined
  ) {
    formData.append(
      "primaryImageIndex",
      primaryImageIndex
    );
  }

  const response = await axios.post(
    `${BASE_URL}/${productId}/images`,
    formData,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


/* =========================================================
   DELETE PRODUCT IMAGE
   DELETE /api/products/{productId}/images/{imageId}
   ========================================================= */

export const deleteProductImage = async (
  productId,
  imageId
) => {
  await axios.delete(
    `${BASE_URL}/${productId}/images/${imageId}`,
    {
      headers: authHeaders(),
    }
  );
};


/* =========================================================
   SET PRIMARY IMAGE
   PUT /api/products/{productId}/images/{imageId}/primary
   ========================================================= */

export const setPrimaryImage = async (
  productId,
  imageId
) => {
  const response = await axios.put(
    `${BASE_URL}/${productId}/images/${imageId}/primary`,
    {},
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


/* =========================================================
   BROWSE PRODUCTS
   GET /api/products
   ========================================================= */

export const getBrowseProducts = async () => {
  const response = await axios.get(
    BASE_URL,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


/* =========================================================
   SELLER PUBLIC PROFILE
   No dedicated /api/users/{id} endpoint exists yet, so this is
   built from data already embedded on product records. Any
   product by this seller carries their name/department/avatar/
   trust score — we just need one such product to build the
   header, and the caller (SellerProfileSection) also calls
   getProductsBySeller for the listings + count.

   NOTE: assumes each product has a `sellerId` field alongside
   the existing sellerName / sellerProfileImage / sellerTrustScore
   fields. If your backend calls this field something else
   (ownerId, studentId, etc.), update the two spots below marked
   with a comment.
   ========================================================= */

export const getProductsBySeller = async (sellerId) => {
  const all = await getAllProducts();
  return (all || []).filter(
    (p) => String(p.sellerId) === String(sellerId) // <-- adjust field name here if needed
  );
};

export const getSellerProfile = async (sellerId) => {
  const sellerProducts = await getProductsBySeller(sellerId);

  if (sellerProducts.length === 0) {
    // No listings to read seller info off of — nothing to build a profile from.
    return null;
  }

  const sample = sellerProducts[0];

  return {
    id: sellerId,
    name: sample.sellerName || "Unknown student",
    department: sample.department || null,
    profileImage: sample.sellerProfileImage || null,
    trustScore:
      sample.sellerTrustScore !== null && sample.sellerTrustScore !== undefined
        ? sample.sellerTrustScore
        : null,
  };
};