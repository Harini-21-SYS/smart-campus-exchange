import axios from "axios";

const BASE_URL = "http://localhost:8081/api/auth";

export const registerUser = async (userData) => {

    const response = await axios.post(
        `${BASE_URL}/register`,
        userData
    );

    return response.data;
};

export const verifyOtp = async (otpData) => {

    const response = await axios.post(
        `${BASE_URL}/verify-otp`,
        otpData
    );

    return response.data;
};

export const loginUser = async (loginData) => {

    const response = await axios.post(
        `${BASE_URL}/login`,
        loginData
    );

    return response.data;
};

export const resendOtp = async (email) => {

    const response = await axios.post(
         `${BASE_URL}/resend-otp?email=${encodeURIComponent(email)}`
    );

    return response.data;
};

export const forgotPassword = async (data) => {

    const response = await axios.post(
        "http://localhost:8081/api/auth/forgot-password",
        data
    );

    return response.data;
};

export const verifyForgotOtp = async (data) => {

    const response = await axios.post(
        "http://localhost:8081/api/auth/verify-forgot-otp",
        data
    );

    return response.data;
};

export const resetPassword = async (data) => {

    const response = await axios.post(
        "http://localhost:8081/api/auth/reset-password",
        data
    );

    return response.data;
};