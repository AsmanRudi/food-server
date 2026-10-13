import api from "./api";

export const getProducts = async (params = {}) => {
    const response = await api.get("/api/products", {
        params,
    });

    return response.data;
};

export const createProduct = async (formData) => {
    const response = await api.post("/api/products", formData);
    return response.data;
};

export const updateProduct = async (id, formData) => {
    const response = await api.put(`/api/products/${id}`, formData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(
        `/api/products/${id}`
    );
    return response.data;
};