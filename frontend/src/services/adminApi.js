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

    // NOTE: now requires a reason — the backend rejects a blank one.
    blockStudent(id, reason) {
        return api.put(`/students/${id}/block`, { reason }).then(res => res.data);
    },

    unblockStudent(id) {
        return api.put(`/students/${id}/unblock`).then(res => res.data);
    },

    // ---------- Product moderation ----------

    blockProduct(id) {
        return api.put(`/products/${id}/block`).then(res => res.data);
    },

    unblockProduct(id) {
        return api.put(`/products/${id}/unblock`).then(res => res.data);
    },

    deleteProduct(id) {
        return api.delete(`/products/${id}`).then(res => res.data);
    },

    getComplaints() {
        return api.get("/complaints").then(res => res.data);
    },

    resolveComplaint(id, note) {
        return api.put(`/complaints/${id}/resolve`, { note: note || null }).then(res => res.data);
    },

    deleteComplaint(id) {
        return api.delete(`/complaints/${id}`).then(res => res.data);
    },

    getRequests() {
        return api.get("/requests").then(res => res.data);
    },

    // ---------- Contact messages (submitted via the public Contact form) ----------

    getContactMessages() {
        return api.get("/contact-messages").then(res => res.data);
    },

    markContactRead(id) {
        return api.put(`/contact-messages/${id}/read`).then(res => res.data);
    },

    deleteContactMessage(id) {
        return api.delete(`/contact-messages/${id}`).then(res => res.data);
    }

};