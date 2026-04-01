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
    ShieldAlert
} from 'lucide-react';
import { fetchPatrolById, addCheckIn, updatePatrol, deleteCheckIn } from '../../features/patrols/api/patrolsApi';
import { getUserRole } from '../../utils/auth';

const STATUS_OPTIONS = [
    { value: 'PLANNED', label: 'Planned', color: 'bg-gray-100 text-gray-700' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-[#ecfdf3] text-[#1f6d31]' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-[#f0f9ff] text-[#0369a1]' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-[#fff5f5] text-[#E63946]' }
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
            alert('Check-in submitted successfully!');
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
            alert(`Patrol status updated to ${newStatus}`);
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteCheckIn = async (checkInId) => {
        if (!isAdmin) return;
        if (!window.confirm('Are you sure you want to delete this check-in log?')) return;

        try {
            await deleteCheckIn(id, checkInId);
            const updatedPatrol = await fetchPatrolById(id);
            setPatrol(updatedPatrol);
            alert('Check-in log deleted successfully');
        } catch (err) {
            alert('Failed to delete check-in: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <LoaderCircle className="animate-spin text-primary-medium" size={40} />
            </div>
        );
    }

    if (error || !patrol) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-border-light shadow-premium max-w-2xl mx-auto mt-12">
                <p className="text-[#E63946] font-semibold mb-4">{error || 'Patrol not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                    <ArrowLeft size={16} /> Back to patrols
                </button>
            </div>
        );
    }

    const { status, title, plannedStart, plannedEnd, exactLocation, checkIns = [] } = patrol;

    return (
        <div className="max-w-5xl mx-auto py-2">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border-light text-[13px] font-semibold text-primary-dark shadow-premium hover:bg-bg-soft transition-all"
            >
                <ArrowLeft size={16} />
                Back to Dashboard
            </button>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ── Main Details ── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] border border-border-light shadow-premium overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[12px] font-bold border ${status === 'IN_PROGRESS' ? 'bg-[#ecfdf3] text-[#1f6d31] border-[#2b8a3e]/30' :
                                    status === 'COMPLETED' ? 'bg-[#f0f9ff] text-[#0369a1] border-[#0ea5e9]/30' :
                                        'bg-bg-soft text-text-gray border-border-light'
                                    }`}>
                                    {status || 'PLANNED'}
                                </span>
                                <p className="text-[12px] text-text-gray font-medium">Patrol ID: {id.slice(-6).toUpperCase()}</p>
                            </div>

                            <h1 className="text-[32px] font-bold text-primary-dark tracking-tight leading-tight mb-4">
                                {title || 'Untitled Patrol Mission'}
                            </h1>

                            <div className="grid sm:grid-cols-2 gap-6 mt-8">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary-light/20 flex items-center justify-center text-primary-medium flex-shrink-0">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-text-gray uppercase tracking-wider">Scheduled Start</p>
                                            <p className="text-[15px] font-semibold text-primary-dark mt-0.5">{new Date(plannedStart).toLocaleDateString()}</p>
                                            <p className="text-[13px] text-text-gray mt-0.5">{new Date(plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-[#fff5f5] flex items-center justify-center text-[#E63946] flex-shrink-0">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-text-gray uppercase tracking-wider">Target Location</p>
                                            <p className="text-[15px] font-semibold text-primary-dark mt-0.5">{exactLocation?.lat.toFixed(4)}, {exactLocation?.lng.toFixed(4)}</p>
                                            <p className="text-[13px] text-text-gray mt-0.5">Wildlife Sanctuary Zone</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-text-gray uppercase tracking-wider">Scheduled End</p>
                                            <p className="text-[15px] font-semibold text-primary-dark mt-0.5">{new Date(plannedEnd).toLocaleDateString()}</p>
                                            <p className="text-[13px] text-text-gray mt-0.5">{new Date(plannedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-text-gray uppercase tracking-wider">Team Size</p>
                                            <p className="text-[15px] font-semibold text-primary-dark mt-0.5">{patrol.assignedRangerIds?.length || 0} Specialized Rangers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Check-in History ── */}
                    <div className="bg-white rounded-[32px] border border-border-light shadow-premium p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <History className="text-primary-medium" size={24} />
                            <h2 className="text-[20px] font-bold text-primary-dark">Mission Progress Logs</h2>
                        </div>

                        {checkIns.length === 0 ? (
                            <div className="py-12 border-2 border-dashed border-border-light rounded-3xl text-center">
                                <Navigation className="mx-auto text-text-gray/30 mb-3" size={40} />
                                <p className="text-[14px] text-text-gray">No check-ins recorded yet for this mission.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-light">
                                {[...checkIns].reverse().map((check, index) => (
                                    <div key={check._id || index} className="relative pl-12">
                                        <div className="absolute left-0 top-1.5 w-[38px] h-[38px] rounded-full bg-white border-4 border-primary-light/30 flex items-center justify-center">
                                            <CheckCircle2 size={16} className="text-primary-medium" />
                                        </div>
                                        <div className="bg-bg-soft rounded-2xl p-4 border border-border-light group relative">
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteCheckIn(check._id)}
                                                    className="absolute top-2 right-2 p-2 text-text-gray hover:text-[#E63946] opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete Log (Admin Only)"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <p className="text-[13px] font-bold text-primary-dark">
                                                    {new Date(check.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(check.timestamp).toLocaleDateString()}
                                                </p>
                                                <span className="text-[11px] font-medium text-text-gray bg-white px-2 py-0.5 rounded-full border border-border-light">
                                                    GPS Verified
                                                </span>
                                            </div>
                                            <p className="text-[14px] text-text-black italic">"{check.note || 'Regular status check-in'}"</p>
                                            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-text-gray">
                                                <MapPin size={12} />
                                                {check.location?.lat.toFixed(5)}, {check.location?.lng.toFixed(5)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sidebar Actions ── */}
                <div className="space-y-6 self-start sticky top-6">
                    {/* Ranger Check-in Form */}
                    {isRanger && (
                        <div className="bg-white rounded-[32px] border border-border-light shadow-premium p-6">
                            <h3 className="text-[18px] font-bold text-primary-dark mb-4 flex items-center gap-2">
                                <Send size={18} className="text-primary" />
                                Submit Check-in
                            </h3>
                            <p className="text-[13px] text-text-gray mb-6 leading-relaxed">
                                Report your current status and location to central command. Geolocation will be automatically verified.
                            </p>

                            <form onSubmit={handleCheckIn} className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-bold text-text-gray uppercase tracking-widest mb-2 pl-1">
                                        Patrol Notes
                                    </label>
                                    <textarea
                                        value={checkInNote}
                                        onChange={(e) => setCheckInNote(e.target.value)}
                                        placeholder="Any observations or status updates?"
                                        className="w-full bg-bg-soft border border-border-light rounded-2xl p-4 text-[14px] min-h-[120px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary-dark text-white rounded-2xl py-4 font-bold text-[15px] flex items-center justify-center gap-3 shadow-premium hover:bg-black transition-all disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <LoaderCircle size={18} className="animate-spin" />
                                            Verifying GPS...
                                        </>
                                    ) : (
                                        <>
                                            <Navigation size={18} />
                                            Confirm Check-in
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Admin Status Management */}
                    {isAdmin && (
                        <div className="bg-white rounded-[32px] border border-[#0ea5e9]/30 shadow-premium p-6 border-l-8">
                            <h3 className="text-[18px] font-bold text-primary-dark mb-4 flex items-center gap-2">
                                <Settings size={18} className="text-[#0369a1]" />
                                Mission Management
                            </h3>
                            <p className="text-[13px] text-text-gray mb-6 leading-relaxed">
                                As an administrator, you can override mission status and manage field reports.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-bold text-text-gray uppercase tracking-widest mb-2 pl-1">
                                        Override Mission Status
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleStatusUpdate(opt.value)}
                                                disabled={updatingStatus || status === opt.value}
                                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold border transition-all ${status === opt.value
                                                    ? `${opt.color} border-current opacity-100`
                                                    : 'bg-white border-border-light text-text-gray hover:bg-bg-soft'
                                                    } disabled:cursor-not-allowed`}
                                            >
                                                {opt.label}
                                                {status === opt.value && <CheckCircle2 size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                    <div className="flex gap-2 text-amber-800">
                                        <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                                        <p className="text-[12px] font-medium leading-normal">
                                            Status changes are logged and will notify assigned rangers via system updates.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[32px] border border-border-light shadow-premium p-6">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-primary-dark mb-4">
                            <MessageSquare size={16} className="text-primary-medium" />
                            Mission Protocol
                        </div>
                        <p className="text-[12px] text-text-gray leading-relaxed mb-4">
                            Rangers must provide at least one check-in every 4 hours during active deployment.
                            Failure to check-in will trigger an automated alert.
                        </p>
                        {isRanger && (
                            <button
                                onClick={() => navigate('/dashboard/incidents/report')}
                                className="w-full py-3 rounded-xl border border-[#E63946]/30 text-[#E63946] text-[13px] font-bold hover:bg-[#fff5f5] transition-colors"
                            >
                                Report Emergency Incident
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatrolDetailsPage;
