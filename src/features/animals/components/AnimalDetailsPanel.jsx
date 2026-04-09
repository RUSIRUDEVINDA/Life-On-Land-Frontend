import React from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { getSpeciesIcon } from '../utils/speciesIcons';

const formatLabel = (value) => {
    if (!value) return 'Unknown';
    const normalized = String(value).toLowerCase().replace(/_/g, ' ');
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const AnimalDetailsPanel = ({ animal }) => {
    if (!animal) {
        return (
            <div className="bg-white rounded-3xl border border-border-light shadow-premium p-6 h-full">
                <div className="flex flex-col items-center justify-center text-center gap-3 h-full min-h-[320px]">
                    <div className="w-12 h-12 rounded-full bg-bg-soft flex items-center justify-center text-text-gray">
                        <Info size={22} />
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-primary-dark">Select an animal</p>
                        <p className="text-[11px] font-medium text-text-gray mt-1">
                            Click the animal icon to view full details.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const endemic = !!animal.endemicToSriLanka;

    return (
        <div className="bg-white rounded-3xl border border-border-light shadow-premium p-6 h-full">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white border border-border-light flex items-center justify-center shadow-sm overflow-hidden">
                    <img
                        src={animal.photo || getSpeciesIcon(animal.species)}
                        alt="Animal icon"
                        className={`w-16 h-16 ${animal.photo ? 'w-full h-full object-cover' : ''}`}
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-[18px] font-bold text-primary-dark leading-tight">{animal.species || 'Unknown Species'}</span>
                    <span className="text-[12px] font-mono font-bold text-primary-medium mt-1">{animal.tagId || 'Unknown Tag'}</span>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-bg-soft/40 border border-border-light rounded-2xl p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-gray">Biological Sex</p>
                    <p className="text-[13px] font-bold text-primary-dark mt-1">{formatLabel(animal.sex)}</p>
                </div>
                <div className="bg-bg-soft/40 border border-border-light rounded-2xl p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-gray">Age Class</p>
                    <p className="text-[13px] font-bold text-primary-dark mt-1">{formatLabel(animal.ageClass)}</p>
                </div>
                <div className="bg-bg-soft/40 border border-border-light rounded-2xl p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-gray">Monitoring Status</p>
                    <p className="text-[13px] font-bold text-primary-dark mt-1">{formatLabel(animal.status)}</p>
                </div>
                <div className="bg-bg-soft/40 border border-border-light rounded-2xl p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-gray">Endemic</p>
                    <div className="flex items-center gap-2 mt-1">
                        {endemic ? (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                        ) : (
                            <XCircle size={14} className="text-rose-400" />
                        )}
                        <span className="text-[13px] font-bold text-primary-dark">{endemic ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 bg-bg-soft/40 border border-border-light rounded-2xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-gray">Protected Area</p>
                <p className="text-[13px] font-bold text-primary-dark mt-1">
                    {animal.protectedAreaName || 'Unassigned Area'}
                </p>
            </div>

            <div className="mt-3 bg-bg-soft/40 border border-border-light rounded-2xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-gray">Monitoring Zone</p>
                <p className="text-[13px] font-bold text-primary-dark mt-1">{animal.zoneName || 'Global Zone'}</p>
            </div>

            <div className="mt-3 bg-bg-soft/40 border border-border-light rounded-2xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-gray">Notes</p>
                <p className="text-[12px] font-medium text-text-gray mt-1 leading-relaxed">
                    {animal.description || 'No observations recorded yet.'}
                </p>
            </div>
        </div>
    );
};

export default AnimalDetailsPanel;