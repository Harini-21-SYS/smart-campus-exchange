import axios from "axios";

const BASE_URL = "http://localhost:8081/api/notifications";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};


// ========================================
// GET MY NOTIFICATIONS
// ========================================

export const getMyNotifications = async () => {

  const response = await axios.get(
    BASE_URL,
    getAuthHeaders()
  );

  return response.data;
};


// ========================================
// MARK ONE NOTIFICATION AS READ
// ========================================

export const markNotificationAsRead = async (
  notificationId
) => {

  const response = await axios.put(
    `${BASE_URL}/${notificationId}/read`,
    {},
    getAuthHeaders()
  );

  return response.data;
};


// ========================================
// MARK ALL NOTIFICATIONS AS READ
// ========================================

export const markAllNotificationsAsRead = async () => {

  const response = await axios.put(
    `${BASE_URL}/read-all`,
    {},
    getAuthHeaders()
  );

  return response.data;
};
// ========================================
// GET UNREAD NOTIFICATION COUNT
// ========================================

export const getUnreadNotificationCount = async () => {

  const response = await axios.get(
    `${BASE_URL}/unread-count`,
    getAuthHeaders()
  );

  return response.data;
};