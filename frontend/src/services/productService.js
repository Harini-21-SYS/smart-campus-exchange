import axios from "axios";

const BASE_URL = "http://localhost:8081/api/products";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

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