/** Aligns with edit flow (`RangerMyIncidentsPage`) and typical API body limits. */
export const MIN_INCIDENT_DESCRIPTION_LENGTH = 10;
export const MAX_INCIDENT_DESCRIPTION_LENGTH = 200;
export const MAX_INCIDENT_NOTES_LENGTH = 100;

export const hasInvalidControlChars = (value) => {
    const text = String(value ?? '');
    for (let i = 0; i < text.length; i += 1) {
        const code = text.charCodeAt(i);
        if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31)) {
            return true;
        }
    }
    return false;
};

/**
 * @param {object} data
 * @returns {Record<string, string>}
 */
export const validateReportIncidentForm = (data) => {
    const errors = {};

    if (!String(data.type || '').trim()) {
        errors.type = 'Please select an incident type.';
    }
    if (!String(data.severity || '').trim()) {
        errors.severity = 'Please select a severity level.';
    }
    if (!data.protectedAreaId) {
        errors.protectedAreaId = 'Select a protected area.';
    }
    if (!data.zoneId) {
        errors.zoneId = 'Select a zone for this incident.';
    }
    if (!String(data.incidentDate || '').trim()) {
        errors.incidentDate = 'Incident date and time is required.';
    }

    const rawDesc = data.description ?? '';
    if (hasInvalidControlChars(rawDesc)) {
        errors.description = 'Description contains invalid characters that cannot be saved.';
    } else if (rawDesc.length > MAX_INCIDENT_DESCRIPTION_LENGTH) {
        errors.description = `Description cannot exceed ${MAX_INCIDENT_DESCRIPTION_LENGTH.toLocaleString()} characters.`;
    } else {
        const trimmed = rawDesc.trim();
        if (!trimmed) {
            errors.description = '';
        } else if (trimmed.length < MIN_INCIDENT_DESCRIPTION_LENGTH) {
            errors.description = `Description must be at least ${MIN_INCIDENT_DESCRIPTION_LENGTH} characters.`;
        }
    }

    const rawNotes = data.notes ?? '';
    if (hasInvalidControlChars(rawNotes)) {
        errors.notes = 'Notes contain invalid characters that cannot be saved.';
    } else if (rawNotes.length > MAX_INCIDENT_NOTES_LENGTH) {
        errors.notes = `Notes cannot exceed ${MAX_INCIDENT_NOTES_LENGTH.toLocaleString()} characters.`;
    }

    return errors;
};
