"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.validateProductImageFile = validateProductImageFile;
exports.uploadProductImage = uploadProductImage;
exports.removeProductImage = removeProductImage;
exports.extractStoragePathFromPublicUrl = extractStoragePathFromPublicUrl;
const node_crypto_1 = require("node:crypto");
const supabase_js_1 = require("../config/supabase.js");
const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const maxFileSizeBytes = 10 * 1024 * 1024;
class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
function validateProductImageFile(file) {
    if (!file)
        throw new AppError('Select a PNG, JPG, JPEG, or WEBP image to upload.', 400);
    if (!allowedMimeTypes.has(file.mimetype)) {
        throw new AppError('Only PNG, JPG, JPEG, and WEBP images are allowed.', 400);
    }
    if (file.size > maxFileSizeBytes) {
        throw new AppError('Product image must be 10 MB or smaller.', 400);
    }
}
function sanitizedBaseName(originalname) {
    const trimmed = originalname.trim().toLowerCase();
    const ext = mimeExtension(trimmed) ?? 'jpg';
    const stem = trimmed
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `${stem || 'product-image'}.${ext}`;
}
function mimeExtension(originalname) {
    const match = originalname.match(/\.([a-z0-9]+)$/i);
    const ext = match?.[1]?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp')
        return ext === 'jpeg' ? 'jpg' : ext;
    return null;
}
async function uploadProductImage(productId, file) {
    validateProductImageFile(file);
    const timestamp = Date.now();
    const uniqueName = `${timestamp}-${(0, node_crypto_1.randomUUID)()}-${sanitizedBaseName(file.originalname)}`;
    const path = `products/${productId}/${uniqueName}`;
    const { error } = await supabase_js_1.supabase.storage.from(supabase_js_1.supabaseStorageBucket).upload(path, file.buffer, {
        cacheControl: '3600',
        contentType: file.mimetype,
        upsert: false,
    });
    if (error) {
        throw new AppError(`Supabase upload failed: ${error.message}`, 502);
    }
    return {
        path,
        publicUrl: (0, supabase_js_1.getSupabaseStoragePublicUrl)(path),
    };
}
async function removeProductImage(path) {
    if (!path)
        return;
    const { error } = await supabase_js_1.supabase.storage.from(supabase_js_1.supabaseStorageBucket).remove([path]);
    if (error) {
        console.error('Failed to remove orphaned product image from Supabase Storage', { path, error });
    }
}
function extractStoragePathFromPublicUrl(url) {
    if (!url)
        return null;
    const marker = `/storage/v1/object/public/${supabase_js_1.supabaseStorageBucket}/`;
    const index = url.indexOf(marker);
    if (index === -1)
        return null;
    return decodeURIComponent(url.slice(index + marker.length));
}
