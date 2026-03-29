import React, { useEffect, useState } from 'react';
import { LoaderCircle, Mail, Shield, UserRound } from 'lucide-react';
import { fetchMyProfile } from '../../features/users/api/usersApi';

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchMyProfile();
                setProfile(data);
            } catch (requestError) {
                setError(requestError.message || 'Failed to load your profile');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

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

    if (error) {
        return (
            <div className="rounded-[24px] border border-[#E63946]/30 bg-[#fff5f5] px-5 py-4 text-[13px] text-[#a4161a]">
                {error}
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl py-2">
            <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">My Profile</h1>
            <p className="mt-1 text-[14px] text-text-gray">Your account information and role.</p>

            <div className="mt-5 rounded-[28px] border border-border-light bg-white p-6 shadow-premium">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                        <UserRound size={22} />
                    </div>
                    <div>
                        <p className="text-[18px] font-semibold text-primary-dark">{profile?.name || 'Unknown User'}</p>
                        <p className="text-[12px] text-text-gray">Personal account details</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Name</p>
                        <p className="mt-1 text-[14px] font-medium text-primary-dark">{profile?.name || '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Role</p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary-dark">
                            <Shield size={14} />
                            {profile?.role || 'RANGER'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border-light bg-bg-soft px-4 py-3 md:col-span-2">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Email</p>
                        <p className="mt-1 inline-flex items-center gap-1.5 break-all text-[14px] font-medium text-primary-dark">
                            <Mail size={14} />
                            {profile?.email || '—'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
