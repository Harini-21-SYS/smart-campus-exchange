import axios from "axios";

// Adjust this to wherever your backend actually mounts the requests
// controller — this assumes the same host as the product/profile image
// APIs (see PROFILE_IMAGE_BASE_URL in constants.js).
const API_BASE_URL = "http://localhost:8081/api/requests";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ---------------------------------------------------------
   Incoming — requests other students sent for MY listings
--------------------------------------------------------- */
export async function getIncomingRequests() {
  const res = await axios.get(`${API_BASE_URL}/incoming`, { headers: authHeaders() });
  return res.data;
}

export async function acceptRequest(requestId) {
  const res = await axios.put(`${API_BASE_URL}/${requestId}/accept`, {}, { headers: authHeaders() });
  return res.data;
}

export async function rejectRequest(requestId) {
  const res = await axios.put(`${API_BASE_URL}/${requestId}/reject`, {}, { headers: authHeaders() });
  return res.data;
}

/* ---------------------------------------------------------
   Mine — requests I sent for OTHER students' listings
--------------------------------------------------------- */
export async function getMyRequests() {
  const res = await axios.get(`${API_BASE_URL}/mine`, { headers: authHeaders() });
  return res.data;
}

export async function cancelRequest(requestId) {
  const res = await axios.delete(`${API_BASE_URL}/${requestId}`, { headers: authHeaders() });
  return res.data;
}