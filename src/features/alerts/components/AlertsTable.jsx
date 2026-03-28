import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AlertsTable = ({ alerts }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-[24px] border border-border-light shadow-premium overflow-hidden">
            <div className="p-6 border-b border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-[18px] font-bold text-primary-dark">Active System Alerts</h2>
                    <p className="text-[13px] text-text-gray mt-1">
                        System-generated priority events demanding immediate attention.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 rounded-2xl border border-primary-medium px-4 py-3 text-[13px] font-semibold text-primary-dark transition hover:bg-primary-light/10">
                        <ArrowUpRight size={15} />
                        Export
                    </button>
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                {alerts.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-bg-soft rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">🌱</span>
                        </div>
                        <h3 className="text-[16px] font-bold text-primary-dark mb-1">All clear</h3>
                        <p className="text-[13px] text-text-gray">No active alerts currently detected in the system.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-light bg-bg-soft/30 text-[12px] uppercase tracking-wider text-text-gray">
                                <th className="px-6 py-4 font-semibold">Event Type</th>
                                <th className="px-6 py-4 font-semibold">Severity</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert) => (
                                <tr key={alert._id || alert.id} className="border-b border-border-light hover:bg-bg-soft/50 transition-colors">
                                    <td className="px-6 py-4 text-[14px] font-medium text-primary-dark">
                                        {alert.type}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${alert.severity === 'CRITICAL' ? 'bg-[#fff5f5] text-[#E63946]' :
                                                alert.severity === 'HIGH' ? 'bg-[#fff3e0] text-[#E65100]' :
                                                    alert.severity === 'MEDIUM' ? 'bg-[#fffde7] text-[#F57F17]' :
                                                        'bg-[#e3f2fd] text-[#1565C0]'
                                            }`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[13px] font-medium text-primary uppercase tracking-wide">
                                            {alert.status || 'NEW'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[14px] text-text-gray max-w-[300px] truncate">
                                        {alert.description}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-text-gray">
                                        {new Date(alert.createdAt || alert.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/dashboard/patrols/create?alertId=${alert._id || alert.id}`, { state: { alert } })}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-light/10 px-3 py-1.5 text-[12px] font-semibold text-primary transition hover:bg-primary hover:text-white"
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
