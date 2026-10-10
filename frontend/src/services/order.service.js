import api from "./api";

export const createOrder = async (data) => {
    const response = await api.post(
        "/api/orders",
        data
    );

    return response.data;
}

export const getOrders = async (params = {}) => {
    const response = await api.get(
        "/api/orders",
        {
            params,
        }
    );

    return response.data;
}

export const getAdminOrders = async () => {
    const response = await api.get("/api/admin/orders", { params: { limit: 100 } });
    return response.data;
};

export const updateAdminOrderStatus = async (id, status) => {
    const response = await api.patch(`/api/admin/orders/${id}/status`, { status });
    return response.data;
};

export const markAdminOrderPaid = async (id) => {
    const response = await api.post(`/api/admin/orders/${id}/mark-paid`);
    return response.data;
};