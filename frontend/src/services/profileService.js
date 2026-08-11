import axios from "axios";

const BASE_URL = "http://localhost:8081/api/profile";

export const getProfile = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${BASE_URL}/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateMobile = async (mobileNumber) => {
  const token = localStorage.getItem("token");

  const response = await axios.put(
    `${BASE_URL}/mobile`,
    {
      mobileNumber: mobileNumber,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateProfileImage = async (file) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.put(
    `${BASE_URL}/image`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// CHANGE PASSWORD
export const changePassword = async (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  const token = localStorage.getItem("token");

  const response = await axios.put(
    `${BASE_URL}/change-password`,
    {
      currentPassword,
      newPassword,
      confirmPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};