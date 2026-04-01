export const normalizeSriLankanPhone = (value) => {
    if (value === undefined || value === null) return null;

    const cleaned = String(value)
        .trim()
        .replace(/[\s()-]/g, '');

    if (!cleaned) return null;

    let normalized = cleaned;
    if (normalized.startsWith('+94')) {
        normalized = '+94' + normalized.slice(3);
    } else if (normalized.startsWith('94')) {
        normalized = '+94' + normalized.slice(2);
    } else if (normalized.startsWith('0')) {
        normalized = '+94' + normalized.slice(1);
    } else {
        return null;
    }

    if (!/^\+94[1-9]\d{8}$/.test(normalized)) {
        return null;
    }

    return normalized;
};
