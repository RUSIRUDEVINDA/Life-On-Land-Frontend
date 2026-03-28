import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, LoaderCircle, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
    createIncident,
    fetchProtectedAreas,
    fetchZonesByProtectedArea,
} from '../../features/incidents/api/incidentsApi';

const incidentTypes = ['POACHING', 'ILLEGAL_LOGGING', 'WILDLIFE_TRADE', 'HABITAT_DESTRUCTION', 'OTHER'];
const severityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const toDateTimeLocal = (value) => {
    const date = new Date(value);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const ReportIncidentPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: 'POACHING',
        description: '',
        protectedAreaId: '',
        zoneId: '',
        incidentDate: toDateTimeLocal(new Date().toISOString()),
        severity: 'MEDIUM',
        evidenceUrls: '',
        notes: '',
    });
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
                evidence: formData.evidenceUrls
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                notes: formData.notes.trim() || undefined,
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
                            onChange={handleChange('incidentDate')}
                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                        />
                    </label>

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

                    <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-gray">Evidence URLs (optional)</span>
                        <input
                            type="text"
                            value={formData.evidenceUrls}
                            onChange={handleChange('evidenceUrls')}
                            placeholder="https://file1.jpg, https://file2.mp4"
                            className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                        />
                        <span className="text-[11px] text-text-gray">
                            Add one or more URLs separated by commas.
                        </span>
                    </label>

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
