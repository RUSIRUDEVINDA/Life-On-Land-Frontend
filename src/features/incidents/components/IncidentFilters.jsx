import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const FilterGroup = ({ label, options, value, onChange }) => {
    return (
        <label className="flex min-w-[170px] flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-gray">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[13px] font-medium text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option.replaceAll('_', ' ')}
                    </option>
                ))}
            </select>
        </label>
    );
};

const IncidentFilters = ({
    searchTerm,
    onSearchChange,
    type,
    onTypeChange,
    status,
    onStatusChange,
    severity,
    onSeverityChange,
    typeOptions,
    statusOptions,
    severityOptions,
    pageSize,
    onPageSizeChange,
    currentPage,
    totalPages,
    totalCount,
    onPageChange,
}) => {
    const showPagination = totalCount > 0;
    const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="rounded-[28px] border border-border-light bg-white p-5 shadow-premium">
            {/* Filters row */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <label className="flex-1">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-text-gray">
                        Search Incidents
                    </span>
                    <div className="flex items-center rounded-2xl border border-border-light bg-bg-soft px-4 py-3 transition focus-within:border-primary-medium focus-within:bg-white">
                        <Search size={15} className="mr-2 text-text-gray" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Search by type, area, reporter or description"
                            className="w-full border-none bg-transparent text-[13px] text-primary-dark outline-none"
                        />
                    </div>
                </label>

                <div className="flex flex-col gap-4 md:flex-row">
                    <FilterGroup label="Type" options={typeOptions} value={type} onChange={onTypeChange} />
                    <FilterGroup label="Status" options={statusOptions} value={status} onChange={onStatusChange} />
                    <FilterGroup label="Severity" options={severityOptions} value={severity} onChange={onSeverityChange} />
                </div>
            </div>

            {/* Pagination row */}
            {showPagination && (
                <div className="mt-4 flex flex-col gap-3 border-t border-border-light pt-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Count + page-size selector */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] text-text-gray">
                            Showing{' '}
                            <span className="font-semibold text-primary-dark">{rangeStart}–{rangeEnd}</span>
                            {' '}of{' '}
                            <span className="font-semibold text-primary-dark">{totalCount}</span> incidents
                        </p>
                        <span className="hidden text-text-gray sm:inline">·</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] text-text-gray">Show</span>
                            <select
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                className="rounded-xl border border-border-light bg-bg-soft px-2.5 py-1.5 text-[12px] font-medium text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                            >
                                {[10, 20, 30].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <span className="text-[12px] text-text-gray">per page</span>
                        </div>
                    </div>

                    {/* Page buttons */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-bg-soft text-primary-dark transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => onPageChange(page)}
                                    className={`flex h-8 min-w-[32px] items-center justify-center rounded-xl border px-2 text-[12px] font-semibold transition ${
                                        page === currentPage
                                            ? 'border-primary-dark bg-primary-dark text-white'
                                            : 'border-border-light bg-white text-primary-dark hover:bg-bg-soft'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-bg-soft text-primary-dark transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default IncidentFilters;
