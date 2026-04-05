import React from 'react';
import { MapPin, ShieldAlert, Activity } from 'lucide-react';
import { parseIncidentDescription, parseMovementDescription, formatIncidentType } from '../utils/patrolUtils';

/**
 * A beautiful, detailed component to display patrol titles.
 * Parsses the raw title string and displays it with richness and context.
 */
const PatrolTitle = ({ title, compact = false }) => {
    if (!title) return <span className="text-[13px] font-bold text-primary-dark tracking-tight">Untitled Patrol</span>;

    const isIncident = title.startsWith('[');
    const isMovement = title.includes(' (');

    if (isIncident) {
        const { park, incidentType, zone, details } = parseIncidentDescription(title);
        const displayPark = park || null;
        const displayZone = zone || null;
        const displayType = incidentType || null;
        const displayDetails = details || title;

        if (compact) {
            return (
                <div className="flex flex-col gap-0.5">
                    {displayType && (
                        <span className="text-[13px] font-bold text-primary-dark tracking-tight leading-tight group-hover:text-primary-medium transition-colors">
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
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-1.5">
                {displayType && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100/50">
                            <ShieldAlert size={14} />
                        </div>
                        <span className="text-[15px] font-bold text-primary-dark tracking-tight leading-tight">
                            {formatIncidentType(displayType)}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2 flex-wrap ml-8">
                    {displayPark && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary-medium bg-primary-light/10 px-2.5 py-1 rounded-full border border-primary-light/20">
                            <MapPin size={9} className="shrink-0" />
                            {displayPark}
                        </span>
                    )}
                    {displayZone && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-text-gray bg-bg-soft px-2.5 py-1 rounded-full border border-border-light shadow-sm">
                            {displayZone}
                        </span>
                    )}
                </div>
                {displayDetails && displayDetails !== title && (
                    <p className="text-[12px] text-text-gray italic ml-8 max-w-[400px] line-clamp-1 border-l-2 border-primary-light/20 pl-2">
                        "{displayDetails}"
                    </p>
                )}
            </div>
        );
    }

    if (isMovement) {
        const { tagId, species, riskLevel, location } = parseMovementDescription(title);
        const displayTagId = tagId || null;
        const displaySpecies = species || null;
        const displayLocation = location || null;

        if (compact) {
            return (
                <div className="flex flex-col gap-0.5">
                    {displayTagId && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-primary-dark tracking-tight font-mono group-hover:text-primary-medium transition-colors">
                                {displayTagId}
                            </span>
                            {displaySpecies && (
                                <span className="text-[11px] font-semibold text-text-gray italic">({displaySpecies})</span>
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
            <div className="flex flex-col gap-1.5">
                {(displayTagId || displaySpecies) && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100/50">
                            <Activity size={14} />
                        </div>
                        <div className="flex items-center gap-2">
                            {displayTagId && (
                                <span className="text-[15px] font-bold text-primary-dark tracking-tight leading-tight font-mono">
                                    {displayTagId}
                                </span>
                            )}
                            {displaySpecies && (
                                <span className="text-[13px] font-bold text-text-gray/80 italic">
                                    {displaySpecies}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2 flex-wrap ml-8">
                    {displayLocation && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary-medium bg-primary-light/10 px-2.5 py-1 rounded-full border border-primary-light/20">
                            <MapPin size={9} className="shrink-0" />
                            {displayLocation}
                        </span>
                    )}
                    {riskLevel && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                riskLevel === 'HIGH' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {riskLevel} RISK
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <span className="text-[13px] font-bold text-primary-dark tracking-tight leading-snug max-w-[300px] xl:max-w-[400px] truncate group-hover:text-primary-medium transition-colors">
            {title}
        </span>
    );
};

export default PatrolTitle;
