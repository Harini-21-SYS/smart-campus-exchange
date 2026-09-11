import axios from "axios";

const BASE_URL = "http://localhost:8081/api/requests";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};


// ==========================================
// CREATE REQUEST
// ==========================================

export const createRequest = async (requestData) => {

  const response = await axios.post(
    BASE_URL,
    requestData,
    getAuthHeaders()
  );

  return response.data;
};


// ==========================================
// GET MY REQUESTS
// ==========================================

export const getMyRequests = async () => {

  const response = await axios.get(
    `${BASE_URL}/my`,
    getAuthHeaders()
  );

  return response.data;
};


// ==========================================
// ACCEPT REQUEST
// ==========================================

export const acceptRequest = async (requestId) => {

  const response = await axios.put(
    `${BASE_URL}/${requestId}/accept`,
    {},
    getAuthHeaders()
  );

  return response.data;
};


// ==========================================
// REJECT REQUEST
// ==========================================

export const rejectRequest = async (requestId) => {

  const response = await axios.put(
    `${BASE_URL}/${requestId}/reject`,
    {},
    getAuthHeaders()
  );

  return response.data;
};


// ==========================================
// CANCEL REQUEST
// ==========================================

export const cancelRequest = async (requestId) => {

  const response = await axios.put(
    `${BASE_URL}/${requestId}/cancel`,
    {},
    getAuthHeaders()
  );

  return response.data;
};