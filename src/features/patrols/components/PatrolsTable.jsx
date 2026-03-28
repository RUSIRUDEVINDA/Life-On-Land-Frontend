import React from 'react';
import { ArrowUpRight, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PatrolsTable = ({ patrols }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-[24px] border border-border-light shadow-premium overflow-hidden">
            <div className="p-6 border-b border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-[18px] font-bold text-primary-dark">Active Patrols</h2>
                    <p className="text-[13px] text-text-gray mt-1">
                        Manage ranger patrols, deployments, and scheduled routes.
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
                {patrols.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-primary-light/20 rounded-2xl flex items-center justify-center text-primary-medium mb-4">
                            <ClipboardList size={32} />
                        </div>
                        <h3 className="text-[16px] font-bold text-primary-dark mb-1">No Active Patrols</h3>
                        <p className="text-[13px] text-text-gray mt-1">Ready to plan your next deployment.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-light bg-bg-soft/30 text-[12px] uppercase tracking-wider text-text-gray">
                                <th className="px-6 py-4 font-semibold">Title</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Rangers Assigned</th>
                                <th className="px-6 py-4 font-semibold">Start Time</th>
                                <th className="px-6 py-4 font-semibold">End Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patrols.map((patrol) => (
                                <tr
                                    key={patrol._id || patrol.id}
                                    onClick={() => navigate(`/dashboard/patrols/${patrol._id || patrol.id}`)}
                                    className="border-b border-border-light hover:bg-bg-soft/50 transition-colors cursor-pointer"
                                    title="Click to view patrol details and add check-ins"
                                >
                                    <td className="px-6 py-4 text-[14px] font-medium text-primary-dark">
                                        {patrol.title || 'Untitled Patrol'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${patrol.status === 'IN_PROGRESS' ? 'bg-[#e3f2fd] text-[#1565C0]' :
                                                patrol.status === 'COMPLETED' ? 'bg-[#e8f5e9] text-[#2E7D32]' :
                                                    patrol.status === 'CANCELLED' ? 'bg-[#fff5f5] text-[#E63946]' :
                                                        'bg-bg-soft border border-border-light text-text-gray'
                                            }`}>
                                            {patrol.status || 'PLANNED'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[14px] text-text-gray">
                                        {patrol.assignedRangerIds?.length || 0} Rangers
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-primary-medium font-medium">
                                        {new Date(patrol.plannedStart).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-text-gray">
                                        {new Date(patrol.plannedEnd).toLocaleDateString()}
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

export default PatrolsTable;
