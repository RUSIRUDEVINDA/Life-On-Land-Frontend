import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin,
    Calendar,
    Clock,
    User,
    CheckCircle2,
    ArrowLeft,
    LoaderCircle,
    Send,
    Navigation,
    MessageSquare,
    History,
    Settings,
    Trash2,
    ShieldAlert,
    ChevronLeft,
    Target
} from 'lucide-react';
import { fetchPatrolById, addCheckIn, updatePatrol, deleteCheckIn } from '../../features/patrols/api/patrolsApi';
import { getUserRole } from '../../utils/auth';
import PatrolTitle from '../../features/patrols/components/PatrolTitle';

const STATUS_OPTIONS = [
    { value: 'PLANNED', label: 'Planned', badge: 'bg-indigo-100 text-indigo-700', active: 'ring-2 ring-indigo-500 bg-indigo-50' },
    { value: 'IN_PROGRESS', label: 'In Progress', badge: 'bg-blue-100 text-blue-700', active: 'ring-2 ring-blue-500 bg-blue-50' },
    { value: 'COMPLETED', label: 'Completed', badge: 'bg-emerald-100 text-emerald-700', active: 'ring-2 ring-emerald-500 bg-emerald-50' },
    { value: 'CANCELLED', label: 'Cancelled', badge: 'bg-rose-100 text-rose-700', active: 'ring-2 ring-rose-500 bg-rose-50' }
];

const PatrolDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userRole = getUserRole();
    const isAdmin = userRole === 'ADMIN';
    const isRanger = userRole === 'RANGER';

    const [patrol, setPatrol] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [checkInNote, setCheckInNote] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        const loadPatrol = async () => {
            try {
                const data = await fetchPatrolById(id);
                setPatrol(data);
            } catch (err) {
                setError(err.message || 'Failed to load patrol details');
            } finally {
                setLoading(false);
            }
        };

        loadPatrol();
    }, [id]);

    const findCurrentLocation = () => {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    () => {
                        resolve(patrol?.exactLocation || { lat: 0, lng: 0 });
                    }
                );
            } else {
                resolve(patrol?.exactLocation || { lat: 0, lng: 0 });
            }
        });
    };

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!isRanger) return;

        setSubmitting(true);
        try {
            const location = await findCurrentLocation();
            await addCheckIn(id, {
                location,
                note: checkInNote,
                timestamp: new Date().toISOString()
            });

            const updatedPatrol = await fetchPatrolById(id);
            setPatrol(updatedPatrol);
            setCheckInNote('');
        } catch (err) {
            alert('Failed to submit check-in: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!isAdmin) return;
        setUpdatingStatus(true);
        try {
            await updatePatrol(id, { status: newStatus });
            const updatedPatrol = await fetchPatrolById(id);
            setPatrol(updatedPatrol);
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteCheckIn = async (checkInId) => {
        if (!isAdmin) return;
        if (!window.confirm('Are you certain you want to redact this permanent log?')) return;

        try {
            await deleteCheckIn(id, checkInId);
            const updatedPatrol = await fetchPatrolById(id);
            setPatrol(updatedPatrol);
        } catch (err) {
            alert('Failed to delete check-in: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center animate-pulse">
                <LoaderCircle className="animate-spin text-primary-medium" size={32} />
            </div>
        );
    }

    if (error || !patrol) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[24px] border border-border-light shadow-premium p-12 text-center max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100 shadow-sm">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-[22px] font-bold text-primary-dark mb-2 tracking-tight">Mission Not Found</h2>
                <p className="text-[14px] text-text-gray mb-8">{error || 'The requested patrol record does not exist or has been heavily redacted.'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3.5 bg-primary-dark text-white rounded-2xl text-[14px] font-bold tracking-wide transition-all shadow-md hover:shadow-xl hover:bg-primary"
                >
                    Return to Operations
                </button>
            </div>
        );
    }

    const { status, title, plannedStart, plannedEnd, exactLocation, checkIns = [] } = patrol;

    return (
        <div className="max-w-6xl mx-auto py-2 animate-fade-in w-full">
            {/* Header Section */}
            <div className="flex items-center gap-5 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 rounded-[16px] border border-border-light flex items-center justify-center bg-white text-text-gray hover:text-primary-dark hover:bg-bg-soft hover:border-primary-light/50 shadow-sm transition-all group"
                >
                    <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                    <h1 className="text-[28px] font-bold tracking-tight text-primary-dark leading-none mb-1">Mission Dossier</h1>
                    <p className="text-[13px] font-medium text-text-gray flex items-center gap-2">
                        Operation <span className="px-2 py-0.5 bg-primary-light/10 text-primary-dark rounded-md font-mono font-bold tracking-wider text-[11px] border border-primary-light/20">#{id.slice(-6).toUpperCase()}</span>
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
                {/* ── Main Column ── */}
                <div className="space-y-6 min-w-0">
                    {/* Tactical Context Module */}
                    <div className="bg-gradient-to-br from-bg-soft to-white p-6 md:p-8 rounded-[24px] border border-border-light shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-light/5 rounded-bl-[100px] pointer-events-none"></div>

                        <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm border border-black/5 ${status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                    status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                                        'bg-indigo-100 text-indigo-700'
                                }`}>
                                {status === 'IN_PROGRESS' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-70 animate-pulse"></span>}
                                {status || 'PLANNED'}
                            </span>
                        </div>


                        <div className="mb-8 relative z-10">
                            <PatrolTitle title={title} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 relative z-10">
                            <div>
                                <label className="text-[10px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                                    <Calendar size={12} /> Scheduled Start
                                </label>
                                <div className="w-full px-5 py-3.5 bg-white/70 border border-border-light/60 rounded-xl shadow-inner-sm">
                                    <p className="text-[14px] font-bold text-primary-dark">{new Date(plannedStart).toLocaleDateString()}</p>
                                    <p className="text-[12px] font-medium text-text-gray mt-0.5">{new Date(plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                                    <Clock size={12} /> Scheduled End
                                </label>
                                <div className="w-full px-5 py-3.5 bg-white/70 border border-border-light/60 rounded-xl shadow-inner-sm">
                                    <p className="text-[14px] font-bold text-primary-dark">{new Date(plannedEnd).toLocaleDateString()}</p>
                                    <p className="text-[12px] font-medium text-text-gray mt-0.5">{new Date(plannedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                                    <MapPin size={12} /> Target Coordinates
                                </label>
                                <div className="w-full px-5 py-3.5 bg-white/70 border border-border-light/60 rounded-xl shadow-inner-sm">
                                    <p className="text-[14px] font-bold text-primary-dark font-mono">{exactLocation?.lat.toFixed(4)}, {exactLocation?.lng.toFixed(4)}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-primary-medium/70 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                                    <User size={12} /> Assigned Squad
                                </label>
                                <div className="w-full px-5 py-3.5 bg-white/70 border border-border-light/60 rounded-xl shadow-inner-sm flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-light/20 flex items-center justify-center text-primary-dark text-[11px] font-bold border border-primary-light/30">
                                        {patrol.assignedRangerIds?.length || 0}
                                    </div>
                                    <p className="text-[13px] font-medium text-primary-dark tracking-wide">Specialized Rangers</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mission Progress Logs */}
                    <div className="bg-white p-6 md:p-8 rounded-[24px] border border-border-light shadow-sm">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border-light/50">
                            <div className="w-10 h-10 rounded-xl bg-bg-soft flex items-center justify-center text-text-gray">
                                <History size={20} />
                            </div>
                            <h2 className="text-[18px] font-bold text-primary-dark tracking-tight">Mission Progress Logs</h2>
                        </div>

                        {checkIns.length === 0 ? (
                            <div className="py-12 flex flex-col items-center">
                                <Navigation className="text-border-light mb-4" strokeWidth={1.5} size={48} />
                                <p className="text-[14px] font-medium text-text-gray">No field transmission logs recorded.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-border-light before:-z-10">
                                {[...checkIns].reverse().map((check, index) => (
                                    <div key={check._id || index} className="relative pl-12 group">
                                        <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-2 border-primary-light/20 flex items-center justify-center shadow-sm z-10 transition-colors group-hover:border-primary-light">
                                            <CheckCircle2 size={16} className="text-primary-medium" />
                                        </div>

                                        <div className="bg-bg-soft/40 hover:bg-bg-soft transition-colors rounded-2xl p-5 border border-border-light/80 relative">
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteCheckIn(check._id)}
                                                    className="absolute top-3 right-3 p-2 text-text-gray hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Redact Log"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}

                                            <div className="flex items-center gap-3 mb-3">
                                                <p className="text-[13px] font-bold text-primary-dark tracking-wide">
                                                    {new Date(check.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <span className="text-[11px] font-medium text-text-gray">
                                                    {new Date(check.timestamp).toLocaleDateString()}
                                                </span>
                                                <span className="ml-auto mr-8 md:mr-0 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                                    <MapPin size={10} /> Verified
                                                </span>
                                            </div>

                                            <p className="text-[14px] font-medium text-primary-dark/80 leading-relaxed italic border-l-2 border-primary-light/30 pl-3">
                                                "{check.note || 'Routine sector sweep completed. No anomalies detected.'}"
                                            </p>

                                            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono font-medium text-text-gray bg-white w-fit px-3 py-1.5 rounded-lg border border-border-light shadow-inner-sm">
                                                <Target size={12} className="text-primary-light" />
                                                {check.location?.lat.toFixed(5)}, {check.location?.lng.toFixed(5)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sidebar Column ── */}
                <div className="space-y-6">
                    {/* Ranger Controls Container */}
                    {isRanger && (
                        <div className="bg-white p-6 lg:p-8 rounded-[24px] border border-border-light shadow-premium flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-light to-primary"></div>

                            <h3 className="text-[16px] font-bold text-primary-dark mb-2 flex items-center gap-2">
                                <Send size={18} className="text-primary-medium" />
                                Initiate Transmission
                            </h3>
                            <p className="text-[13px] font-medium text-text-gray mb-6 leading-relaxed">
                                Securely transmit your tactical status. GPS telemetry is automatically embedded.
                            </p>

                            <form onSubmit={handleCheckIn} className="flex flex-col gap-4 mt-auto">
                                <textarea
                                    value={checkInNote}
                                    onChange={(e) => setCheckInNote(e.target.value)}
                                    placeholder="Enter encrypted field notes..."
                                    className="w-full bg-bg-soft border border-border-light rounded-2xl p-4 text-[13px] font-medium text-primary-dark min-h-[120px] focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light focus:bg-white outline-none transition-all resize-none shadow-sm"
                                />

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary-dark text-white rounded-2xl py-3.5 font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(23,54,43,0.39)] hover:shadow-[0_6px_20px_rgba(23,54,43,0.23)] hover:bg-primary transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                                >
                                    {submitting ? (
                                        <>
                                            <LoaderCircle size={16} className="animate-spin" />
                                            Encrypting...
                                        </>
                                    ) : (
                                        <>
                                            <Navigation size={16} />
                                            Secure Check-in
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Admin Override Controls */}
                    {isAdmin && (
                        <div className="bg-white p-6 lg:p-8 rounded-[24px] border border-border-light shadow-premium relative overflow-hidden">
                            <h3 className="text-[16px] font-bold text-primary-dark mb-2 flex items-center gap-2">
                                <Settings size={18} className="text-primary-medium" />
                                Command Control
                            </h3>
                            <p className="text-[13px] font-medium text-text-gray mb-6 leading-relaxed">
                                Authoritatively override operation phase. Field operatives will be notified immediately.
                            </p>

                            <div className="flex flex-col gap-3">
                                {STATUS_OPTIONS.map((opt) => {
                                    const isSelected = status === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleStatusUpdate(opt.value)}
                                            disabled={updatingStatus || isSelected}
                                            className={`relative w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all border ${isSelected
                                                ? `${opt.active} border-transparent text-primary-dark shadow-sm`
                                                : 'bg-white border-border-light text-text-gray hover:bg-bg-soft hover:border-text-gray/30'
                                                } disabled:cursor-not-allowed`}
                                        >
                                            {opt.label}
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'border-primary-medium text-primary-medium' : 'border-border-light text-transparent'
                                                }`}>
                                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary-medium' : 'bg-transparent'}`} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-6 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex gap-3">
                                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-500" />
                                <p className="text-[11px] font-medium leading-relaxed text-amber-700">
                                    Directives enacted here bypass standard reporting protocols and instantly update global state.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Mission Protocol Guide */}
                    <div className="bg-white p-6 lg:p-8 rounded-[24px] border border-border-light shadow-sm">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-primary-dark mb-3">
                            <MessageSquare size={16} className="text-primary-medium" />
                            Standard Operating Procedure
                        </div>
                        <p className="text-[13px] font-medium text-text-gray leading-relaxed mb-6">
                            Field units are required to transmit verifiable telemetry at min. 4-hour intervals. Failure generates automated command alerts.
                        </p>
                        {isRanger && (
                            <button
                                onClick={() => navigate('/dashboard/incidents/report')}
                                className="w-full py-3.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/30 text-[13px] font-bold hover:bg-rose-50 transition-colors"
                            >
                                Dispatch Code Red Incident
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatrolDetailsPage;
