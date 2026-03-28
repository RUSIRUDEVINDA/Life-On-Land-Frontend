import React from 'react';
import { Search, Filter } from 'lucide-react';

const AnimalFilters = ({ search, onSearchChange, status, onStatusChange, species, onSpeciesChange }) => {
    return (
        <div className="p-4 border-b border-border-light flex flex-wrap gap-4 items-center justify-between bg-white/50 backdrop-blur-sm">
            <div className="relative w-full max-w-xs group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray group-focus-within:text-primary transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Search by Tag ID, Species..."
                    className="w-full pl-10 pr-4 py-2 bg-bg-soft border border-border-light rounded-[14px] text-[13px] font-medium transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/10 outline-none"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-soft border border-border-light rounded-[14px] transition-all duration-300 focus-within:bg-white focus-within:border-primary-medium">
                    <Filter size={14} className="text-text-gray" />
                    <select
                        className="bg-transparent border-none text-[12px] font-bold text-primary-dark outline-none cursor-pointer pr-1"
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value)}
                    >
                        <option value="">Filter Status</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="DECEASED">Deceased</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default AnimalFilters;
