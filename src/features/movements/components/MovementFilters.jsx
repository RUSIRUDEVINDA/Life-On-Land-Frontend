import React from 'react';
import { Search } from 'lucide-react';

const MovementFilters = ({ search, onSearchChange, pageSize, onPageSizeChange }) => {
    return (
        <div className="p-4 border-b border-border-light flex flex-wrap items-center justify-between gap-3 bg-white/50 backdrop-blur-sm">
            <div className="relative w-full max-w-xs min-w-[200px] group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray group-focus-within:text-primary transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Filter by Tag ID..."
                    className="w-full pl-10 pr-4 py-2 bg-bg-soft border border-border-light rounded-[14px] text-[13px] font-medium transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/10 outline-none"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            {typeof pageSize === 'number' && onPageSizeChange ? (
                <div className="flex items-center gap-2 text-[12px] text-text-gray">
                    <span className="font-medium">Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="rounded-xl border border-border-light bg-white px-3 py-1.5 text-[12px] font-semibold text-primary-dark outline-none transition focus:border-primary-medium"
                    >
                        {[10, 20, 30].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <span className="font-medium">per page</span>
                </div>
            ) : null}
        </div>
    );
};

export default MovementFilters;
