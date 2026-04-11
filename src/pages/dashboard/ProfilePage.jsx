import React, { useEffect, useMemo, useState } from 'react';
import {
    BadgeCheck,
    CalendarDays,
    LoaderCircle,
    Mail,
    Phone,
    Shield,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { fetchMyProfile, updateMyProfile } from '../../features/users/api/usersApi';
import { validateProfileFields } from '../../utils/authFormValidation';

const ProfileFieldError = ({ id, message }) =>
    message ? (
        <p id={id} className="mt-1.5 text-[12px] font-medium text-[#a4161a]" role="alert">
            {message}
        </p>
    ) : null;

const fieldInputClass = (base, hasError) =>
    `${base} ${hasError ? 'border-[#E63946]/55 ring-1 ring-[#E63946]/20 focus:border-[#E63946] focus:ring-[#E63946]/25' : ''}`.trim();

/** Strip Sri Lanka country code for profile phone display (+94 / 94 / 0094). */
const stripLkCountryCode = (phone) => {
    let s = String(phone ?? '').trim().replace(/\s+/g, '');
    if (!s) return '';
    if (s.startsWith('+')) s = s.slice(1);
    if (s.startsWith('0094')) s = s.slice(4);
    else if (s.startsWith('94')) s = s.slice(2);
    return s;
};

/** National 10-digit display: after +94 strip, prepend trunk 0 when only 9 digits remain (e.g. 7529… → 07529…). */
const formatProfilePhoneDisplay = (phone) => {
    const s = stripLkCountryCode(phone);
    if (!s) return '';
    if (/^0\d{9}$/.test(s)) return s;
    if (/^\d{9}$/.test(s)) return `0${s}`;
    return s;
};

const createFormState = (profile) => ({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: formatProfilePhoneDisplay(profile?.phone),
    role: profile?.role || 'RANGER',
    profilePhoto: null,
});

const getInitials = (name = '') =>
    name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || '?';

const ROLE_VISUAL = {
    ADMIN: {
        gradient: 'from-violet-500 via-violet-600 to-indigo-700',
        pill: 'bg-violet-100 text-violet-800 border-violet-200/80',
        ring: 'ring-violet-400/40',
    },
    RANGER: {
        gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
        pill: 'bg-emerald-100 text-emerald-900 border-emerald-200/80',
        ring: 'ring-emerald-400/40',
    },
};

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(createFormState(null));
    const [initialForm, setInitialForm] = useState(createFormState(null));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await fetchMyProfile();
                const nextForm = createFormState(data);
                setProfile(data);
                setForm(nextForm);
                setInitialForm(nextForm);
            } catch (requestError) {
                setError(requestError.message || 'Failed to load your profile');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const isAdmin = String(profile?.role || '').toUpperCase() === 'ADMIN';
    const roleKey = isAdmin ? 'ADMIN' : 'RANGER';
    const roleStyle = ROLE_VISUAL[roleKey];

    const editableFields = useMemo(
        () => (isAdmin ? ['name', 'email', 'phone', 'role', 'profilePhoto'] : ['name', 'phone', 'profilePhoto']),
        [isAdmin]
    );
    const hasChanges = editableFields.some((field) => {
        if (field === 'profilePhoto') return !!form.profilePhoto;
        return String(form[field] || '') !== String(initialForm[field] || '');
    });

    const memberSinceLabel = useMemo(() => {
        if (!profile?.createdAt) return null;
        try {
            return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(
                new Date(profile.createdAt)
            );
        } catch {
            return null;
        }
    }, [profile?.createdAt]);

    const clearFieldError = (field) => {
        setFieldErrors((previous) => {
            if (!previous[field]) return previous;
            const next = { ...previous };
            delete next[field];
            return next;
        });
    };

    const handleChange = (field) => (event) => {
        const { value, type, files } = event.target;
        setForm((previous) => ({ ...previous, [field]: type === 'file' ? files[0] : value }));
        setSuccess('');
        if (field !== 'profilePhoto') clearFieldError(field);
    };

    const handleReset = () => {
        setForm(initialForm);
        setError('');
        setSuccess('');
        setFieldErrors({});
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        const clientErrors = validateProfileFields({
            name: form.name,
            phone: form.phone,
            email: form.email,
            isAdmin,
        });
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }
        setFieldErrors({});

        setSaving(true);

        const phoneDigits = form.phone.replace(/\D/g, '');
        const hasPhoto = Boolean(form.profilePhoto);
        let data;

        if (hasPhoto) {
            data = new FormData();
            data.append('name', form.name.trim());
            data.append('phone', phoneDigits);
            data.append('profilePhoto', form.profilePhoto);
            if (isAdmin) {
                data.append('email', form.email.trim());
                data.append('role', String(form.role || 'RANGER').trim().toUpperCase());
            }
        } else {
            data = {
                name: form.name.trim(),
                phone: phoneDigits,
            };
            if (isAdmin) {
                data.email = form.email.trim();
                data.role = String(form.role || 'RANGER').trim().toUpperCase();
            }
        }

        try {
            const updatedProfile = await updateMyProfile(data);
            const nextForm = createFormState(updatedProfile);
            setProfile(updatedProfile);
            setForm(nextForm);
            setInitialForm(nextForm);
            setSuccess('Profile updated successfully.');
        } catch (requestError) {
            setError(requestError.message || 'Failed to update your profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-5xl min-h-[min(420px,70vh)] flex-col items-center justify-center gap-5 rounded-[28px] border border-border-light bg-gradient-to-b from-white via-bg-soft/40 to-primary-light/10 px-6 py-16 shadow-premium">
                <div
                    className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-dark to-primary-medium shadow-[0_12px_32px_rgba(23,54,43,0.25)] ring-4 ring-primary-medium/15"
                    aria-hidden
                >
                    <LoaderCircle size={32} className="animate-spin text-white" strokeWidth={2} />
                </div>
                <div className="text-center">
                    <p className="text-[16px] font-semibold text-primary-dark">Loading your profile</p>
                    <p className="mt-1 text-[13px] text-text-gray">Fetching your account from EcoTrack…</p>
                </div>
            </div>
        );
    }

    if (!profile && error) {
        return (
            <div className="mx-auto max-w-5xl rounded-[24px] border border-[#E63946]/35 bg-gradient-to-br from-[#fff5f5] to-white px-6 py-5 text-[13px] text-[#a4161a] shadow-premium">
                {error}
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl py-2 pb-8">
            <section className="relative mb-8 overflow-hidden rounded-[28px] bg-primary-dark px-6 py-10 text-white shadow-[0_16px_48px_rgba(23,54,43,0.38)] sm:px-8 sm:py-11">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '22px 22px',
                    }}
                />
                <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary-medium/35 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
                            <Sparkles size={13} className="text-amber-200" />
                            Account center
                        </div>
                        <h1 className="mt-4 text-[32px] font-bold tracking-tight sm:text-[38px]">My profile</h1>
                        <p className="mt-2 text-[14px] leading-relaxed text-white/78">
                            {isAdmin
                                ? 'Manage your EcoTrack identity. Admins can update name, email, phone, and role.'
                                : 'Keep your field identity up to date. Rangers can edit name and phone; email and role are managed by an administrator.'}
                        </p>
                    </div>
                    {memberSinceLabel ? (
                        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 backdrop-blur-md">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-amber-200">
                                <CalendarDays size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                                    Member since
                                </p>
                                <p className="text-[15px] font-bold tracking-tight">{memberSinceLabel}</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
                <aside className="rounded-[26px] border border-border-light bg-white p-6 shadow-premium lg:sticky lg:top-6">
                    <div className="pointer-events-none mb-5 h-1 w-full rounded-full bg-gradient-to-r from-primary-medium via-emerald-400 to-cyan-500 opacity-90" />
                    <div className="flex flex-col items-center text-center">
                        <div
                            className={`relative mb-4 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-2xl text-[26px] font-bold text-white shadow-lg ring-4 ${roleStyle.ring} ${!profile?.profilePhoto ? roleStyle.gradient : ''}`}
                        >
                            {profile?.profilePhoto ? (
                                <img src={profile.profilePhoto} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
                            ) : getInitials(form.name)}

                            <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-primary-dark text-white shadow-md">
                                <BadgeCheck size={16} strokeWidth={2.5} />
                            </span>
                        </div>
                        <h2 className="text-[18px] font-bold tracking-tight text-primary-dark">
                            {form.name || 'Your name'}
                        </h2>
                        <p className="mt-1 text-[12px] text-text-gray">Signed in to EcoTrack</p>
                        <span
                            className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide ${roleStyle.pill}`}
                        >
                            <Shield size={13} />
                            {profile?.role || 'RANGER'}
                        </span>
                        <ul className="mt-6 w-full space-y-2.5 border-t border-border-light pt-5 text-left text-[12px] text-text-gray">
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                Profile changes sync across the dashboard immediately after save.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                                Use a reachable phone number for patrol and alert coordination.
                            </li>
                        </ul>
                    </div>
                </aside>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-[26px] border border-border-light bg-white p-6 shadow-premium sm:p-8"
                >
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border-light pb-5">
                        <div>
                            <h3 className="text-[17px] font-bold text-primary-dark">Contact &amp; identity</h3>
                            <p className="mt-1 text-[12px] text-text-gray">
                                Fields marked with your role determine what you can edit.
                            </p>
                        </div>
                    </div>

                    {(error || success) && (
                        <div
                            className={`mb-6 rounded-2xl border px-4 py-3 text-[13px] font-medium ${
                                error
                                    ? 'border-[#E63946]/35 bg-gradient-to-r from-[#fff5f5] to-white text-[#a4161a]'
                                    : 'border-emerald-300/50 bg-gradient-to-r from-[#ebfbee] to-white text-[#1b5e20]'
                            }`}
                            role="status"
                        >
                            {error || success}
                        </div>
                    )}

                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="group rounded-2xl border border-border-light bg-gradient-to-br from-white to-primary-light/10 p-4 transition hover:border-primary-medium/40 hover:shadow-sm md:col-span-2">
                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light/30 text-primary-dark">
                                    <Sparkles size={18} strokeWidth={2} />
                                </span>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                    Update Profile Photo
                                </p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleChange('profilePhoto')}
                                className="w-full rounded-xl border border-border-light bg-white px-3.5 py-2 text-[13px] font-medium text-primary-dark outline-none transition file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                            />
                        </label>

                        <label className="group rounded-2xl border border-border-light bg-gradient-to-br from-white to-emerald-50/40 p-4 transition hover:border-emerald-300/60 hover:shadow-sm">

                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                                    <UserRound size={18} strokeWidth={2} />
                                </span>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                    Full name
                                </p>
                            </div>
                            <input
                                id="profile-name"
                                type="text"
                                value={form.name}
                                onChange={handleChange('name')}
                                className={fieldInputClass(
                                    'w-full rounded-xl border border-border-light bg-white px-3.5 py-2.5 text-[14px] font-medium text-primary-dark outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15',
                                    Boolean(fieldErrors.name)
                                )}
                                placeholder="Enter your name"
                                aria-invalid={Boolean(fieldErrors.name)}
                                aria-describedby={fieldErrors.name ? 'profile-name-error' : undefined}
                            />
                            <ProfileFieldError id="profile-name-error" message={fieldErrors.name} />
                        </label>

                        <label className="group rounded-2xl border border-border-light bg-gradient-to-br from-white to-violet-50/35 p-4 transition hover:border-violet-200/80 hover:shadow-sm">
                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                                    <Shield size={18} strokeWidth={2} />
                                </span>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                    Role
                                </p>
                            </div>
                            {isAdmin ? (
                                <select
                                    value={form.role}
                                    onChange={handleChange('role')}
                                    className="w-full rounded-xl border border-border-light bg-white px-3.5 py-2.5 text-[14px] font-semibold text-primary-dark outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15"
                                >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="RANGER">RANGER</option>
                                </select>
                            ) : (
                                <div className="inline-flex w-full items-center gap-2 rounded-xl border border-border-light bg-white px-3.5 py-2.5 text-[14px] font-semibold text-primary-dark">
                                    <Shield size={15} className="text-violet-600" />
                                    {profile?.role || 'RANGER'}
                                </div>
                            )}
                        </label>

                        <label className="group rounded-2xl border border-border-light bg-gradient-to-br from-white to-sky-50/40 p-4 transition hover:border-sky-200/80 hover:shadow-sm md:col-span-2">
                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                                    <Mail size={18} strokeWidth={2} />
                                </span>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                    Email
                                </p>
                            </div>
                            {isAdmin ? (
                                <>
                                    <input
                                        id="profile-email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange('email')}
                                        className={fieldInputClass(
                                            'w-full rounded-xl border border-border-light bg-white px-3.5 py-2.5 text-[14px] font-medium text-primary-dark outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/15',
                                            Boolean(fieldErrors.email)
                                        )}
                                        placeholder="Enter your email"
                                        aria-invalid={Boolean(fieldErrors.email)}
                                        aria-describedby={fieldErrors.email ? 'profile-email-error' : undefined}
                                    />
                                    <ProfileFieldError id="profile-email-error" message={fieldErrors.email} />
                                </>
                            ) : (
                                <div className="inline-flex w-full items-center gap-2 rounded-xl border border-border-light bg-white px-3.5 py-2.5 text-[14px] font-medium text-primary-dark">
                                    <Mail size={15} className="shrink-0 text-sky-600" />
                                    <span className="break-all">{profile?.email || 'Not provided'}</span>
                                </div>
                            )}
                        </label>

                        <label className="group rounded-2xl border border-border-light bg-gradient-to-br from-white to-amber-50/45 p-4 transition hover:border-amber-200/90 hover:shadow-sm md:col-span-2">
                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                                    <Phone size={18} strokeWidth={2} />
                                </span>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-gray">
                                    Phone
                                </p>
                            </div>
                            <div
                                className={`flex items-center rounded-xl border bg-white px-3.5 py-2.5 transition focus-within:ring-2 ${
                                    fieldErrors.phone
                                        ? 'border-[#E63946]/55 ring-1 ring-[#E63946]/20 focus-within:border-[#E63946] focus-within:ring-[#E63946]/25'
                                        : 'border-border-light focus-within:border-amber-400/50 focus-within:ring-amber-400/15'
                                }`}
                            >
                                <Phone size={9} className="mr-2 shrink-0 text-amber-700" />
                                <input
                                    id="profile-phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange('phone')}
                                    className="w-full bg-transparent text-[14px] font-medium text-primary-dark outline-none"
                                    placeholder="0771234567"
                                    aria-invalid={Boolean(fieldErrors.phone)}
                                    aria-describedby={fieldErrors.phone ? 'profile-phone-error' : undefined}
                                />
                            </div>
                            <ProfileFieldError id="profile-phone-error" message={fieldErrors.phone} />
                        </label>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-border-light pt-6">
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={saving || !hasChanges}
                            className="rounded-2xl border border-border-light bg-white px-5 py-2.5 text-[13px] font-semibold text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !hasChanges}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-dark to-primary-medium px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition hover:from-black hover:to-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
                            Save changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
