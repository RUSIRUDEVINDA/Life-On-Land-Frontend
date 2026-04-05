import React from 'react';
import { Search } from 'lucide-react';

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
}) => {
    return (
        <div className="rounded-[28px] border border-border-light bg-white p-5 shadow-premium">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <label className="flex-1">
                    <span className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.16em] text-text-gray">
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

                    <div className="mt-4 flex flex-wrap items-center justify-end border-t border-border-light pt-4">
                        <label className="inline-flex items-center gap-2">
                            <span className="text-[13px] font-medium text-text-gray">Show</span>
                            <select
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                className="rounded-2xl border border-border-light bg-white px-3 py-2 text-[10px] font-semibold text-primary-dark outline-none transition focus:border-primary-medium"
                            >
                                {[10, 20, 30].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                            <span className="text-[13px] font-medium text-text-gray">per page</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncidentFilters;
