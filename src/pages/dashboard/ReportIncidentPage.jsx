import React from 'react';
import { FilePlus2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportIncidentPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-primary-dark hover:bg-white transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Report Incident</h1>
                    <p className="mt-1 text-[14px] text-text-gray">
                        Log a new incident or suspicious activity for investigation.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[28px] border border-border-light p-12 flex flex-col items-center justify-center min-h-[400px] shadow-premium">
                <div className="w-16 h-16 bg-primary-light/20 rounded-2xl flex items-center justify-center text-primary-medium mb-4">
                    <FilePlus2 size={32} />
                </div>
                <h2 className="text-xl font-semibold text-primary-dark">Reporting Form Coming Soon</h2>
                <p className="text-text-gray text-center max-w-md mt-2">
                    The incident reporting workflow is being finalized to ensure all necessary data is captured for the backend.
                </p>
                <button
                    onClick={() => navigate('/dashboard/incidents')}
                    className="mt-6 bg-primary-dark text-white px-6 py-3 rounded-2xl text-[14px] font-semibold hover:bg-black transition-colors"
                >
                    Back to Incidents
                </button>
            </div>
        </div>
    );
};

export default ReportIncidentPage;
