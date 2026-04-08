import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Info, AlertTriangle, Search, X, Calendar, Users, FileText, Target, MapPin } from 'lucide-react';
import { createPatrol } from '../../features/patrols/api/patrolsApi';
import PatrolTitle from '../../features/patrols/components/PatrolTitle';
import { fetchProtectedAreas, fetchZonesByProtectedArea } from '../../features/incidents/api/incidentsApi';
import { fetchAlerts } from '../../features/alerts/api/alertsApi';
import { fetchRangers } from '../../features/users/api/usersApi';

const CreatePatrolPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const alertId = searchParams.get('alertId');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [alertData, setAlertData] = useState(location.state?.alert || null);
    const [areaName, setAreaName] = useState('Loading...');
    const [zoneName, setZoneName] = useState('Loading...');

    const [formData, setFormData] = useState({
        plannedStart: '',
        plannedEnd: '',
        notes: '',
    });

    const [rangers, setRangers] = useState([]);
    const [selectedRangers, setSelectedRangers] = useState([]);
    const [rangerSearch, setRangerSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadRangers = async () => {
            try {
                const data = await fetchRangers();
                setRangers(data);
            } catch (err) {
                console.error("Failed to load rangers", err);
            }
        };
        loadRangers();
    }, []);

    useEffect(() => {
        if (!alertData && alertId) {
            const loadAlert = async () => {
                try {
                    const alerts = await fetchAlerts();
                    const found = alerts.find(a => (a._id || a.id) === alertId);
                    if (found) setAlertData(found);
                } catch (err) {
                    console.error("Failed to load alert details", err);
                }
            };
            loadAlert();
        }
    }, [alertId, alertData]);

    useEffect(() => {
        if (alertData?.protectedAreaId) {
            const paId = typeof alertData.protectedAreaId === 'object'
                ? (alertData.protectedAreaId._id || alertData.protectedAreaId.id)
                : String(alertData.protectedAreaId);

            fetchProtectedAreas().then(areas => {
                const area = areas.find(a => (a.id || a._id) === paId);
                const fallbackName = typeof alertData.protectedAreaId === 'object' ? alertData.protectedAreaId.name : null;
                setAreaName(area ? area.name : (fallbackName || 'Unknown Area'));
            }).catch(() => {
                const fallbackName = typeof alertData.protectedAreaId === 'object' ? alertData.protectedAreaId.name : null;
                setAreaName(fallbackName || 'Error loading');
            });

            if (alertData.zoneId) {
                fetchZonesByProtectedArea(paId).then(zones => {
                    const zId = typeof alertData.zoneId === 'object'
                        ? (alertData.zoneId._id || alertData.zoneId.id)
                        : String(alertData.zoneId);
                    const zone = zones.find(z => (z.id || z._id) === zId);
                    const fallbackName = typeof alertData.zoneId === 'object' ? alertData.zoneId.name : null;
                    setZoneName(zone ? zone.name : (fallbackName || 'Unknown Zone'));
                }).catch(() => {
                    const fallbackName = typeof alertData.zoneId === 'object' ? alertData.zoneId.name : null;
                    setZoneName(fallbackName || 'Error loading');
                });
            } else {
                setZoneName('N/A');
            }
        }
    }, [alertData]);

    if (!alertId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[24px] border border-border-light shadow-premium p-12 text-center max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100 shadow-sm">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-[22px] font-bold text-primary-dark mb-2 tracking-tight">Deployment Blocked</h2>
                <p className="text-[14px] text-text-gray mb-8 max-w-sm leading-relaxed">
                    Tactical patrols can only be deployed in response to an active, system-verified alert.
                </p>
                <button
                    onClick={() => navigate('/dashboard/alerts')}
                    className="px-8 py-3.5 bg-primary-dark text-white rounded-2xl text-[14px] font-bold tracking-wide transition-all shadow-md hover:shadow-xl hover:bg-primary active:-translate-y-px"
                >
                    Return to Alerts Center
                </button>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (!formData.plannedStart || !formData.plannedEnd) {
                throw new Error("Mission start and end times are required.");
            }

            const start = new Date(formData.plannedStart);
            const end = new Date(formData.plannedEnd);
            const now = new Date();

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error("Invalid date format provided for mission windows.");
            }

            // Validate dates
            if (start < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
                throw new Error('Strategic error: Mission start time cannot be in the past.');
            }

            if (end <= start) {
                throw new Error('Strategic error: Mission end time must be after the start time.');
            }

            const rangersArray = selectedRangers.map(r => r._id || r.id);

            if (rangersArray.length === 0) {
                throw new Error('Strategic error: At least one active Ranger must be assigned to this patrol squad.');
            }

            const payload = {
                alertId: alertId,
                plannedStart: start.toISOString(),
                plannedEnd: end.toISOString(),
                assignedRangerIds: rangersArray,
                notes: formData.notes
            };

            // Fallback robust payload inheritance in case the backend automation fails
            if (alertData) {
                if (alertData.protectedAreaId) {
                    payload.protectedAreaId = typeof alertData.protectedAreaId === 'object'
                        ? (alertData.protectedAreaId._id || alertData.protectedAreaId.id)
                        : alertData.protectedAreaId;
                }
                if (alertData.zoneId) {
                    payload.zoneIds = [typeof alertData.zoneId === 'object' ? (alertData.zoneId._id || alertData.zoneId.id) : alertData.zoneId];
                }
                if (alertData.location && alertData.location.lat && alertData.location.lng) {
                    payload.exactLocation = alertData.location;
                }
            }

            await createPatrol(payload);
            navigate('/dashboard/patrols');

        } catch (err) {
            console.error("Submission Error:", err);
            setError(err.message || 'Failed to deploy patrol squad. Please verify details and try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col max-w-5xl mx-auto w-full pb-12 animate-fade-in">
            {/* Header Section */}
            <div className="flex items-center gap-5 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 rounded-[16px] border border-border-light flex items-center justify-center bg-white text-text-gray hover:text-primary-dark hover:bg-bg-soft hover:border-primary-light/50 shadow-sm transition-all group"
                >
                    <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                    <h1 className="text-[32px] font-bold tracking-tight text-primary-dark leading-none mb-2">Deploy Patrol Squad</h1>
                    <p className="text-[14px] font-medium text-text-gray flex items-center gap-2">
                        Responding to Alert <span className="px-2 py-0.5 bg-primary-light/10 text-primary-dark rounded-md font-mono font-bold tracking-wider text-[11px] border border-primary-light/20">#{alertId.substring(0, 8).toUpperCase()}</span>
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-8 rounded-[16px] border border-rose-200 bg-rose-50/50 p-4 text-[13px] text-rose-700 font-bold flex items-center gap-3 shadow-sm animate-pulse-light">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={16} />
                    </div>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Tactical Context Module (Readonly) */}
                <div className="bg-gradient-to-br from-bg-soft to-white p-6 md:p-8 rounded-[24px] border border-border-light shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary-light/20 flex items-center justify-center text-primary-dark">
                            <Target size={20} />
                        </div>
                        <h2 className="text-[18px] font-bold text-primary-dark tracking-tight">Mission Context</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-[11px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 block">Primary Objective / Alert Description</label>
                            <div className="w-full px-5 py-4 bg-white/60 border border-border-light/60 rounded-xl shadow-inner-sm text-opacity-90 leading-relaxed">
                                {alertData?.description ? (
                                    <PatrolTitle title={alertData.description} />
                                ) : (
                                    <span className="text-[14px] text-primary-dark font-medium italic">Synchronizing with command center...</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 block flex items-center gap-1.5"><MapPin size={12} /> Target Area</label>
                            <div className="w-full px-5 py-3.5 bg-white/60 border border-border-light/60 rounded-xl text-[13px] text-primary-dark font-medium shadow-inner-sm">
                                {areaName}
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 block">Target Zone</label>
                            <div className="w-full px-5 py-3.5 bg-white/60 border border-border-light/60 rounded-xl text-[13px] text-primary-dark font-medium shadow-inner-sm">
                                {zoneName}
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 block">Trigger Type</label>
                            <div className="w-full px-5 py-3.5 bg-white/60 border border-border-light/60 rounded-xl text-[13px] text-primary-dark font-medium shadow-inner-sm">
                                {alertData?.type || 'Loading...'}
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 block">Threat Level</label>
                            <div className="flex items-center h-full max-h-[46px] px-5 py-3.5 bg-white/60 border border-border-light/60 rounded-xl text-[13px] shadow-inner-sm">
                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-widest uppercase ${alertData?.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                    alertData?.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                        alertData?.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {alertData?.severity || 'Loading...'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deployment Configuration Module */}
                <div className="bg-white p-6 md:p-8 rounded-[24px] border border-border-light shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/5 rounded-bl-full pointer-events-none -mr-4 -mt-4"></div>

                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                            <Calendar size={20} />
                        </div>
                        <h2 className="text-[18px] font-bold text-primary-dark tracking-tight">Deployment Parameters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">
                        {/* Time Config */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-medium tracking-[0.1em] uppercase text-text-gray">Mission Start Window</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    name="plannedStart"
                                    value={formData.plannedStart}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-4 pr-4 py-3.5 bg-bg-soft border border-border-light rounded-xl text-[13px] font-medium text-primary-dark outline-none focus:border-primary-light focus:bg-white focus:ring-4 focus:ring-primary-light/10 transition-all hover:border-text-gray/40 shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-medium tracking-[0.1em] uppercase text-text-gray">Mission End Window</label>
                            <input
                                type="datetime-local"
                                name="plannedEnd"
                                value={formData.plannedEnd}
                                onChange={handleChange}
                                required
                                className="w-full pl-4 pr-4 py-3.5 bg-bg-soft border border-border-light rounded-xl text-[13px] font-medium text-primary-dark outline-none focus:border-primary-light focus:bg-white focus:ring-4 focus:ring-primary-light/10 transition-all hover:border-text-gray/40 shadow-sm"
                            />
                        </div>

                        {/* Ranger Squad Selection */}
                        <div className="col-span-1 md:col-span-2 flex flex-col gap-3 relative" ref={dropdownRef}>
                            <label className="text-[11px] font-medium tracking-[0.1em] uppercase text-text-gray flex items-center gap-2">
                                <Users size={14} /> Assemble Squad
                            </label>

                            {selectedRangers.length > 0 && (
                                <div className="flex flex-wrap gap-2.5 mb-1 bg-bg-soft/50 p-3 rounded-2xl border border-border-light/50">
                                    {selectedRangers.map((ranger) => (
                                        <div key={ranger._id || ranger.id} className="flex items-center gap-2 bg-white border border-border-light shadow-sm text-primary-dark px-3 py-1.5 rounded-xl text-[13px] font-medium group transition-all hover:border-primary-light">
                                            <div className="w-5 h-5 rounded-full bg-primary-dark text-white flex items-center justify-center text-[9px] uppercase tracking-widest leading-none">
                                                {ranger.name?.substring(0, 2) || 'RG'}
                                            </div>
                                            <span>{ranger.name || ranger.email}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRangers(prev => prev.filter(r => (r._id || r.id) !== (ranger._id || ranger.id)))}
                                                className="text-text-gray hover:text-rose-500 hover:bg-rose-50 rounded-full p-0.5 ml-1 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-gray">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={rangerSearch}
                                    onChange={(e) => {
                                        setRangerSearch(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    placeholder="Search rangers by name or email to enlist..."
                                    className="w-full pl-11 pr-4 py-3.5 bg-bg-soft border border-border-light rounded-xl text-[13px] font-medium text-primary-dark outline-none focus:border-primary-light focus:bg-white focus:ring-4 focus:ring-primary-light/10 transition-all placeholder-text-gray shadow-sm"
                                />

                                {/* Custom Dropdown */}
                                {isDropdownOpen && rangerSearch.length >= 0 && (
                                    <div className="absolute z-20 top-full inset-x-0 mt-2 bg-white border border-border-light rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-[240px] overflow-y-auto w-full py-2">
                                        {rangers.filter(r =>
                                            (r.name?.toLowerCase().includes(rangerSearch.toLowerCase()) ||
                                                r.email?.toLowerCase().includes(rangerSearch.toLowerCase())) &&
                                            !selectedRangers.find(sr => (sr._id || sr.id) === (r._id || r.id))
                                        ).length === 0 ? (
                                            <div className="px-5 py-4 text-[13px] font-medium text-text-gray text-center flex flex-col items-center gap-2">
                                                <Users size={24} className="opacity-30" />
                                                No available personnel match query
                                            </div>
                                        ) : (
                                            rangers.filter(r =>
                                                (r.name?.toLowerCase().includes(rangerSearch.toLowerCase()) ||
                                                    r.email?.toLowerCase().includes(rangerSearch.toLowerCase())) &&
                                                !selectedRangers.find(sr => (sr._id || sr.id) === (r._id || r.id))
                                            ).map(ranger => (
                                                <button
                                                    key={ranger._id || ranger.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedRangers(prev => [...prev, ranger]);
                                                        setRangerSearch('');
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-5 py-3.5 text-[13px] font-medium text-primary-dark hover:bg-bg-soft transition-colors flex items-center gap-3 border-l-4 border-transparent hover:border-primary"
                                                >
                                                    <div className="w-8 h-8 rounded-[10px] bg-primary-light/20 flex items-center justify-center text-primary-medium text-[10px] uppercase tracking-wider shadow-sm">
                                                        {ranger.name?.substring(0, 2) || 'RG'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>{ranger.name || "Unnamed Ranger"}</span>
                                                        <span className="text-[11px] font-medium text-text-gray">{ranger.role || 'RANGER'} • {ranger.email}</span>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Directives / Notes */}
                        <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                            <label className="text-[11px] font-medium tracking-[0.1em] uppercase text-text-gray flex items-center gap-2">
                                <FileText size={14} /> Operational Directives
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Detail standard operating procedures, required equipment, and specific objectives for the dispatched squad..."
                                className="w-full pl-4 pr-4 py-4 bg-bg-soft border border-border-light rounded-xl text-[13px] font-medium text-primary-dark outline-none focus:border-primary-light focus:bg-white focus:ring-4 focus:ring-primary-light/10 transition-all placeholder-text-gray resize-y min-h-[120px] shadow-sm leading-relaxed"
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border-light mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto px-10 py-4 bg-primary-dark text-white rounded-2xl text-[14px] font-bold tracking-wider transition-all shadow-[0_8px_20px_-6px_rgba(23,54,43,0.4)] hover:shadow-[0_12px_24px_-8px_rgba(23,54,43,0.5)] hover:bg-primary active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white opacity-80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Transmitting Orders...
                                </>
                            ) : (
                                <>Deploy Patrol Squad <ChevronRight size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

/* Additional icons */
const ChevronRight = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 18l6-6-6-6" />
    </svg>
);

export default CreatePatrolPage;
