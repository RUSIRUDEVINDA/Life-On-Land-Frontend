import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Mail, Phone, Shield, UserRound } from 'lucide-react';
import { fetchMyProfile, updateMyProfile } from '../../features/users/api/usersApi';

const createFormState = (profile) => ({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    role: profile?.role || 'RANGER',
});

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(createFormState(null));
    const [initialForm, setInitialForm] = useState(createFormState(null));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
    const editableFields = useMemo(
        () => (isAdmin ? ['name', 'email', 'phone', 'role'] : ['name', 'phone']),
        [isAdmin]
    );
    const hasChanges = editableFields.some((field) => String(form[field] || '') !== String(initialForm[field] || ''));

    const handleChange = (field) => (event) => {
        const value = event.target.value;
        setForm((previous) => ({ ...previous, [field]: value }));
        setSuccess('');
    };

    const handleReset = () => {
        setForm(initialForm);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        const payload = {
            name: form.name.trim(),
            phone: form.phone.trim(),
            ...(isAdmin
                ? {
                      email: form.email.trim(),
                      role: String(form.role || 'RANGER').trim().toUpperCase(),
                  }
                : {}),
        };

        try {
            const updatedProfile = await updateMyProfile(payload);
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
            <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-border-light bg-white shadow-premium">
                <div className="flex items-center gap-2 text-[13px] text-text-gray">
                    <LoaderCircle size={15} className="animate-spin" />
                    Loading your profile...
                </div>
            </div>
        );
    }

    if (!profile && error) {
        return (
            <div className="rounded-[24px] border border-[#E63946]/30 bg-[#fff5f5] px-5 py-4 text-[13px] text-[#a4161a]">
                {error}
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl py-2">
            <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">My Profile</h1>
            <p className="mt-1 text-[14px] text-text-gray">
                {isAdmin
                    ? 'Admins can update all profile details.'
                    : 'Rangers can update only their name and phone number.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 rounded-[28px] border border-border-light bg-white p-6 shadow-premium">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                        <UserRound size={22} />
                    </div>
                    <div>
                        <p className="text-[18px] font-semibold text-primary-dark">{form.name || 'Unknown User'}</p>
                        <p className="text-[12px] text-text-gray">Personal account details</p>
                    </div>
                </div>

                {(error || success) && (
                    <div
                        className={`mb-4 rounded-2xl px-4 py-3 text-[13px] ${
                            error
                                ? 'border border-[#E63946]/30 bg-[#fff5f5] text-[#a4161a]'
                                : 'border border-[#2b8a3e]/20 bg-[#ebfbee] text-[#1b5e20]'
                        }`}
                    >
                        {error || success}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <label className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Name</p>
                        <input
                            type="text"
                            value={form.name}
                            onChange={handleChange('name')}
                            className="mt-2 w-full rounded-xl border border-border-light bg-white px-3 py-2 text-[14px] font-medium text-primary-dark outline-none transition focus:border-primary-medium"
                            placeholder="Enter your name"
                        />
                    </label>

                    <label className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Role</p>
                        {isAdmin ? (
                            <select
                                value={form.role}
                                onChange={handleChange('role')}
                                className="mt-2 w-full rounded-xl border border-border-light bg-white px-3 py-2 text-[14px] font-semibold text-primary-dark outline-none transition focus:border-primary-medium"
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="RANGER">RANGER</option>
                            </select>
                        ) : (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-border-light bg-white px-3 py-2 text-[14px] font-semibold text-primary-dark">
                                <Shield size={14} />
                                {profile?.role || 'RANGER'}
                            </div>
                        )}
                    </label>

                    <label className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Email</p>
                        {isAdmin ? (
                            <input
                                type="email"
                                value={form.email}
                                onChange={handleChange('email')}
                                className="mt-2 w-full rounded-xl border border-border-light bg-white px-3 py-2 text-[14px] font-medium text-primary-dark outline-none transition focus:border-primary-medium"
                                placeholder="Enter your email"
                            />
                        ) : (
                            <div className="mt-2 inline-flex w-full items-center gap-1.5 rounded-xl border border-border-light bg-white px-3 py-2 text-[14px] font-medium text-primary-dark">
                                <Mail size={14} />
                                <span className="break-all">{profile?.email || 'Not provided'}</span>
                            </div>
                        )}
                    </label>

                    <label className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Phone</p>
                        <div className="mt-2 flex items-center rounded-xl border border-border-light bg-white px-3 py-2">
                            <Phone size={14} className="mr-2 shrink-0 text-primary-dark" />
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={handleChange('phone')}
                                className="w-full bg-transparent text-[14px] font-medium text-primary-dark outline-none"
                                placeholder="+94771234567"
                            />
                        </div>
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={saving || !hasChanges}
                        className="rounded-2xl border border-border-light bg-white px-4 py-2.5 text-[13px] font-semibold text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !hasChanges}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary-dark px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? <LoaderCircle size={15} className="animate-spin" /> : null}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;
