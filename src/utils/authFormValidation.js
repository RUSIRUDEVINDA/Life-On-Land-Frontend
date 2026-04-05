/** ASCII control characters except tab/newline (not used in auth fields). */
export const INVALID_CTRL_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;

const EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Name: letters (Unicode), spaces, common punctuation — no digits-only garbage. */
const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;

/** Phone: optional leading +, digits with spaces/hyphens between. */
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,22}$/;

const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 128;
const MIN_NAME_LEN = 2;
const MAX_NAME_LEN = 120;

/**
 * Map common API validation payloads to { [fieldName]: message }.
 * Supports express-validator-style arrays and plain objects.
 */
export function mapBackendFieldErrors(payload) {
    if (!payload || typeof payload !== 'object') return {};

    const out = {};

    const nestedError = payload.error;
    if (nestedError && typeof nestedError === 'object' && !Array.isArray(nestedError)) {
        for (const [k, v] of Object.entries(nestedError)) {
            if (v == null) continue;
            out[k] = Array.isArray(v) ? String(v[0]) : String(v);
        }
    }

    const raw = payload.errors ?? payload.validationErrors ?? payload.details;
    if (Array.isArray(raw)) {
        for (const item of raw) {
            if (!item || typeof item !== 'object') continue;
            let path = item.path ?? item.param ?? item.field ?? item.location;
            if (Array.isArray(path)) {
                path = path.filter(Boolean).join('.');
            }
            const msg = item.msg ?? item.message ?? item.error;
            if (msg == null || msg === '') continue;
            const key = String(path || '')
                .replace(/^body\./, '')
                .replace(/^\//, '')
                .trim();
            if (key) {
                out[key] = String(msg);
            }
        }
        return out;
    }

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        for (const [k, v] of Object.entries(raw)) {
            if (v == null) continue;
            out[k] = Array.isArray(v) ? String(v[0]) : String(v);
        }
    }

    return out;
}

/**
 * @returns {Record<string, string>}
 */
export function validateLoginFields({ email, password }) {
    const errors = {};
    const em = String(email ?? '').trim();

    if (!em) {
        errors.email = 'Email is required.';
    } else if (INVALID_CTRL_REGEX.test(email)) {
        errors.email = 'Email contains invalid characters that cannot be used.';
    } else if (!EMAIL_REGEX.test(em)) {
        errors.email = 'Enter a valid email address.';
    }

    const pw = String(password ?? '');
    if (!pw) {
        errors.password = 'Password is required.';
    } else if (INVALID_CTRL_REGEX.test(pw)) {
        errors.password = 'Password contains invalid characters that cannot be used.';
    } else if (pw.length > MAX_PASSWORD_LEN) {
        errors.password = 'Password is too long.';
    }

    return errors;
}

/**
 * @returns {Record<string, string>}
 */
export function validateRegisterFields({ name, phone, email, password, confirmPassword }) {
    const errors = {};
    const n = String(name ?? '').trim();
    const ph = String(phone ?? '').trim();
    const em = String(email ?? '').trim();
    const pw = String(password ?? '');
    const pw2 = String(confirmPassword ?? '');

    if (!n) {
        errors.name = 'Full name is required.';
    } else if (INVALID_CTRL_REGEX.test(name)) {
        errors.name = 'Name contains invalid characters that cannot be used.';
    } else if (n.length < MIN_NAME_LEN) {
        errors.name = `Name must be at least ${MIN_NAME_LEN} characters.`;
    } else if (n.length > MAX_NAME_LEN) {
        errors.name = 'Name is too long.';
    } else if (!NAME_REGEX.test(n)) {
        errors.name = 'Name can only include letters, spaces, hyphens, apostrophes, and periods.';
    }

    if (!ph) {
        errors.phone = 'Phone number is required.';
    } else if (INVALID_CTRL_REGEX.test(phone)) {
        errors.phone = 'Phone contains invalid characters that cannot be used.';
    } else if (!PHONE_REGEX.test(ph.replace(/\s+/g, ' '))) {
        errors.phone = 'Enter a valid phone number (digits, optional + prefix).';
    }

    if (!em) {
        errors.email = 'Email is required.';
    } else if (INVALID_CTRL_REGEX.test(email)) {
        errors.email = 'Email contains invalid characters that cannot be used.';
    } else if (!EMAIL_REGEX.test(em)) {
        errors.email = 'Enter a valid email address.';
    }

    if (!pw) {
        errors.password = 'Password is required.';
    } else if (INVALID_CTRL_REGEX.test(pw)) {
        errors.password = 'Password contains invalid characters that cannot be used.';
    } else if (pw.length < MIN_PASSWORD_LEN) {
        errors.password = `Password must be at least ${MIN_PASSWORD_LEN} characters.`;
    } else if (pw.length > MAX_PASSWORD_LEN) {
        errors.password = 'Password is too long.';
    }

    if (!pw2) {
        errors.confirmPassword = 'Please confirm your password.';
    } else if (pw !== pw2) {
        errors.confirmPassword = 'Passwords do not match.';
        if (!errors.password) {
            errors.password = 'Passwords do not match.';
        }
    }

    return errors;
}
