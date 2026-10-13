export const getImageUrl = (image) => {
    if (!image) {
        return "/placeholder-food.svg";
    }

    if (/^(?:data|blob):/i.test(image)) {
        return image;
    }

    if (/^(?:https?:)?\/\//i.test(image)) {
        const absoluteUrl = new URL(image, window.location.origin);
        if (!["localhost", "127.0.0.1", "::1"].includes(absoluteUrl.hostname)) {
            return image;
        }
        image = absoluteUrl.pathname;
    }

    const baseUrl = (
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_IMAGE_URL ||
        ""
    ).replace(/\/$/, "");
    const normalizedImage = image.replace(/\\/g, "/").replace(/^\/+/, "");
    const imagePath = normalizedImage.startsWith("public/images/")
        ? `/${normalizedImage.slice("public/".length)}`
        : normalizedImage.startsWith("images/")
            ? `/${normalizedImage}`
            : `/images/${normalizedImage}`;

    return `${baseUrl}${imagePath}`;
};