import api from "./api";

export const getProducts = async (params = {}) => {
    const response = await api.get("/api/products", {
        params,
    });

    return response.data;
};

export const createProduct = async (formData) => {
    const response = await api.post("/api/products", formData);
    if (response.data?.error) {
        throw new Error(response.data.message || "Gagal menyimpan produk.");
    }
    return response.data;
};

export const updateProduct = async (id, formData) => {
    const response = await api.put(`/api/products/${id}`, formData);
    if (response.data?.error) {
        throw new Error(response.data.message || "Gagal memperbarui produk.");
    }
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(
        `/api/products/${id}`
    );
    return response.data;
};