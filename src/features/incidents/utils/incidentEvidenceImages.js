export const MAX_IMAGES = 2;
/** Pre-compression file picker limit (browser reads whole file before canvas). */
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/** First pass: long edge (px). Further passes shrink until under {@link MAX_EVIDENCE_DATA_URL_CHARS}. */
export const MAX_DIMENSION = 768;
export const MIN_DIMENSION = 360;
export const JPEG_QUALITY = 0.66;
export const MIN_JPEG_QUALITY = 0.38;

/**
 * Max length of each `data:image/jpeg;base64,...` string so the incident JSON body fits typical
 * server/proxy limits (Express/nginx often default to ~1mb). Two images + text fields must stay under that.
 */
export const MAX_EVIDENCE_DATA_URL_CHARS = 240_000;

const MAX_COMPRESSION_PASSES = 18;

const compressImageWithParams = (file, maxDimension, jpegQuality) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = () => reject(new Error(`Failed to decode ${file.name}`));
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width >= height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', jpegQuality));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

/**
 * Resizes and re-encodes as JPEG, then shrinks further if the data URL would make the incident POST too large.
 */
export const compressImage = async (file) => {
    let maxDim = MAX_DIMENSION;
    let quality = JPEG_QUALITY;
    let dataUrl = await compressImageWithParams(file, maxDim, quality);

    for (let pass = 0; pass < MAX_COMPRESSION_PASSES && dataUrl.length > MAX_EVIDENCE_DATA_URL_CHARS; pass += 1) {
        if (maxDim > MIN_DIMENSION) {
            maxDim = Math.max(MIN_DIMENSION, Math.round(maxDim * 0.82));
        } else if (quality > MIN_JPEG_QUALITY) {
            quality = Math.max(MIN_JPEG_QUALITY, quality - 0.06);
        } else {
            break;
        }
        dataUrl = await compressImageWithParams(file, maxDim, quality);
    }

    if (dataUrl.length > MAX_EVIDENCE_DATA_URL_CHARS) {
        throw new Error(
            'This image is still too large after compression. Try a smaller photo, fewer images, or ask an admin to raise the server upload limit.'
        );
    }

    return dataUrl;
};

/**
 * Maps API evidence strings (data URLs or hosted URLs) into { id, name, dataUrl } for the upload UI.
 */
export const evidenceStringsToImageItems = (evidence, incidentId = '') => {
    if (!Array.isArray(evidence)) return [];
    const prefix = incidentId ? String(incidentId).slice(-8) : 'ev';
    return evidence
        .filter((s) => typeof s === 'string' && s.trim())
        .map((url, idx) => ({
            id: `existing-${prefix}-${idx}`,
            name: url.startsWith('data:') ? 'Saved image' : url.split('/').pop()?.split('?')[0] || `Evidence ${idx + 1}`,
            dataUrl: url.trim(),
        }));
};
