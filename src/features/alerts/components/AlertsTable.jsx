import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, ShieldAlert, Activity, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ListPaginationFooter from '../../../components/common/ListPaginationFooter';
import AlertDescription from './AlertDescription';
import { getUserRole } from '../../../utils/auth';

const AlertsTable = ({
    alerts,
    filteredAlerts,
    searchTerm,
    onSearchTermChange,
    severityFilter,
    onSeverityFilterChange,
    onUpdateStatus,
}) => {
    const role = getUserRole();
    const isAdmin = role === 'ADMIN';
    const navigate = useNavigate();
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, severityFilter, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedAlerts = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredAlerts.slice(start, start + pageSize);
    }, [filteredAlerts, safePage, pageSize]);

    return (
        <div className="bg-white rounded-[24px] border border-border-light shadow-premium overflow-hidden">
            <div className="p-4 border-b border-border-light flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-bg-soft/20">
                <div className="relative w-full xl:max-w-[320px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-text-gray" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search alerts by type or description..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-light bg-white text-[13px] text-primary-dark placeholder-text-gray focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 transition-all font-medium min-w-[280px]"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter size={14} className="text-text-gray" />
                        </div>
                        <select
                            value={severityFilter}
                            onChange={(e) => onSeverityFilterChange(e.target.value)}
                            className="w-full sm:w-auto appearance-none pl-9 pr-8 py-2.5 rounded-2xl border border-border-light bg-white text-[13px] font-semibold text-primary-dark focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 cursor-pointer transition-all min-w-[160px]"
                        >
                            <option value="ALL">All Severities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
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
                {alerts.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center bg-white">
                        <div className="w-16 h-16 bg-primary-light/20 rounded-2xl flex items-center justify-center text-primary-medium mb-4">
                            <span className="text-2xl">🌱</span>
                        </div>
                        <h3 className="text-[16px] font-bold text-primary-dark mb-1">All clear</h3>
                        <p className="text-[13px] text-text-gray">No active alerts currently detected in the system.</p>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center bg-white">
                        <div className="w-16 h-16 bg-bg-soft rounded-2xl flex items-center justify-center text-text-gray mb-4">
                            <Search size={28} />
                        </div>
                        <h3 className="text-[16px] font-bold text-primary-dark mb-1">No matching alerts</h3>
                        <p className="text-[13px] text-text-gray mt-1">Try adjusting your search criteria or severity filter.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-soft/30 border-b border-border-light">
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Event Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Severity</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Description</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em]">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedAlerts.map((alert, index) => (
                                <tr
                                    key={alert._id || alert.id}
                                    className="group hover:bg-bg-soft/40 transition-all duration-300"
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${alert.type === 'INCIDENT'
                                                ? 'bg-rose-50'
                                                : 'bg-primary-light/20'
                                                }`}>
                                                {alert.type === 'INCIDENT'
                                                    ? <ShieldAlert size={14} className="text-rose-500" />
                                                    : <Activity size={14} className="text-primary-medium" />
                                                }
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-bold text-primary-dark tracking-tight">
                                                    {alert.type === 'INCIDENT' ? 'Incident' : 'Movement'}
                                                </span>
                                                {alert.zoneName && (
                                                    <span className="text-[10px] text-text-gray font-medium truncate max-w-[100px]">{alert.zoneName}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-black/5 ${alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                            alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                alert.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {alert.severity === 'CRITICAL' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 opacity-70 animate-pulse"></span>}
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`text-[11px] font-bold uppercase tracking-[0.05em] ${(alert.status || 'NEW') === 'NEW' ? 'text-primary-medium' : 'text-emerald-600'
                                            }`}>
                                            {alert.status || 'NEW'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <AlertDescription alert={alert} compact={true} />
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-[12px] font-bold text-text-gray tracking-tight opacity-90">
                                            {new Date(alert.createdAt || alert.updatedAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right flex items-center justify-end gap-2 h-full">
                                        <button
                                            onClick={() => navigate(`/dashboard/patrols/create?alertId=${alert._id || alert.id}`, { state: { alert } })}
                                            disabled={alert.status === 'RESOLVED' || alert.status === 'CLOSED'}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-dark text-white border border-primary-dark shadow-sm px-4 py-2 text-[11px] font-bold transition-all hover:bg-primary hover:border-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap"
                                        >
                                            Deploy Patrol
                                        </button>
                                        {isAdmin && (alert.status !== 'RESOLVED' && alert.status !== 'CLOSED') && (
                                            <button
                                                onClick={() => onUpdateStatus(alert._id || alert.id, 'RESOLVED')}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-white text-emerald-600 border border-emerald-200 shadow-sm px-4 py-2 text-[11px] font-bold transition-all hover:bg-emerald-50 active:scale-95"
                                            >
                                                <CheckCircle size={14} />
                                                Resolve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {filteredAlerts.length > 0 && (
                <div className="border-t border-border-light px-5 py-3">
                    <ListPaginationFooter
                        totalItems={filteredAlerts.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        countSuffix="alerts"
                    />
                </div>
            )}
        </div>
    );
};

export default AlertsTable;
