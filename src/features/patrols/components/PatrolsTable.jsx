import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ListPaginationFooter from '../../../components/common/ListPaginationFooter';
import PatrolTitle from './PatrolTitle';

const PatrolsTable = ({ patrols }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredPatrols = useMemo(() => {
        return patrols.filter(patrol => {
            const matchesSearch = (patrol.title || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || patrol.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [patrols, searchTerm, statusFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredPatrols.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedPatrols = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredPatrols.slice(start, start + pageSize);
    }, [filteredPatrols, safePage, pageSize]);

    return (
        <div className="bg-white rounded-[24px] border border-border-light shadow-premium overflow-hidden">
            <div className="p-4 border-b border-border-light flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-bg-soft/20">
                <div className="relative w-full xl:max-w-[320px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-text-gray" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search patrols by title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-light bg-white text-[13px] text-primary-dark placeholder-text-gray focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 transition-all font-medium min-w-[280px]"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter size={14} className="text-text-gray" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto appearance-none pl-9 pr-8 py-2.5 rounded-2xl border border-border-light bg-white text-[13px] font-semibold text-primary-dark focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 cursor-pointer transition-all min-w-[160px]"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-text-gray">
                        <span className="font-medium">Show</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
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
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                {patrols.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center border-t border-border-light bg-white">
                        <div className="w-16 h-16 bg-primary-light/20 rounded-2xl flex items-center justify-center text-primary-medium mb-4">
                            <ClipboardList size={32} />
                        </div>
                        <h3 className="text-[16px] font-bold text-primary-dark mb-1">No Patrols Found</h3>
                        <p className="text-[13px] text-text-gray mt-1">Ready to plan your next deployment.</p>
                    </div>
                ) : filteredPatrols.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center bg-white">
                        <div className="w-16 h-16 bg-bg-soft rounded-2xl flex items-center justify-center text-text-gray mb-4">
                            <Search size={28} />
                        </div>
                        <h3 className="text-[16px] font-bold text-primary-dark mb-1">No matching patrols</h3>
                        <p className="text-[13px] text-text-gray mt-1">Try adjusting your search criteria or status filter.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-soft/30 border-b border-border-light">
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Title</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Rangers Assigned</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Start Time</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">End Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedPatrols.map((patrol, index) => (
                                <tr
                                    key={patrol._id || patrol.id}
                                    onClick={() => navigate(`/dashboard/patrols/${patrol._id || patrol.id}`)}
                                    className="group hover:bg-bg-soft/40 transition-all duration-300 cursor-pointer"
                                    style={{ animationDelay: `${index * 40}ms` }}
                                    title="Click to view patrol details and add check-ins"
                                >
                                    <td className="px-6 py-4 xl:py-5">
                                        <div className="flex flex-col">
                                            <PatrolTitle title={patrol.title} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-black/5 ${patrol.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                            patrol.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                patrol.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {patrol.status === 'IN_PROGRESS' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-70 animate-pulse"></span>}
                                            {patrol.status || 'PLANNED'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-[13px] font-bold text-primary-dark tracking-tight">{patrol.assignedRangerIds?.length || 0}</span>
                                        <span className="text-[11px] font-medium text-text-gray ml-1">Rangers</span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-[12px] font-bold text-primary-medium tracking-tight">
                                            {new Date(patrol.plannedStart).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-[12px] font-bold text-text-gray tracking-tight opacity-90">
                                            {new Date(patrol.plannedEnd).toLocaleDateString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {filteredPatrols.length > 0 && (
                <div className="border-t border-border-light px-5 py-3">
                    <ListPaginationFooter
                        totalItems={filteredPatrols.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        countSuffix="patrols"
                    />
                </div>
            )}
        </div>
    );
};

export default PatrolsTable;
