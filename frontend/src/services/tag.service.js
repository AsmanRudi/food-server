import api from "./api";

export const getTags = async () => {
    const response = await api.get("/api/tags");

    return response.data;
};

export const createTag = async (data) => {
    const response = await api.post(
        "/api/tags",
        data
    );
    return response.data;
};

export const updateTag = async (id, data) => {
    const response = await api.put(`/api/tags/${id}`, data);
    if (response.data?.error) {
        throw new Error(response.data.message || "Gagal memperbarui tag.");
    }
    return response.data;
};