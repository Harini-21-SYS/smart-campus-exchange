import axios from "axios";

const BASE_URL = "http://localhost:8081/api/products";

// ADD PRODUCT
export const addProduct = async (product) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    BASE_URL,
    product,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// GET ALL PRODUCTS
export const getAllProducts = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    BASE_URL,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// GET PRODUCT BY ID
export const getProductById = async (id) => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${BASE_URL}/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// UPDATE PRODUCT
export const updateProduct = async (id, product) => {
  const token = localStorage.getItem("token");

  const response = await axios.put(
    `${BASE_URL}/${id}`,
    product,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// DELETE PRODUCT
export const deleteProduct = async (id) => {
  const token = localStorage.getItem("token");

  const response = await axios.delete(
    `${BASE_URL}/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};