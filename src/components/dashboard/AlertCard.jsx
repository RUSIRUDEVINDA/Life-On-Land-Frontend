import React from 'react';
import { ShieldAlert } from 'lucide-react';

const AlertCard = ({ title, type, location, time, actionLabel }) => {
    return (
        <div className="bg-white rounded-2xl p-4 border border-border-light shadow-premium flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
                <ShieldAlert size={16} color="#E63946" />
                <h3 className="text-[13px] font-semibold text-[#E63946] mb-0">{title}</h3>
            </div>
            <div className="mt-2">
                <h4 className="text-[13px] font-bold mb-0.5 text-primary-dark">{type}</h4>
                <p className="text-[10px] text-text-gray mb-2.5">{location} • {time}</p>
                <button className="bg-[#E63946] text-white border-none px-3.5 py-2 rounded-xl text-[12px] font-semibold flex justify-center items-center gap-1.5 w-full mt-2 transition-all hover:bg-red-700">
                    <span>{actionLabel}</span>
                </button>
            </div>
        </div>
    );
};

export default AlertCard;
