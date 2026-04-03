import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    ChevronLeft,
    ClipboardList,
    ImagePlus,
    LoaderCircle,
    LocateFixed,
    MapPin,
    Send,
    ShieldCheck,
    X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
    createIncident,
    fetchProtectedAreas,
    fetchZonesByProtectedArea,
} from '../../features/incidents/api/incidentsApi';
import {
    ACCEPTED_TYPES,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_MB,
    MAX_IMAGES,
    compressImage,
} from '../../features/incidents/utils/incidentEvidenceImages';
import { getUserRole } from '../../utils/auth';

const incidentTypes = ['POACHING', 'ILLEGAL_LOGGING', 'WILDLIFE_TRADE', 'HABITAT_DESTRUCTION', 'OTHER'];
const severityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const formatTypeLabel = (t) =>
    String(t || '')
        .split('_')
        .map((w) => (w ? w.charAt(0) + w.slice(1).toLowerCase() : ''))
        .join(' ');

const FieldLabel = ({ children, required: isRequired }) => (
    <span className="flex items-baseline gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-primary-dark/80">
        {children}
        {isRequired ? <span className="text-[#E63946]">*</span> : null}
    </span>
);

const FormSection = ({ step, title, description, children }) => (
    <section className="rounded-[28px] border border-border-light bg-white p-6 shadow-[0_4px_24px_rgba(23,54,43,0.06)] sm:p-8">
        <div className="mb-6 flex flex-col gap-1 border-b border-border-light/80 pb-5 sm:flex-row sm:items-start sm:gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-dark text-[15px] font-bold text-white shadow-sm">
                {step}
            </span>
            <div className="min-w-0 flex-1">
                <h2 className="text-[17px] font-semibold tracking-tight text-primary-dark">{title}</h2>
                {description ? <p className="mt-1 text-[13px] leading-relaxed text-text-gray">{description}</p> : null}
            </div>
        </div>
        {children}
    </section>
);

