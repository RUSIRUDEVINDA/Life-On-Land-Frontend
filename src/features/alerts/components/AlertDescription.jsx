import React from 'react';
import { ShieldAlert, Activity, MapPin } from 'lucide-react';

/**
 * Parses the raw incident alert description string:
 * "[Park Name] CRITICAL: TYPE in "Zone" - details"
 */
function parseIncidentDescription(raw) {
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
function parseMovementDescription(raw) {
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

function formatIncidentType(raw) {
    if (!raw) return '';
    return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * A rich, visual alert description component.
 * Accepts an `alert` object with: type, severity, description, zoneName, protectedAreaName.
 * Falls back gracefully to displaying raw description text.
 */
const AlertDescription = ({ alert, compact = false }) => {
    if (!alert) return null;

    const isIncident = alert.type === 'INCIDENT';
    const isMovement = alert.type === 'MOVEMENT';

    if (isIncident) {
        const { park, incidentType, zone, details } = parseIncidentDescription(alert.description);
        const displayPark = park || alert.protectedAreaName || null;
        const displayZone = zone || alert.zoneName || null;
        const displayType = incidentType || null;
        const displayDetails = details || alert.description;

        if (compact) {
            return (
                <div className="flex flex-col gap-0.5">
                    {displayType && (
                        <span className="text-[12px] font-bold text-primary-dark tracking-tight">
                            {formatIncidentType(displayType)}
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {displayPark && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-gray">
                                <MapPin size={10} className="shrink-0" />
                                {displayPark}
                            </span>
                        )}
                        {displayZone && (
                            <span className="text-[11px] text-text-gray">· {displayZone}</span>
                        )}
                    </div>
                    {displayDetails && (
                        <p className="text-[11px] text-text-gray mt-0.5 truncate max-w-[320px] xl:max-w-[420px]">
                            {displayDetails}
                        </p>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-1">
                {displayType && (
                    <span className="text-[13px] font-bold text-primary-dark tracking-tight">
                        {formatIncidentType(displayType)}
                    </span>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                    {displayPark && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-medium bg-primary-light/20 px-2 py-0.5 rounded-full">
                            <MapPin size={9} className="shrink-0" />
                            {displayPark}
                        </span>
                    )}
                    {displayZone && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-gray bg-bg-soft px-2 py-0.5 rounded-full border border-border-light">
                            {displayZone}
                        </span>
                    )}
                </div>
                {displayDetails && displayDetails !== alert.description && (
                    <p className="text-[12px] text-text-gray mt-0.5 leading-snug max-w-[340px] xl:max-w-[460px] line-clamp-2">
                        {displayDetails}
                    </p>
                )}
            </div>
        );
    }

    if (isMovement) {
        const { tagId, species, location } = parseMovementDescription(alert.description);
        const displayTagId = tagId || null;
        const displaySpecies = species || null;
        const displayLocation = location || alert.zoneName || alert.protectedAreaName;

        if (compact) {
            return (
                <div className="flex flex-col gap-0.5">
                    {displayTagId && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-bold text-primary-dark tracking-tight font-mono">
                                {displayTagId}
                            </span>
                            {displaySpecies && (
                                <span className="text-[11px] text-text-gray">({displaySpecies})</span>
                            )}
                        </div>
                    )}
                    {displayLocation && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-text-gray">
                            <MapPin size={10} className="shrink-0" />
                            {displayLocation}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-1">
                {(displayTagId || displaySpecies) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {displayTagId && (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-primary-dark bg-primary-light/20 px-2 py-0.5 rounded-full font-mono tracking-tight">
                                {displayTagId}
                            </span>
                        )}
                        {displaySpecies && (
                            <span className="text-[12px] font-semibold text-text-gray italic">
                                {displaySpecies}
                            </span>
                        )}
                    </div>
                )}
                {displayLocation && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-gray">
                        <MapPin size={9} className="shrink-0 text-primary-medium" />
                        {displayLocation}
                    </span>
                )}
            </div>
        );
    }

    // Generic fallback
    return (
        <span className="text-[13px] font-medium text-text-gray tracking-tight max-w-[280px] xl:max-w-[380px] truncate">
            {alert.description}
        </span>
    );
};

export default AlertDescription;
