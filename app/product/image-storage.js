const fs = require('node:fs/promises');
const path = require('node:path');
const config = require('../config');

const isVercelBlobUrl = (value) => {
    try {
        return new URL(value).hostname.endsWith('.public.blob.vercel-storage.com');
    } catch {
        return false;
    }
};

const removeTemporaryUpload = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
};

const uploadProductImage = async (file) => {
    const extension = path.extname(path.basename(file.originalname)).toLowerCase();

    try {
        if (process.env.VERCEL) {
            const { put } = await import('@vercel/blob');
            const content = await fs.readFile(file.path);
            const blob = await put(`products/${file.filename}${extension}`, content, {
                access: 'public',
                addRandomSuffix: true,
                contentType: file.mimetype
            });

            return blob.url;
        }

        const filename = `${file.filename}${extension}`;
        const imagesDirectory = path.join(config.rootPath, 'public', 'images');
        await fs.mkdir(imagesDirectory, { recursive: true });
        await fs.copyFile(file.path, path.join(imagesDirectory, filename));

        return filename;
    } finally {
        try {
            await removeTemporaryUpload(file.path);
        } catch (err) {
            console.error('Failed to remove temporary product image:', err.message);
        }
    }
};

const deleteProductImage = async (imageUrl) => {
    if (!imageUrl) return;

    if (isVercelBlobUrl(imageUrl)) {
        const { del } = await import('@vercel/blob');
        await del(imageUrl);
        return;
    }

    if (/^https?:\/\//i.test(imageUrl)) return;

    const imagesDirectory = path.resolve(config.rootPath, 'public', 'images');
    const normalizedImage = imageUrl.replace(/^\/+/, '');
    const candidatePaths = new Set([
        path.resolve(imagesDirectory, normalizedImage),
        path.resolve(imagesDirectory, 'products', path.basename(normalizedImage))
    ]);

    if (normalizedImage.startsWith('products/')) {
        candidatePaths.add(path.resolve(imagesDirectory, normalizedImage.slice('products/'.length)));
    }

    for (const filePath of candidatePaths) {
        if (!filePath.startsWith(`${imagesDirectory}${path.sep}`)) continue;

        try {
            await fs.unlink(filePath);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }
    }
};

module.exports = { deleteProductImage, removeTemporaryUpload, uploadProductImage };
