import api from "./api";

export const getPaymentOptions = async () => {
    const response = await api.get("/api/payment-options");
    return response.data;
};

export const getPendingTransfers = async (params = {}) => {
    const response = await api.get("/api/admin/invoices/pending-transfers", { params });
    return response.data;
};

export const confirmTransfer = async (orderId) => {
    const response = await api.post(`/api/admin/invoices/${orderId}/confirm-transfer`);
    return response.data;
};