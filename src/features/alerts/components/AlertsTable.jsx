import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AlertsTable = ({ alerts }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('ALL');

    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            const searchString = `${alert.type || ''} ${alert.description || ''}`.toLowerCase();
            const matchesSearch = searchString.includes(searchTerm.toLowerCase());
            const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
            return matchesSearch && matchesSeverity;
        });
    }, [alerts, searchTerm, severityFilter]);

    return (
        <div className="bg-white rounded-[24px] border border-border-light shadow-premium overflow-hidden">
            <div className="p-4 border-b border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-soft/20">
                <div className="relative w-full xl:max-w-[320px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-text-gray" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search alerts by type or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-light bg-white text-[13px] text-primary-dark placeholder-text-gray focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 transition-all font-medium min-w-[280px]"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter size={14} className="text-text-gray" />
                        </div>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
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
                            {filteredAlerts.map((alert, index) => (
                                <tr
                                    key={alert._id || alert.id}
                                    className="group hover:bg-bg-soft/40 transition-all duration-300"
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-bg-soft text-primary flex items-center justify-center font-bold text-[11px] shadow-sm">
                                                <AlertCircle size={14} className="text-primary-medium" />
                                            </div>
                                            <span className="text-[13px] font-bold text-primary-dark tracking-tight">{alert.type}</span>
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
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-medium text-text-gray tracking-tight max-w-[280px] xl:max-w-[380px] truncate group-hover:text-primary-dark transition-colors">
                                                {alert.description}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-[12px] font-bold text-text-gray tracking-tight opacity-90">
                                            {new Date(alert.createdAt || alert.updatedAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <button
                                            onClick={() => navigate(`/dashboard/patrols/create?alertId=${alert._id || alert.id}`, { state: { alert } })}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-dark text-white border border-primary-dark shadow-sm px-4 py-2 text-[11px] font-bold transition-all hover:bg-primary hover:border-primary active:scale-95"
                                        >
                                            Deploy Patrol
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AlertsTable;
