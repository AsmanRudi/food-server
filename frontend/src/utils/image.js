export const getImageUrl = (image) => {
    if (!image) {
        return "/placeholder-food.svg";
    }

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    const baseUrl = import.meta.env.VITE_IMAGE_URL || "";
    const imagePath = image.startsWith("/") ? image : `/images/${image}`;

    return `${baseUrl}${imagePath}`;
};