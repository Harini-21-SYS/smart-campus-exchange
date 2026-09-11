import axios from "axios";

const BASE_URL =
  "http://localhost:8081/api/pickups";


// ========================================
// AUTH HEADERS
// ========================================

const getAuthHeaders = () => {

  const token =
    localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};


// ========================================
// CREATE PICKUP SCHEDULE
//
// POST /api/pickups/request/{requestId}
// ========================================

export const createPickupSchedule = async (
  requestId,
  pickupDetails
) => {

  const response =
    await axios.post(

      `${BASE_URL}/request/${requestId}`,

      pickupDetails,

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// GET PICKUP BY ID
//
// GET /api/pickups/{pickupId}
// ========================================

export const getPickupById = async (
  pickupId
) => {

  const response =
    await axios.get(

      `${BASE_URL}/${pickupId}`,

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// GET PICKUP BY REQUEST ID
//
// GET /api/pickups/request/{requestId}
// ========================================

export const getPickupByRequestId = async (
  requestId
) => {

  const response =
    await axios.get(

      `${BASE_URL}/request/${requestId}`,

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// GET ALL PICKUPS
//
// GET /api/pickups
// ========================================

export const getAllPickups = async () => {

  const response =
    await axios.get(

      BASE_URL,

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// SELLER CONFIRMS HANDOVER
//
// PUT /api/pickups/{pickupId}/handover
// ========================================

export const markAsHandedOver = async (
  pickupId
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/handover`,

      {},

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// BUYER CONFIRMS PRODUCT RECEIVED
//
// PUT /api/pickups/{pickupId}/confirm-received
// ========================================

export const confirmProductReceived = async (
  pickupId
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/confirm-received`,

      {},

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// BUYER REPORTS DELIVERY ISSUE
//
// PUT /api/pickups/{pickupId}/delivery-issue
// ========================================

export const reportDeliveryIssue = async (
  pickupId,
  issueDetails
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/delivery-issue`,

      issueDetails,

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// CANCEL PICKUP
//
// PUT /api/pickups/{pickupId}/cancel
// ========================================

export const cancelPickup = async (
  pickupId
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/cancel`,

      {},

      getAuthHeaders()

    );

  return response.data;
};