const toDateTimeLocal = (value) => {
    const date = new Date(value);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const incidentsHubPath = () => (getUserRole() === 'RANGER' ? '/dashboard/my-incidents' : '/dashboard/incidents');

const ReportIncidentPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        type: '',
        description: '',
        protectedAreaId: '',
        zoneId: '',
        incidentDate: toDateTimeLocal(new Date().toISOString()),
        severity: '',
        notes: '',
    });
    const [evidenceImages, setEvidenceImages] = useState([]);
    const [location, setLocation] = useState({ lat: '', lng: '' });
    const [locationMode, setLocationMode] = useState('auto');
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [areas, setAreas] = useState([]);
    const [zones, setZones] = useState([]);
    const [loadingAreas, setLoadingAreas] = useState(true);
    const [loadingZones, setLoadingZones] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleUnauthorized = useCallback((message) => {
        if (message?.toLowerCase().includes('unauthorized')) {
            navigate('/login');
            return true;
        }
        return false;
    }, [navigate]);

    useEffect(() => {
        const loadAreas = async () => {
            setLoadingAreas(true);
            setError('');
            try {
                const data = await fetchProtectedAreas();
                setAreas(data);
            } catch (requestError) {
                if (handleUnauthorized(requestError.message)) return;
                setError(requestError.message || 'Failed to load protected areas');
            } finally {
                setLoadingAreas(false);
            }
        };

        loadAreas();
    }, [handleUnauthorized]);

    useEffect(() => {
        const loadZones = async () => {
            if (!formData.protectedAreaId) {
                setZones([]);
                setFormData((previous) => ({ ...previous, zoneId: '' }));
                return;
            }

            setLoadingZones(true);
            setError('');
            try {
                const data = await fetchZonesByProtectedArea(formData.protectedAreaId);
                setZones(data);
                setFormData((previous) => ({
                    ...previous,
                    zoneId: data.some((zone) => zone.id === previous.zoneId) ? previous.zoneId : '',
                }));
            } catch (requestError) {
                if (handleUnauthorized(requestError.message)) return;
                setZones([]);
                setError(requestError.message || 'Failed to load zones for selected protected area');
            } finally {
                setLoadingZones(false);
            }
        };

        loadZones();
    }, [formData.protectedAreaId, handleUnauthorized]);

    const nowDateTimeLocal = useMemo(() => toDateTimeLocal(new Date().toISOString()), []);

    const canSubmit = useMemo(
        () =>
            formData.type &&
            formData.description.trim().length >= 10 &&
            formData.protectedAreaId &&
            formData.zoneId &&
            formData.incidentDate &&
            formData.severity &&
            !submitting,
        [formData, submitting]
    );

    const handleChange = (field) => (event) => {
        setError('');
        setSuccess('');
        setFormData((previous) => ({
            ...previous,
            [field]: event.target.value,
        }));
    };

    const handleLocationModeChange = (mode) => {
        setLocationMode(mode);
        setLocationError('');
        setLocation({ lat: '', lng: '' });
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser. Please enter coordinates manually.');
            setLocationMode('manual');
            return;
        }
        setLocationLoading(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude.toFixed(6),
                    lng: position.coords.longitude.toFixed(6),
                });
                setLocationLoading(false);
            },
            (geoError) => {
                setLocationLoading(false);
                if (geoError.code === geoError.PERMISSION_DENIED) {
                    setLocationError('Location access was denied. Allow browser location access or switch to manual entry.');
                } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
                    setLocationError('Your current position could not be determined. Try again or enter coordinates manually.');
                } else if (geoError.code === geoError.TIMEOUT) {
                    setLocationError('Location request timed out. Check your GPS/network and try again.');
                } else {
                    setLocationError('Could not detect location. Please enter coordinates manually.');
                }
            },
            { timeout: 12000, maximumAge: 60000 }
        );
    };

    const handleLocationInput = (field) => (event) => {
        setLocationError('');
        setLocation((previous) => ({ ...previous, [field]: event.target.value }));
    };

    const locationGeoJson = useMemo(() => {
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lng);
        if (
            !Number.isNaN(lat) && !Number.isNaN(lng) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180
        ) {
            return { type: 'Point', coordinates: [lng, lat] };
        }
        return null;
    }, [location]);

    const handleImageSelect = async (event) => {
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
                `"${oversized.name}" is too large (${sizeMb} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB per image. Please resize or compress the image before uploading.`
            );
            event.target.value = '';
            return;
        }

        const remaining = MAX_IMAGES - evidenceImages.length;
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
            setEvidenceImages((previous) => [...previous, ...newImages]);
        } catch {
            setError('Failed to process one or more image files. Please try different images.');
        }

        event.target.value = '';
    };

    const removeImage = (id) => {
        setError('');
        setEvidenceImages((previous) => previous.filter((image) => image.id !== id));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!canSubmit) {
            setError('Please complete all fields with valid values before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            await createIncident({
                type: formData.type,
                description: formData.description.trim(),
                zoneId: formData.zoneId,
                protectedAreaId: formData.protectedAreaId,
                incidentDate: new Date(formData.incidentDate).toISOString(),
                severity: formData.severity,
                evidence: evidenceImages.map((image) => image.dataUrl),
                notes: formData.notes.trim() || undefined,
                ...(locationGeoJson ? { location: locationGeoJson } : {}),
            });

            setSuccess('Incident submitted and saved successfully.');
            setTimeout(() => navigate(incidentsHubPath()), 900);
        } catch (requestError) {
            if (handleUnauthorized(requestError.message)) return;
            setError(requestError.message || 'Failed to submit incident');
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass =
        'rounded-2xl border border-border-light bg-bg-soft px-4 py-3.5 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white focus:ring-2 focus:ring-primary-medium/20';

    const incidentsHub = incidentsHubPath();
    const incidentsHubLabel = getUserRole() === 'RANGER' ? 'My incidents' : 'Incident center';

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col">
            <div className="relative mb-8 overflow-hidden rounded-[28px] bg-primary-dark px-6 pb-12 pt-8 text-white shadow-[0_12px_40px_rgba(23,54,43,0.35)] sm:rounded-[32px] sm:px-8 sm:pb-12 sm:pt-10">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '20px 20px',
                    }}
                />
                <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary-medium/25 blur-3xl" />
                <div className="absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

                <div className="relative">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                                aria-label="Go back"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <div className="min-w-0">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                                    <ClipboardList size={12} className="opacity-90" />
                                    Official incident report
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    
                                    <div>
                                        <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">
                                            Report an incident
                                        </h1>
                                        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/75">
                                            Accurate location and severity help prioritize the response.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Link
                            to={incidentsHub}
                            className="shrink-0 self-start rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/20"
                        >
                            {incidentsHubLabel}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="w-full space-y-6 pb-10">
                <div className="flex gap-3 rounded-2xl border border-primary-medium/20 bg-gradient-to-r from-primary-light/25 to-white px-4 py-3.5 shadow-sm">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" strokeWidth={2} />
                    <p className="text-[13px] leading-relaxed text-primary-dark">
                        <span className="font-semibold">Secure submission.</span> Your report is recorded for operations and
                        investigation. Fields marked with <span className="text-[#E63946]">*</span> are required before you can
                        submit.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <FormSection
                        step={1}
                        title="Classification"
                        description="Choose the incident type and severity so responders can triage correctly."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="flex flex-col gap-2">
                                <FieldLabel required>Incident type</FieldLabel>
                                <select
                                    value={formData.type}
                                    onChange={handleChange('type')}
                                    className={inputClass}
                                >
                                    <option value="">Select type</option>
                                    {incidentTypes.map((option) => (
                                        <option key={option} value={option}>
                                            {formatTypeLabel(option)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col gap-2">
                                <FieldLabel required>Severity</FieldLabel>
                                <select
                                    value={formData.severity}
                                    onChange={handleChange('severity')}
                                    className={inputClass}
                                >
                                    <option value="">Select severity</option>
                                    {severityLevels.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </FormSection>

                    <FormSection
                        step={2}
                        title="Site & time"
                        description="Tie the report to a protected area and zone, and when the event occurred or was observed."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="flex flex-col gap-2">
                                <FieldLabel required>Protected area</FieldLabel>
                                <select
                                    value={formData.protectedAreaId}
                                    onChange={handleChange('protectedAreaId')}
                                    disabled={loadingAreas}
                                    className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
                                >
                                    <option value="">{loadingAreas ? 'Loading areas…' : 'Select protected area'}</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.id}>
                                            {area.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col gap-2">
                                <FieldLabel required>Zone</FieldLabel>
                                <select
                                    value={formData.zoneId}
                                    onChange={handleChange('zoneId')}
                                    disabled={!formData.protectedAreaId || loadingZones}
                                    className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
                                >
                                    <option value="">
                                        {!formData.protectedAreaId
                                            ? 'Select protected area first'
                                            : loadingZones
                                              ? 'Loading zones…'
                                              : 'Select zone'}
                                    </option>
                                    {zones.map((zone) => (
                                        <option key={zone.id} value={zone.id}>
                                            {zone.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col gap-2 md:col-span-2">
                                <FieldLabel required>Incident date &amp; time</FieldLabel>
                                <input
                                    type="datetime-local"
                                    value={formData.incidentDate}
                                    max={nowDateTimeLocal}
                                    onChange={handleChange('incidentDate')}
                                    className={inputClass}
                                />
                            </label>
                        </div>
                    </FormSection>

                    <FormSection
                        step={3}
                        title="Geographic reference"
                        description="Optional GPS coordinates help teams locate the scene on the map. You can detect your position or enter coordinates manually."
                    >
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                Incident Location
                                <span className="ml-1.5 font-normal normal-case text-[11px]">(optional)</span>
                            </span>
                            {locationGeoJson && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#2b8a3e]">
                                    <MapPin size={11} />
                                    Location set
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 rounded-2xl border border-border-light bg-bg-soft p-1">
                            <button
                                type="button"
                                onClick={() => handleLocationModeChange('auto')}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition ${locationMode === 'auto' ? 'bg-white text-primary-dark shadow-sm' : 'text-text-gray hover:text-primary-dark'}`}
                            >
                                <LocateFixed size={13} />
                                Detect My Location
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLocationModeChange('manual')}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition ${locationMode === 'manual' ? 'bg-white text-primary-dark shadow-sm' : 'text-text-gray hover:text-primary-dark'}`}
                            >
                                <MapPin size={13} />
                                Enter Manually
                            </button>
                        </div>

                        {locationMode === 'auto' && (
                            <div className="flex flex-col gap-2">
                                {locationGeoJson ? (
                                    <div className="flex items-center justify-between rounded-2xl border border-[#2b8a3e]/30 bg-[#ebfbee] px-4 py-3">
                                        <div className="flex items-center gap-2 text-[13px] text-[#2b8a3e]">
                                            <MapPin size={14} />
                                            <span className="font-semibold">
                                                {location.lat}°, {location.lng}°
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLocation({ lat: '', lng: '' })}
                                            className="text-[11px] font-semibold text-text-gray hover:text-[#E63946] transition"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={detectLocation}
                                        disabled={locationLoading}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border-light bg-bg-soft py-3.5 text-[13px] font-semibold text-primary-dark transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {locationLoading ? (
                                            <LoaderCircle size={14} className="animate-spin" />
                                        ) : (
                                            <LocateFixed size={14} />
                                        )}
                                        {locationLoading ? 'Detecting location...' : 'Use My Current Location'}
                                    </button>
                                )}
                                {locationError && (
                                    <p className="text-[11px] text-[#a4161a]">{locationError}</p>
                                )}
                            </div>
                        )}

                        {locationMode === 'manual' && (
                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-semibold text-text-gray">Latitude</span>
                                        <input
                                            type="number"
                                            step="any"
                                            min="-90"
                                            max="90"
                                            value={location.lat}
                                            onChange={handleLocationInput('lat')}
                                            placeholder="e.g. 6.927079"
                                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-semibold text-text-gray">Longitude</span>
                                        <input
                                            type="number"
                                            step="any"
                                            min="-180"
                                            max="180"
                                            value={location.lng}
                                            onChange={handleLocationInput('lng')}
                                            placeholder="e.g. 79.861244"
                                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                        />
                                    </label>
                                </div>
                                {locationError && (
                                    <p className="text-[11px] text-[#a4161a]">{locationError}</p>
                                )}
                                {locationGeoJson && (
                                    <p className="flex items-center gap-1 text-[11px] font-semibold text-[#2b8a3e]">
                                        <MapPin size={11} />
                                        Valid coordinates — will be saved with the incident.
                                    </p>
                                )}
                                {(location.lat || location.lng) && !locationGeoJson && (
                                    <p className="text-[11px] text-[#a4161a]">
                                        Latitude must be between −90 and 90, longitude between −180 and 180.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    </FormSection>

                    <FormSection
                        step={4}
                        title="Narrative & evidence"
                        description="Describe what happened, attach photos if safe to do so, and add any extra notes for investigators."
                    >
                    <label className="flex flex-col gap-2">
                        <FieldLabel required>Description</FieldLabel>
                        <textarea
                            rows={6}
                            value={formData.description}
                            onChange={handleChange('description')}
                            placeholder="Describe what happened, location clues, and any immediate safety concerns."
                            className={`${inputClass} min-h-[140px] resize-y`}
                        />
                        <span className="text-[11px] text-text-gray">
                            Minimum 10 characters. Clear, actionable detail helps teams respond faster.
                        </span>
                    </label>

                    <div className="mt-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <FieldLabel>Evidence images (optional)</FieldLabel>
                            <span className={`text-[11px] font-semibold ${evidenceImages.length >= MAX_IMAGES ? 'text-[#E63946]' : 'text-text-gray'}`}>
                                {evidenceImages.length} / {MAX_IMAGES}
                            </span>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            multiple
                            className="hidden"
                            onChange={handleImageSelect}
                        />

                        {evidenceImages.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {evidenceImages.map((image) => (
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
                                                onClick={() => removeImage(image.id)}
                                                className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#E63946] transition hover:bg-white"
                                                title="Remove image"
                                            >
                                                <X size={14} />
                                            </button>
                                            <p className="truncate text-[11px] font-medium text-white">{image.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {evidenceImages.length < MAX_IMAGES && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-medium/35 bg-primary-light/10 py-5 text-[13px] font-semibold text-primary-dark transition hover:border-primary-medium hover:bg-white hover:shadow-sm"
                            >
                                <ImagePlus size={16} className="text-primary" />
                                {evidenceImages.length === 0 ? 'Upload Evidence Images' : 'Add Another Image'}
                            </button>
                        )}

                        <span className="text-[11px] text-text-gray">
                            Upload up to {MAX_IMAGES} images (JPG, PNG, WebP, GIF). Images are stored as evidence with the incident.
                        </span>
                    </div>

                    <label className="mt-5 flex flex-col gap-2">
                        <FieldLabel>Notes (optional)</FieldLabel>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange('notes')}
                            placeholder="Any additional context for investigators."
                            className={`${inputClass} resize-y`}
                        />
                    </label>
                    </FormSection>

                {error && (
                    <div className="rounded-2xl border border-[#E63946]/35 bg-[#fff5f5] px-4 py-3.5 text-[13px] text-[#a4161a] shadow-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-2xl border border-[#2b8a3e]/35 bg-[#ebfbee] px-4 py-3.5 text-[13px] font-medium text-[#2b8a3e] shadow-sm">
                        {success}
                    </div>
                )}

                <div className="sticky bottom-0 z-[1] flex w-full flex-col gap-3 rounded-[28px] border border-border-light bg-white/95 p-5 shadow-[0_-8px_32px_rgba(23,54,43,0.08)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-text-gray">
                        {submitting
                            ? 'Submitting your report…'
                            : canSubmit
                              ? 'Ready to submit. After a successful save you will be taken back to your incident list.'
                              : 'Complete all required fields (marked with *) to enable submission.'}
                    </p>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-primary-dark px-8 py-3.5 text-[14px] font-semibold text-white shadow-md transition hover:bg-black hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                        {submitting ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={17} />}
                        {submitting ? 'Submitting…' : 'Submit incident report'}
                    </button>
                </div>
            </form>
            </div>
        </div>
    );
};

export default ReportIncidentPage;
