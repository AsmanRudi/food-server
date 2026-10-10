import api from "./api";

export const getInvoice = async (orderId) => {
    const response = await api.get(
        `/api/invoices/${orderId}`
    );

    return response.data;
};