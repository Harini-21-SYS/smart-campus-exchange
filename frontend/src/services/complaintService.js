import axios from "axios";

const BASE_URL = "http://localhost:8081/api/complaints";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// ========================================
// CREATE COMPLAINT
// POST /api/complaints
// ========================================

export const createComplaint = async (complaintData) => {
  const response = await axios.post(
    BASE_URL,
    complaintData,
    getAuthConfig()
  );

  return response.data;
};


// ========================================
// GET MY COMPLAINTS
// GET /api/complaints/my
// ========================================

export const getMyComplaints = async () => {
  const response = await axios.get(
    `${BASE_URL}/my`,
    getAuthConfig()
  );

  return response.data;
};
// ========================================
// GET COMPLAINTS AGAINST ME
// GET /api/complaints/against-me
// ========================================

export const getComplaintsAgainstMe = async () => {

  const response = await axios.get(
    `${BASE_URL}/against-me`,
    getAuthConfig()
  );

  return response.data;
};

// ========================================
// GET COMPLAINT BY ID
// GET /api/complaints/{id}
// ========================================

export const getComplaintById = async (complaintId) => {
  const response = await axios.get(
    `${BASE_URL}/${complaintId}`,
    getAuthConfig()
  );

  return response.data;
};


// ========================================
// GET ALL COMPLAINTS
// GET /api/complaints
// ========================================

export const getAllComplaints = async () => {
  const response = await axios.get(
    BASE_URL,
    getAuthConfig()
  );

  return response.data;
};


// ========================================
// UPDATE COMPLAINT STATUS
// PUT /api/complaints/{id}/status?status=RESOLVED
// ========================================

export const updateComplaintStatus = async (
  complaintId,
  status
) => {
  const response = await axios.put(
    `${BASE_URL}/${complaintId}/status`,
    null,
    {
      ...getAuthConfig(),
      params: {
        status,
      },
    }
  );

  return response.data;
};


// ========================================
// ADD COMPLAINT REPLY
// POST /api/complaints/{id}/reply
// ========================================

export const addComplaintReply = async (
  complaintId,
  replyData
) => {
  const response = await axios.post(
    `${BASE_URL}/${complaintId}/reply`,
    replyData,
    getAuthConfig()
  );

  return response.data;
};