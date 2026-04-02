import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    ImagePlus,
    LoaderCircle,
    MapPin,
    Pencil,
    Search,
    X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    deleteIncident,
    fetchIncidentsByReporter,
    updateIncident,
    fetchProtectedAreas,
    fetchZonesByProtectedArea,
} from '../../features/incidents/api/incidentsApi';
import { getUserId } from '../../utils/auth';
import {
    ACCEPTED_TYPES,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_MB,
    MAX_IMAGES,
    compressImage,
    evidenceStringsToImageItems,
} from '../../features/incidents/utils/incidentEvidenceImages';

const STATUS_STYLES = {
    REPORTED: 'bg-[#e7f5ff] text-[#1864ab] border-[#74c0fc]/40',
    VERIFIED: 'bg-[#ebfbee] text-[#2b8a3e] border-[#8ce99a]/40',
    INVESTIGATING: 'bg-[#fff4e6] text-[#d9480f] border-[#ffc078]/40',
    RESOLVED: 'bg-[#f3f0ff] text-[#5f3dc4] border-[#b197fc]/40',
    UNVERIFIED: 'bg-[#fff5f5] text-[#a4161a] border-[#ffa8a8]/40',
};

const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const INCIDENT_TYPES = ['POACHING', 'ILLEGAL_LOGGING', 'WILDLIFE_TRADE', 'HABITAT_DESTRUCTION', 'OTHER'];

