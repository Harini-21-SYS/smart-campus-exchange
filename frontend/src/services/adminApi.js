import axios from "axios";

const BASE_URL = "http://localhost:8081/api/admin";

const getToken = () => localStorage.getItem("token");

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {

    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const AdminApi = {

    getDashboard() {
        return api.get("/dashboard").then(res => res.data);
    },

    getStudents() {
        return api.get("/students").then(res => res.data);
    },

    getProducts() {
        return api.get("/products").then(res => res.data);
    },

    blockStudent(id) {
        return api.put(`/students/${id}/block`).then(res => res.data);
    },

    unblockStudent(id) {
        return api.put(`/students/${id}/unblock`).then(res => res.data);
    },

    deleteProduct(id) {
        return api.delete(`/products/${id}`).then(res => res.data);
    }

};