/**
 * Parses the raw incident alert description string:
 * "[Park Name] CRITICAL: TYPE in "Zone" - details"
 */
export function parseIncidentDescription(raw) {
    if (!raw) return { park: null, incidentType: null, zone: null, details: null };

    // [Park Name] CRITICAL: INCIDENT_TYPE in "Zone Name" - description
    const matchFull = raw.match(/^\[(.+?)\]\s+\w+:\s+(.+?)\s+in\s+"(.+?)"\s+-\s+([\s\S]*)$/);
    if (matchFull) {
        return {
            park: matchFull[1],
            incidentType: matchFull[2],
            zone: matchFull[3],
            details: matchFull[4].trim(),
        };
    }

    // Fallback: try to split by " - "
    const dashIdx = raw.indexOf(' - ');
    if (dashIdx !== -1) {
        return { park: null, incidentType: null, zone: null, details: raw.slice(dashIdx + 3).trim() };
    }
    return { park: null, incidentType: null, zone: null, details: raw };
}

/**
 * Parses the raw movement alert description string:
 * "T0011 (Fishing cat) has entered a critical risk zone in PA Zone Name"
 */
export function parseMovementDescription(raw) {
    if (!raw) return { tagId: null, species: null, riskLevel: null, location: null };

    const matchFull = raw.match(/^(\S+)\s+\((.+?)\)\s+has entered a\s+(\w+)\s+risk zone in\s+([\s\S]+)$/i);
    if (matchFull) {
        return {
            tagId: matchFull[1],
            species: matchFull[2],
            riskLevel: matchFull[3].toUpperCase(),
            location: matchFull[4].trim(),
        };
    }
    return { tagId: null, species: null, riskLevel: null, location: raw };
}

export function formatIncidentType(raw) {
    if (!raw) return '';
    return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
