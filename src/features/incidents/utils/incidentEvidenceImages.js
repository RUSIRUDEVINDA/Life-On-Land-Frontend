export const MAX_IMAGES = 2;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_DIMENSION = 1024;
export const JPEG_QUALITY = 0.78;

export const compressImage = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = () => reject(new Error(`Failed to decode ${file.name}`));
            img.onload = () => {
                let { width, height } = img;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width >= height) {
                        height = Math.round((height * MAX_DIMENSION) / width);
                        width = MAX_DIMENSION;
                    } else {
                        width = Math.round((width * MAX_DIMENSION) / height);
                        height = MAX_DIMENSION;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

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
