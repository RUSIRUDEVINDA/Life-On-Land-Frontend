import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const MovementFilters = ({ search, onSearchChange }) => {
    return (
        <div className="p-4 border-b border-border-light flex justify-between items-center bg-white/50 backdrop-blur-sm">
            <div className="relative w-72 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray group-focus-within:text-primary transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Filter by Tag ID..."
                    className="w-full pl-10 pr-4 py-2 bg-bg-soft border border-border-light rounded-[14px] text-[13px] font-medium transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/10 outline-none"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <button className="w-9 h-9 flex items-center justify-center border border-border-light rounded-lg text-text-gray bg-white hover:bg-bg-soft shadow-sm cursor-pointer transition-all active:scale-90"><ChevronLeft size={16} /></button>
                <button className="w-9 h-9 flex items-center justify-center border border-border-light rounded-lg text-text-gray bg-white hover:bg-bg-soft shadow-sm cursor-pointer transition-all active:scale-90"><ChevronRight size={16} /></button>
            </div>
        </div>
    );
};

export default MovementFilters;
