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
// CREATE PICKUP SCHEDULE (seller proposes)
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
// BUYER CONFIRMS THE PROPOSED SCHEDULE
//
// PUT /api/pickups/{pickupId}/confirm-schedule
// ========================================

export const confirmSchedule = async (
  pickupId
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/confirm-schedule`,

      {},

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// BUYER REQUESTS A DIFFERENT TIME/LOCATION
//
// PUT /api/pickups/{pickupId}/request-reschedule
// body: { reason }
// ========================================

export const requestReschedule = async (
  pickupId,
  reason
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/request-reschedule`,

      { reason },

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// SELLER RE-PROPOSES A NEW TIME/LOCATION
//
// PUT /api/pickups/{pickupId}/reschedule
// body: { location, pickupDate, pickupTime }
// ========================================

export const reschedulePickup = async (
  pickupId,
  pickupDetails
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/reschedule`,

      pickupDetails,

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// SELLER CONFIRMS HANDOVER (only valid once CONFIRMED)
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
// PUT /api/pickups/{pickupId}/report-delivery-issue
// body: { issueReason, description }
// ========================================

export const reportDeliveryIssue = async (
  pickupId,
  issueDetails
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/report-delivery-issue`,

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


// ========================================
// BUYER RATES THE SELLER (only once COMPLETED)
//
// PUT /api/pickups/{pickupId}/rate
// body: { rating, comment }
// ========================================

export const rateSeller = async (
  pickupId,
  ratingDetails
) => {

  const response =
    await axios.put(

      `${BASE_URL}/${pickupId}/rate`,

      ratingDetails,

      getAuthHeaders()

    );

  return response.data;
};


// ========================================
// RAISE A COMPLAINT AFTER A COMPLETED PICKUP
// (distinct from reportDeliveryIssue, which only
// applies mid-handover)
//
// POST /api/pickups/{pickupId}/complaint
// body: { complaintType, description }
// ========================================

export const raiseComplaint = async (
  pickupId,
  complaintDetails
) => {

  const response =
    await axios.post(

      `${BASE_URL}/${pickupId}/complaint`,

      complaintDetails,

      getAuthHeaders()

    );

  return response.data;
};