const formatDateTime = (value) => {
    if (!value) return 'Unknown date';
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const RangerMyIncidentsPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState('');
    const [deletingId, setDeletingId] = useState('');
    const [editingId, setEditingId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [editAreas, setEditAreas] = useState([]);
    const [editZones, setEditZones] = useState([]);
    const [loadingEditAreas, setLoadingEditAreas] = useState(false);
    const [loadingEditZones, setLoadingEditZones] = useState(false);
    const editFileInputRef = useRef(null);
    const [editEvidenceImages, setEditEvidenceImages] = useState([]);
    const [editForm, setEditForm] = useState({
        type: 'OTHER',
        description: '',
        severity: 'MEDIUM',
        notes: '',
        incidentDate: '',
        protectedAreaId: '',
        zoneId: '',
    });

    const loadMyIncidents = async () => {
        setLoading(true);
        setError('');
        try {
            const myUserId = getUserId();
            const mine = await fetchIncidentsByReporter(myUserId);
            setIncidents(mine);
        } catch (requestError) {
            setError(requestError.message || 'Failed to load your incidents.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyIncidents();
    }, []);

    const total = incidents.length;
    const active = useMemo(
        () =>
            incidents.filter(
                (i) => i.status === 'REPORTED' || i.status === 'INVESTIGATING' || i.status === 'VERIFIED'
            ).length,
        [incidents]
    );

    const filteredIncidents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return incidents;
        return incidents.filter((i) =>
            i.type?.toLowerCase().replaceAll('_', ' ').includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            i.status?.toLowerCase().includes(q) ||
            i.severity?.toLowerCase().includes(q) ||
            i.zone?.name?.toLowerCase().includes(q) ||
            i.protectedArea?.name?.toLowerCase().includes(q)
        );
    }, [incidents, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedIncidents = filteredIncidents.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handlePageSize = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const loadEditZones = async (protectedAreaId, preferredZoneId = '') => {
        if (!protectedAreaId) {
            setEditZones([]);
            setEditForm((prev) => ({ ...prev, zoneId: '' }));
            return;
        }

        setLoadingEditZones(true);
        try {
            const zones = await fetchZonesByProtectedArea(protectedAreaId);
            setEditZones(zones);
            setEditForm((prev) => ({
                ...prev,
                zoneId: zones.some((z) => z.id === preferredZoneId) ? preferredZoneId : prev.zoneId,
            }));
        } catch {
            setEditZones([]);
            setEditForm((prev) => ({ ...prev, zoneId: '' }));
        } finally {
            setLoadingEditZones(false);
        }
    };

    const beginEdit = async (incident) => {
        setError('');
        setEditingId(incident._id);

        const protectedAreaId = incident.protectedArea?.id || '';
        const zoneId = incident.zone?.id || '';

        setEditForm({
            type: incident.type || 'OTHER',
            description: incident.description || '',
            severity: incident.severity || 'MEDIUM',
            notes: incident.notes || '',
            incidentDate: toDateTimeLocal(incident.incidentDate),
            protectedAreaId,
            zoneId,
        });
        setEditEvidenceImages(evidenceStringsToImageItems(incident.evidence, incident._id));

        setLoadingEditAreas(true);
        try {
            const areas = await fetchProtectedAreas();
            setEditAreas(areas);
        } catch {
            setEditAreas([]);
        } finally {
            setLoadingEditAreas(false);
        }

        await loadEditZones(protectedAreaId, zoneId);
    };

    const cancelEdit = () => {
        setEditingId('');
        setEditAreas([]);
        setEditZones([]);
        setEditForm({
            type: 'OTHER',
            description: '',
            severity: 'MEDIUM',
            notes: '',
            incidentDate: '',
            protectedAreaId: '',
            zoneId: '',
        });
        setEditEvidenceImages([]);
    };

    const handleEditImageSelect = async (event) => {
        setError('');
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        const invalidType = files.find((file) => !ACCEPTED_TYPES.includes(file.type));
        if (invalidType) {
            setError(`"${invalidType.name}" is not a supported image type. Use JPG, PNG, WebP, or GIF.`);
            event.target.value = '';
            return;
        }

        const oversized = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
        if (oversized) {
            const sizeMb = (oversized.size / (1024 * 1024)).toFixed(1);
            setError(
                `"${oversized.name}" is too large (${sizeMb} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB per image.`
            );
            event.target.value = '';
            return;
        }

        const remaining = MAX_IMAGES - editEvidenceImages.length;
        if (remaining <= 0) {
            setError(`Maximum ${MAX_IMAGES} images allowed.`);
            event.target.value = '';
            return;
        }

        const toProcess = files.slice(0, remaining);
        if (files.length > remaining) {
            setError(`Only ${remaining} more image(s) can be added (maximum ${MAX_IMAGES}).`);
        }

        try {
            const dataUrls = await Promise.all(toProcess.map(compressImage));
            const newImages = toProcess.map((file, index) => ({
                id: `${Date.now()}-${index}`,
                name: file.name,
                dataUrl: dataUrls[index],
            }));
            setEditEvidenceImages((previous) => [...previous, ...newImages]);
        } catch {
            setError('Failed to process one or more image files. Please try different images.');
        }

        event.target.value = '';
    };

    const removeEditImage = (id) => {
        setError('');
        setEditEvidenceImages((previous) => previous.filter((image) => image.id !== id));
    };

    const saveEdit = async (incident) => {
        if (!incident?._id) return;
        if (!editForm.description.trim()) {
            setError('Description is required to update the incident.');
            return;
        }
        if (!editForm.protectedAreaId || !editForm.zoneId) {
            setError('Protected area and zone are required to update the incident.');
            return;
        }

        setSavingId(incident._id);
        setError('');
        try {
            await updateIncident(incident._id, {
                type: editForm.type,
                description: editForm.description.trim(),
                zoneId: editForm.zoneId,
                protectedAreaId: editForm.protectedAreaId,
                incidentDate: editForm.incidentDate
                    ? new Date(editForm.incidentDate).toISOString()
                    : incident.incidentDate,
                severity: editForm.severity,
                evidence: editEvidenceImages.map((image) => image.dataUrl),
                notes: editForm.notes.trim() || undefined,
            });

            await loadMyIncidents();
            cancelEdit();
        } catch (requestError) {
            setError(requestError.message || 'Failed to update incident.');
        } finally {
            setSavingId('');
        }
    };

    const handleDelete = async (incidentId) => {
        if (!incidentId) return;
        const confirmed = window.confirm('Delete this incident permanently? This action cannot be undone.');
        if (!confirmed) return;

        setDeletingId(incidentId);
        setError('');
        try {
            await deleteIncident(incidentId);
            setIncidents((previous) => previous.filter((item) => item._id !== incidentId));
            if (editingId === incidentId) cancelEdit();
        } catch (requestError) {
            setError(requestError.message || 'Failed to delete incident.');
        } finally {
            setDeletingId('');
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl py-2">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">My Reported Incidents</h1>
                    <p className="mt-1 text-[14px] text-text-gray">Only incidents reported by your account are shown here.</p>
                </div>
                <Link
                    to="/dashboard/incidents/report"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border-light bg-white px-4 py-2.5 text-[13px] font-semibold text-primary-dark shadow-premium transition hover:bg-bg-soft"
                >
                    <AlertTriangle size={14} />
                    Report New Incident
                </Link>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-border-light bg-white px-5 py-4 shadow-premium">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Total Reported</p>
                    <p className="mt-1 text-[24px] font-bold leading-none text-primary-dark">{total}</p>
                </div>
                <div className="rounded-[22px] border border-border-light bg-white px-5 py-4 shadow-premium">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Active Cases</p>
                    <p className="mt-1 text-[24px] font-bold leading-none text-primary-dark">{active}</p>
                </div>
            </div>

            <div className="rounded-[26px] border border-border-light bg-white shadow-premium">
                {/* Search + page-size toolbar */}
                {!loading && !error && (
                    <div className="flex flex-col gap-3 border-b border-border-light px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 rounded-2xl border border-border-light bg-bg-soft px-3 py-2 w-full sm:max-w-xs">
                            <Search size={14} className="shrink-0 text-text-gray" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search by type, status, zone…"
                                className="w-full bg-transparent text-[13px] text-primary-dark outline-none placeholder:text-text-gray"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-text-gray">
                            <span className="font-medium">Show</span>
                            <select
                                value={pageSize}
                                onChange={handlePageSize}
                                className="rounded-xl border border-border-light bg-white px-3 py-1.5 text-[12px] font-semibold text-primary-dark outline-none transition focus:border-primary-medium"
                            >
                                {[10, 20, 30].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <span className="font-medium">per page</span>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-text-gray">
                        <LoaderCircle size={16} className="animate-spin" />
                        Loading your incidents...
                    </div>
                ) : error ? (
                    <div className="px-6 py-8 text-[13px] text-[#a4161a]">{error}</div>
                ) : incidents.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-[14px] font-semibold text-primary-dark">No incidents reported by you yet.</p>
                        <p className="mt-1 text-[12px] text-text-gray">Use the report incident form to submit your first case.</p>
                    </div>
                ) : filteredIncidents.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-[14px] font-semibold text-primary-dark">No incidents match your search.</p>
                        <p className="mt-1 text-[12px] text-text-gray">Try a different keyword.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-light">
                        {paginatedIncidents.map((incident) => {
                            const badgeClass =
                                STATUS_STYLES[incident.status] ||
                                'bg-bg-soft text-primary-dark border-border-light';
                            const isEditing = editingId === incident._id;
                            return (
                                <div key={incident._id} className="px-5 py-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-[14px] font-semibold text-primary-dark">
                                                    {incident.type.replaceAll('_', ' ')}
                                                </p>
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badgeClass}`}
                                                >
                                                    {incident.status}
                                                </span>
                                            </div>

                                            {isEditing ? (
                                                <div className="mt-4 rounded-[24px] border border-border-light bg-white p-6 shadow-premium">
                                                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                                        Edit Incident
                                                    </p>

                                                    <div className="grid gap-5 md:grid-cols-2">
                                                        <label className="flex flex-col gap-2">
                                                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Type</span>
                                                            <select
                                                                value={editForm.type}
                                                                onChange={(e) =>
                                                                    setEditForm((prev) => ({ ...prev, type: e.target.value }))
                                                                }
                                                                className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                                            >
                                                                {INCIDENT_TYPES.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option.replaceAll('_', ' ')}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="flex flex-col gap-2">
                                                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Severity</span>
                                                            <select
                                                                value={editForm.severity}
                                                                onChange={(e) =>
                                                                    setEditForm((prev) => ({ ...prev, severity: e.target.value }))
                                                                }
                                                                className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                                            >
                                                                {SEVERITY_OPTIONS.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="flex flex-col gap-2">
                                                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Protected Area</span>
                                                            <select
                                                                value={editForm.protectedAreaId}
                                                                onChange={async (e) => {
                                                                    const areaId = e.target.value;
                                                                    setEditForm((prev) => ({ ...prev, protectedAreaId: areaId, zoneId: '' }));
                                                                    await loadEditZones(areaId, '');
                                                                }}
                                                                disabled={loadingEditAreas}
                                                                className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                                                            >
                                                                <option value="">
                                                                    {loadingEditAreas ? 'Loading areas...' : 'Select protected area'}
                                                                </option>
                                                                {editAreas.map((area) => (
                                                                    <option key={area.id} value={area.id}>
                                                                        {area.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="flex flex-col gap-2">
                                                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Zone</span>
                                                            <select
                                                                value={editForm.zoneId}
                                                                onChange={(e) =>
                                                                    setEditForm((prev) => ({ ...prev, zoneId: e.target.value }))
                                                                }
                                                                disabled={!editForm.protectedAreaId || loadingEditZones}
                                                                className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                                                            >
                                                                <option value="">
                                                                    {!editForm.protectedAreaId
                                                                        ? 'Select protected area first'
                                                                        : loadingEditZones
                                                                          ? 'Loading zones...'
                                                                          : 'Select zone'}
                                                                </option>
                                                                {editZones.map((zone) => (
                                                                    <option key={zone.id} value={zone.id}>
                                                                        {zone.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="flex flex-col gap-2 md:col-span-2">
                                                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Incident Date &amp; Time</span>
                                                            <input
                                                                type="datetime-local"
                                                                value={editForm.incidentDate}
                                                                onChange={(e) =>
                                                                    setEditForm((prev) => ({ ...prev, incidentDate: e.target.value }))
                                                                }
                                                                className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                                            />
                                                        </label>

                                                        <label className="flex flex-col gap-2 md:col-span-2">
                                                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Description</span>
                                                            <textarea
                                                                rows={3}
                                                                value={editForm.description}
                                                                onChange={(e) =>
                                                                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                                                                }
                                                                placeholder="Describe the incident in detail..."
                                                                className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                                            />
                                                        </label>

                                                        <div className="flex flex-col gap-3 md:col-span-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                                                    Evidence Images (optional)
                                                                </span>
                                                                <span
                                                                    className={`text-[11px] font-semibold ${editEvidenceImages.length >= MAX_IMAGES ? 'text-[#E63946]' : 'text-text-gray'}`}
                                                                >
                                                                    {editEvidenceImages.length} / {MAX_IMAGES}
                                                                </span>
                                                            </div>

                                                            <input
                                                                ref={editFileInputRef}
                                                                type="file"
                                                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                                                multiple
                                                                className="hidden"
                                                                onChange={handleEditImageSelect}
                                                            />

                                                            {editEvidenceImages.length > 0 && (
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {editEvidenceImages.map((image) => (
                                                                        <div
                                                                            key={image.id}
                                                                            className="group relative overflow-hidden rounded-2xl border border-border-light bg-bg-soft"
                                                                        >
                                                                            <img
                                                                                src={image.dataUrl}
                                                                                alt={image.name}
                                                                                className="h-[160px] w-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeEditImage(image.id)}
                                                                                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#E63946] transition hover:bg-white"
                                                                                    title="Remove image"
                                                                                >
                                                                                    <X size={14} />
                                                                                </button>
                                                                                <p className="truncate text-[11px] font-medium text-white">
                                                                                    {image.name}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {editEvidenceImages.length < MAX_IMAGES && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => editFileInputRef.current?.click()}
                                                                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-light bg-bg-soft py-5 text-[13px] font-semibold text-primary-dark transition hover:border-primary-medium hover:bg-white"
                                                                >
                                                                    <ImagePlus size={16} className="text-primary" />
                                                                    {editEvidenceImages.length === 0
                                                                        ? 'Upload Evidence Images'
                                                                        : 'Add Another Image'}
                                                                </button>
                                                            )}

                                                            <span className="text-[11px] text-text-gray">
                                                                Up to {MAX_IMAGES} images (JPG, PNG, WebP, GIF).
                                                            </span>
                                                        </div>

                                                        <label className="flex flex-col gap-2 md:col-span-2">
                                                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Notes <span className="normal-case font-normal">(optional)</span></span>
                                                            <textarea
                                                                rows={2}
                                                                value={editForm.notes}
                                                                onChange={(e) =>
                                                                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                                                                }
                                                                placeholder="Any additional notes..."
                                                                className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                                            />
                                                        </label>
                                                    </div>

                                                    <div className="mt-5 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEdit(incident)}
                                                            disabled={savingId === incident._id}
                                                            className="rounded-2xl bg-primary-dark px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
                                                        >
                                                            {savingId === incident._id ? 'Saving...' : 'Save Changes'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            className="rounded-2xl border border-border-light bg-white px-5 py-2.5 text-[13px] font-semibold text-primary-dark transition hover:bg-bg-soft"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="mt-1 text-[13px] text-text-gray">
                                                        {incident.description || 'No description provided.'}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-text-gray">
                                                        <span className="inline-flex items-center gap-1">
                                                            <CalendarClock size={12} />
                                                            {formatDateTime(incident.incidentDate)}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {incident.zone?.name || 'Unknown Zone'}
                                                        </span>
                                                        <span>Severity: {incident.severity}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {!isEditing && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => beginEdit(incident)}
                                                    className="inline-flex items-center gap-1 rounded-xl border border-border-light bg-white px-3 py-2 text-[12px] font-semibold text-primary-dark transition hover:bg-bg-soft"
                                                >
                                                    <Pencil size={13} />
                                                    Update
                                                </button>
                                               
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Pagination footer */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3">
                                <p className="text-[12px] text-text-gray">
                                    Showing{' '}
                                    <span className="font-semibold text-primary-dark">
                                        {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredIncidents.length)}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-semibold text-primary-dark">{filteredIncidents.length}</span>
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                        .reduce((acc, p, idx, arr) => {
                                            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((item, idx) =>
                                            item === '…' ? (
                                                <span key={`ellipsis-${idx}`} className="px-1 text-[12px] text-text-gray">…</span>
                                            ) : (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => setCurrentPage(item)}
                                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border text-[12px] font-semibold transition ${
                                                        safePage === item
                                                            ? 'border-primary-dark bg-primary-dark text-white'
                                                            : 'border-border-light bg-white text-primary-dark hover:bg-bg-soft'
                                                    }`}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        )}

                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={safePage === totalPages}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RangerMyIncidentsPage;
