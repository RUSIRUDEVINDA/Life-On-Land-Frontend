import React from 'react';
import { AlertTriangle } from 'lucide-react';

const IncidentCard = ({ title, description, time }) => {
    return (
        <div className="rounded-2xl p-4 flex flex-col shadow-premium bg-primary-dark text-white bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:16px_16px]">
            <h3 className="text-[13px] font-semibold text-white mb-3">Recent Incidents</h3>
            <div className="flex items-center gap-3 mt-2 mb-4">
                <div className="w-[42px] h-[42px] bg-white/10 rounded-xl flex justify-center items-center text-primary-medium shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div className="flex flex-col">
                    <h4 className="text-[13px] font-bold mb-0.5">{title}</h4>
                    <p className="text-[10px] text-white/70 mb-1.5">{description}</p>
                    <span className="inline-block text-[8px] bg-primary-medium/20 text-primary-medium px-1.5 py-0.5 rounded-md self-start">{time}</span>
                </div>
            </div>
            <button className="bg-primary text-white border border-white/20 p-2 rounded-md text-[11px] font-semibold cursor-pointer transition-all duration-200 hover:bg-white hover:text-primary-dark outline-none">
                View Incident Details
            </button>
        </div>
    );
};

export default IncidentCard;
