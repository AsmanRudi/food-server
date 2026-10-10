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

const updateTag = async (id, data) => {
    
}