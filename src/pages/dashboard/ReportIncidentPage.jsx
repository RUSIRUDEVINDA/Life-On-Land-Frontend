import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ImagePlus, LoaderCircle, LocateFixed, MapPin, Send, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
    createIncident,
    fetchProtectedAreas,
    fetchZonesByProtectedArea,
} from '../../features/incidents/api/incidentsApi';

const incidentTypes = ['POACHING', 'ILLEGAL_LOGGING', 'WILDLIFE_TRADE', 'HABITAT_DESTRUCTION', 'OTHER'];
const severityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const MAX_IMAGES = 2;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.78;

const toDateTimeLocal = (value) => {
    const date = new Date(value);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const compressImage = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = () => reject(new Error(`Failed to decode ${file.name}`));
            img.onload = () => {
                let { width, height } = img;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width >= height) {
                        height = Math.round((height * MAX_DIMENSION) / width);
                        width = MAX_DIMENSION;
                    } else {
                        width = Math.round((width * MAX_DIMENSION) / height);
                        height = MAX_DIMENSION;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

const ReportIncidentPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        type: '',
        description: '',
        protectedAreaId: '',
        zoneId: '',
        incidentDate: toDateTimeLocal(new Date().toISOString()),
        severity: 'MEDIUM',
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
            setTimeout(() => navigate('/dashboard/incidents'), 900);
        } catch (requestError) {
            if (handleUnauthorized(requestError.message)) return;
            setError(requestError.message || 'Failed to submit incident');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl py-2">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Report Incident</h1>
                    <p className="mt-1 text-[14px] text-text-gray">
                        Fill this form to save a new incident directly to the backend database.
                    </p>
                </div>
                <Link
                    to="/dashboard/incidents"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border-light bg-white px-4 py-2.5 text-[13px] font-semibold text-primary-dark shadow-premium transition hover:bg-bg-soft"
                >
                    <ChevronLeft size={14} />
                    Back to Incidents
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[30px] border border-border-light bg-white p-6 shadow-premium">
                <div className="grid gap-5 md:grid-cols-2">
                    <label className="flex flex-col gap-2">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Type</span>
                        <select
                            value={formData.type}
                            onChange={handleChange('type')}
                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                        >
                            {incidentTypes.map((option) => (
                                <option key={option} value={option}>
                                    {option.replaceAll('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Severity</span>
                        <select
                            value={formData.severity}
                            onChange={handleChange('severity')}
                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                        >
                            {severityLevels.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Protected Area</span>
                        <select
                            value={formData.protectedAreaId}
                            onChange={handleChange('protectedAreaId')}
                            disabled={loadingAreas}
                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <option value="">{loadingAreas ? 'Loading areas...' : 'Select protected area'}</option>
                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Zone</span>
                        <select
                            value={formData.zoneId}
                            onChange={handleChange('zoneId')}
                            disabled={!formData.protectedAreaId || loadingZones}
                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <option value="">
                                {!formData.protectedAreaId
                                    ? 'Select protected area first'
                                    : loadingZones
                                      ? 'Loading zones...'
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
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Incident Date & Time</span>
                        <input
                            type="datetime-local"
                            value={formData.incidentDate}
                            max={nowDateTimeLocal}
                            onChange={handleChange('incidentDate')}
                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                        />
                    </label>

                    <div className="flex flex-col gap-3 md:col-span-2">
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

                    <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Description</span>
                        <textarea
                            rows={5}
                            value={formData.description}
                            onChange={handleChange('description')}
                            placeholder="Describe what happened, location clues, and any immediate safety concerns."
                            className="resize-y rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                        />
                        <span className="text-[11px] text-text-gray">
                            Minimum 10 characters. Provide clear, actionable detail.
                        </span>
                    </label>

                    <div className="flex flex-col gap-3 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                Evidence Images (optional)
                            </span>
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
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-light bg-bg-soft py-5 text-[13px] font-semibold text-primary-dark transition hover:border-primary-medium hover:bg-white"
                            >
                                <ImagePlus size={16} className="text-primary" />
                                {evidenceImages.length === 0 ? 'Upload Evidence Images' : 'Add Another Image'}
                            </button>
                        )}

                        <span className="text-[11px] text-text-gray">
                            Upload up to {MAX_IMAGES} images (JPG, PNG, WebP, GIF). Images are stored as evidence with the incident.
                        </span>
                    </div>

                    <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Notes (optional)</span>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange('notes')}
                            placeholder="Any additional context for investigators."
                            className="resize-y rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                        />
                    </label>
                </div>

                {error && (
                    <div className="mt-5 rounded-xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a]">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-5 rounded-xl border border-[#2b8a3e]/30 bg-[#ebfbee] px-4 py-3 text-[13px] text-[#2b8a3e]">
                        {success}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary-dark px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={14} />}
                        {submitting ? 'Submitting...' : 'Submit Incident'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportIncidentPage;
