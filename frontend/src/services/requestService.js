import axios from "axios";

const BASE_URL = "http://localhost:8081/api/requests";

// ADD REQUEST
export const addRequest = async (request) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    BASE_URL,
    request,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// GET ALL REQUESTS
export const getAllRequests = async () => {
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

// GET REQUEST BY ID
export const getRequestById = async (id) => {
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

// UPDATE REQUEST
export const updateRequest = async (id, request) => {
  const token = localStorage.getItem("token");

  const response = await axios.put(
    `${BASE_URL}/${id}`,
    request,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// DELETE REQUEST
export const deleteRequest = async (id) => {
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