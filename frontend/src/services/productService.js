import axios from "axios";

const BASE_URL = "http://localhost:8081/api/products";

const authHeaders = (extra = {}) => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  ...extra,
});

/* Builds a multipart payload: a JSON "product" part + one "images"
   part per file.

   ASSUMPTION: this expects a Spring endpoint shaped like:
     @PostMapping(consumes = "multipart/form-data")
     public ProductResponseDTO addProduct(
         @RequestPart("product") ProductRequestDTO product,
         @RequestPart(value = "images", required = false) List<MultipartFile> images)

   If your controller uses different part names, update the two
   `formData.append(...)` calls below to match. */
function buildProductFormData(product, imageFiles = []) {
  const formData = new FormData();
  formData.append(
    "product",
    new Blob([JSON.stringify(product)], { type: "application/json" })
  );
  imageFiles.forEach((file) => formData.append("images", file));
  return formData;
}

// ADD PRODUCT (now accepts the raw image File objects too)
export const addProduct = async (product, imageFiles = []) => {
  const formData = buildProductFormData(product, imageFiles);
  const response = await axios.post(BASE_URL, formData, {
    headers: authHeaders({ "Content-Type": "multipart/form-data" }),
  });
  return response.data;
};

// GET ALL PRODUCTS
export const getAllProducts = async () => {
  const response = await axios.get(BASE_URL, { headers: authHeaders() });
  return response.data;
};

// GET PRODUCT BY ID
export const getProductById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`, { headers: authHeaders() });
  return response.data;
};

// UPDATE PRODUCT (also accepts new image files, appended alongside existing ones)
export const updateProduct = async (id, product, imageFiles = []) => {
  const formData = buildProductFormData(product, imageFiles);
  const response = await axios.put(`${BASE_URL}/${id}`, formData, {
    headers: authHeaders({ "Content-Type": "multipart/form-data" }),
  });
  return response.data;
};

// DELETE PRODUCT
export const deleteProduct = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`, { headers: authHeaders() });
  return response.data;
};