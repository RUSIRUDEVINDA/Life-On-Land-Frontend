import React from 'react';
import { AlertTriangle, MapPinned, ShieldCheck, UserRound } from 'lucide-react';

const severityClasses = {
    CRITICAL: 'bg-[#E63946]/10 text-[#E63946]',
    HIGH: 'bg-[#fab005]/15 text-[#9c6f00]',
    MEDIUM: 'bg-primary-light/25 text-primary-dark',
    LOW: 'bg-[#d3f9d8] text-[#2b8a3e]',
};

const statusClasses = {
    REPORTED: 'bg-[#fff3bf] text-[#8f5c00]',
    VERIFIED: 'bg-[#d3f9d8] text-[#2b8a3e]',
    INVESTIGATING: 'bg-primary-dark text-white',
    UNVERIFIED: 'bg-white text-primary-dark border border-border-light',
    RESOLVED: 'bg-[#d3f9d8] text-[#2b8a3e]',
};

const formatDate = (value) =>
    new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const IncidentList = ({ incidents, selectedIncidentId, onSelect }) => {
    if (!incidents.length) {
        return (
            <div className="rounded-[28px] border border-dashed border-primary-light bg-white p-10 text-center shadow-premium">
                <p className="text-[18px] font-semibold text-primary-dark">No incidents match the current filters.</p>
                <p className="mt-2 text-[13px] text-text-gray">Try widening the status, severity, or search criteria.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {incidents.map((incident) => {
                const isSelected = incident._id === selectedIncidentId;

                return (
                    <button
                        type="button"
                        key={incident._id}
                        onClick={() => onSelect(incident)}
                        className={`rounded-[28px] border p-5 text-left shadow-premium transition-all ${
                            isSelected
                                ? 'border-primary-dark bg-primary-dark text-white'
                                : 'border-border-light bg-white text-primary-dark hover:border-primary-light'
                        }`}
                    >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                        isSelected ? 'bg-white/10 text-white' : 'bg-primary-light/20 text-primary-dark'
                                    }`}
                                >
                                    <AlertTriangle size={22} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                isSelected
                                                    ? 'bg-white/10 text-white'
                                                    : severityClasses[incident.severity]
                                            }`}
                                        >
                                            {incident.severity}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                isSelected
                                                    ? 'bg-white/10 text-white'
                                                    : statusClasses[incident.status]
                                            }`}
                                        >
                                            {incident.status.replaceAll('_', ' ')}
                                        </span>
                                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-white/75' : 'text-text-gray'}`}>
                                            {incident.type.replaceAll('_', ' ')}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-[18px] font-semibold tracking-tight">
                                            {incident.protectedArea.name}
                                        </h3>
                                        <p className={`mt-1 max-w-3xl text-[13px] leading-6 ${isSelected ? 'text-white/80' : 'text-text-gray'}`}>
                                            {incident.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`grid gap-2 text-[12px] ${isSelected ? 'text-white/80' : 'text-text-gray'}`}>
                                <div className="flex items-center gap-2">
                                    <MapPinned size={14} />
                                    <span>{incident.zone.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} />
                                    <span>{formatDate(incident.incidentDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserRound size={14} />
                                    <span>{incident.reportedBy.fullName}</span>
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default IncidentList;
