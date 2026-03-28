import React from 'react';
import { Map, ShieldAlert } from 'lucide-react';

const RiskMapPage = () => {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Risk Map</h1>
                <p className="mt-1 text-[14px] text-text-gray">
                    Visualize high-risk zones and potential threats across the protected areas.
                </p>
            </div>

            <div className="bg-white rounded-[28px] border border-border-light p-12 flex flex-col items-center justify-center min-h-[400px] shadow-premium">
                <div className="w-16 h-16 bg-primary-light/20 rounded-2xl flex items-center justify-center text-primary-medium mb-4">
                    <Map size={32} />
                </div>
                <h2 className="text-xl font-semibold text-primary-dark">Risk Map Coming Soon</h2>
                <p className="text-text-gray text-center max-w-md mt-2">
                    We are currently integrating real-time satellite data and historical incident patterns to provide a comprehensive risk visualization.
                </p>
            </div>
        </div>
    );
};

export default RiskMapPage;
