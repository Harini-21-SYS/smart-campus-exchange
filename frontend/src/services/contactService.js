// services/contactService.js
import axios from "axios";

const API_URL = "http://localhost:8081/api/contact";

// Public endpoint — no auth token needed.
export const sendContactMessage = async (data) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};