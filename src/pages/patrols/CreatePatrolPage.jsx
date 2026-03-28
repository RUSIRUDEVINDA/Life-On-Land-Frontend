import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Info, AlertTriangle, Search, X } from 'lucide-react';
import { createPatrol } from '../../features/patrols/api/patrolsApi';
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
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[24px] border border-border-light shadow-premium p-12 text-center">
                <div className="w-16 h-16 bg-[#fff5f5] rounded-2xl flex items-center justify-center text-[#E63946] mb-4">
                    <Info size={32} />
                </div>
                <h2 className="text-xl font-semibold text-primary-dark mb-2">Alert Required</h2>
                <p className="text-text-gray mb-6 max-w-sm">
                    Patrols must be deployed from an active Alert.
                </p>
                <button
                    onClick={() => navigate('/dashboard/alerts')}
                    className="px-6 py-3 bg-primary text-white rounded-xl text-[14px] font-semibold transition hover:bg-primary-dark"
                >
                    Go to Alerts Center
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

        const rangersArray = selectedRangers.map(r => r._id || r.id);

        if (rangersArray.length === 0) {
            setError('Please assign at least one active Ranger to this patrol.');
            setSubmitting(false);
            return;
        }

        const payload = {
            alertId: alertId,
            plannedStart: new Date(formData.plannedStart).toISOString(),
            plannedEnd: new Date(formData.plannedEnd).toISOString(),
            assignedRangerIds: rangersArray,
            notes: formData.notes
        };

        try {
            await createPatrol(payload);
            navigate('/dashboard/patrols');
        } catch (err) {
            setError(err.message || 'Failed to deploy patrol');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full border border-border-light flex items-center justify-center bg-white text-primary-dark hover:bg-bg-soft shadow-sm transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Deploy Patrol</h1>
                    <p className="mt-1 text-[13px] text-text-gray">
                        Configure deployment for Alert #{alertId.substring(0, 8).toUpperCase()}
                    </p>
                </div>
            </div>

            <div className="w-full">
                {error && (
                    <div className="mb-6 rounded-xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a] font-medium flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Pre-filled readonly fields container */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 bg-white/40 p-6 rounded-[20px] border border-border-light/40 backdrop-blur-sm">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-[11px] font-bold text-primary-medium uppercase tracking-wider mb-1.5 block">Patrol Objective / Title</label>
                            <input
                                type="text"
                                disabled
                                value={alertData?.description || 'Loading...'}
                                className="w-full px-4 py-3 bg-gray-100/70 border border-border-light/60 rounded-xl text-[13px] text-primary-dark font-medium cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-primary-medium uppercase tracking-wider mb-1.5 block">Target Area</label>
                            <input
                                type="text"
                                disabled
                                value={areaName}
                                className="w-full px-4 py-3 bg-gray-100/70 border border-border-light/60 rounded-xl text-[13px] text-primary-dark font-medium cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-primary-medium uppercase tracking-wider mb-1.5 block">Target Zone</label>
                            <input
                                type="text"
                                disabled
                                value={zoneName}
                                className="w-full px-4 py-3 bg-gray-100/70 border border-border-light/60 rounded-xl text-[13px] text-primary-dark font-medium cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-primary-medium uppercase tracking-wider mb-1.5 block">Operation Type</label>
                            <input
                                type="text"
                                disabled
                                value={alertData?.type || 'Loading...'}
                                className="w-full px-4 py-3 bg-gray-100/70 border border-border-light/60 rounded-xl text-[13px] text-primary-dark font-medium cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-primary-medium uppercase tracking-wider mb-1.5 block">Alert Severity</label>
                            <input
                                type="text"
                                disabled
                                value={alertData?.severity || 'Loading...'}
                                className="w-full px-4 py-3 bg-gray-100/70 border border-border-light/60 rounded-xl text-[13px] text-primary-dark font-medium cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-border-light/60 my-1"></div>

                    {/* Editable fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold tracking-wide uppercase text-primary-medium">Start Date & Time</label>
                            <input
                                type="datetime-local"
                                name="plannedStart"
                                value={formData.plannedStart}
                                onChange={handleChange}
                                required
                                className="px-3.5 py-3 bg-white border border-border-light rounded-xl text-[13px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold tracking-wide uppercase text-primary-medium">End Date & Time</label>
                            <input
                                type="datetime-local"
                                name="plannedEnd"
                                value={formData.plannedEnd}
                                onChange={handleChange}
                                required
                                className="px-3.5 py-3 bg-white border border-border-light rounded-xl text-[13px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 relative">
                        <label className="text-[12px] font-bold tracking-wide uppercase text-primary-medium">Assigned Ranger Squad</label>

                        {/* Selected Rangers Chips */}
                        {selectedRangers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedRangers.map((ranger) => (
                                    <div key={ranger._id || ranger.id} className="flex items-center gap-1.5 bg-primary-light/10 border border-primary-medium/20 text-primary-dark px-2.5 py-1.5 rounded-lg text-[13px] font-medium">
                                        <span>{ranger.name || ranger.email}</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRangers(prev => prev.filter(r => (r._id || r.id) !== (ranger._id || ranger.id)))}
                                            className="text-primary-medium hover:text-[#E63946] transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Search Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-gray">
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
                                placeholder="Search rangers by name to assign..."
                                className="w-full pl-9 pr-3.5 py-3 bg-white border border-border-light rounded-xl text-[13px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                            />
                        </div>

                        {/* Dropdown List */}
                        {isDropdownOpen && rangerSearch.length >= 0 && (
                            <div className="absolute z-10 top-full inset-x-0 mt-1.5 bg-white border border-border-light rounded-xl shadow-premium max-h-[200px] overflow-y-auto w-full">
                                {rangers.filter(r =>
                                    (r.name?.toLowerCase().includes(rangerSearch.toLowerCase()) ||
                                        r.email?.toLowerCase().includes(rangerSearch.toLowerCase())) &&
                                    !selectedRangers.find(sr => (sr._id || sr.id) === (r._id || r.id))
                                ).length === 0 ? (
                                    <div className="px-4 py-3 text-[13px] text-text-gray text-center">No available rangers found.</div>
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
                                            className="w-full text-left px-4 py-3 text-[13px] font-medium text-primary-dark hover:bg-bg-soft border-b border-border-light/50 last:border-0 transition-colors flex items-center justify-between"
                                        >
                                            <span>{ranger.name || "Unnamed Ranger"}</span>
                                            <span className="text-[11px] text-text-gray">{ranger.email}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                        <p className="text-[11px] text-text-gray mt-1">Select one or more rangers to add them to the deployment squad.</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold tracking-wide uppercase text-primary-medium">Mission Directives / Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Provide detailed instructions for the deployed squad..."
                            className="px-3.5 py-3 bg-white border border-border-light rounded-xl text-[13px] font-medium min-h-[100px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors resize-y"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-primary text-white rounded-xl text-[14px] font-semibold tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-px disabled:translate-y-0 disabled:shadow-none disabled:bg-text-gray disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Initiating Deployment...' : 'Confirm Patrol Deployment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePatrolPage;
