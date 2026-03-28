import React from 'react';
import { Search, Edit, Trash2, Tag, AlertCircle } from 'lucide-react';

const AnimalTable = ({ animals, loading, error, onDelete, onEdit }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
            case 'INACTIVE': return 'bg-amber-100 text-amber-700';
            case 'DECEASED': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-border-light">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td colSpan="4" className="px-6 py-6"><div className="h-4 bg-bg-soft rounded-lg w-full shimmer"></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-rose-500 max-w-sm mx-auto p-6 rounded-3xl bg-rose-50/50 border border-rose-100">
                    <AlertCircle size={32} />
                    <p className="text-[14px] font-bold tracking-tight">{error}</p>
                </div>
            </div>
        );
    }

    if (animals.length === 0) {
        return (
            <div className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-bg-soft flex items-center justify-center text-text-gray mb-1">
                        <Search size={24} />
                    </div>
                    <p className="text-[14px] font-bold text-primary-dark">No entities found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-bg-soft/30">
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-widest border-b border-border-light">Entity Information</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-widest border-b border-border-light">Location & Zone</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-widest border-b border-border-light">Status Tracking</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-widest border-b border-border-light text-right">Management</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                    {animals.map((animal, index) => (
                        <tr
                            key={animal.tagId}
                            className="group hover:bg-bg-soft/40 transition-all duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <td className="px-6 py-3.5">
                                <div className="flex gap-3 items-center">
                                    <div className="w-9 h-9 rounded-[14px] bg-primary text-white flex items-center justify-center font-bold text-[12px] shadow-sm transform group-hover:scale-105 transition-transform duration-300">
                                        {animal.species.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-bold text-primary-dark tracking-tight">{animal.species}</span>
                                        <span className="text-[11px] font-mono font-bold text-primary-medium flex items-center gap-1.5 opacity-80">
                                            <Tag size={10} /> {animal.tagId}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-3.5">
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-primary-dark tracking-tight">{animal.protectedAreaName || 'Unassigned Area'}</span>
                                    <span className="text-[11px] font-medium text-text-gray flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-medium"></span>
                                        {animal.zoneName || 'Global Zone'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-black/5 ${getStatusStyle(animal.status)}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse"></span>
                                    {animal.status}
                                </span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(animal.tagId)}
                                        className="p-2 bg-white shadow-sm border border-border-light text-text-gray hover:text-primary hover:border-primary/30 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
                                        title="Edit Record"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(animal.tagId)}
                                        className="p-2 bg-white shadow-sm border border-border-light text-text-gray hover:text-rose-500 hover:border-rose-200 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
                                        title="Delete Record"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AnimalTable;
