import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Search, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers } from '../../features/users/api/usersApi';

const ROLES = ['ALL', 'ADMIN', 'RANGER'];

const ROLE_STYLES = {
    ADMIN: {
        badge: 'bg-[#f3f0ff] text-[#6741d9] border border-[#d0bfff]',
        dot: 'bg-[#6741d9]',
    },
    RANGER: {
        badge: 'bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7]',
        dot: 'bg-[#2e7d32]',
    },
};

const formatDate = (value) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value));
};

const getInitials = (name = '') =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

const AVATAR_COLORS = [
    'bg-[#d0bfff] text-[#4c1d95]',
    'bg-[#a5d6a7] text-[#1b5e20]',
    'bg-[#ffd6a5] text-[#7c3a00]',
    'bg-[#a5c8fa] text-[#0d3670]',
    'bg-[#f9c2c2] text-[#7c0000]',
    'bg-[#c8f9e6] text-[#065f46]',
];

const avatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const StatCard = ({ label, value, icon: Icon, accent }) => (
    <div className="flex items-center gap-4 rounded-[22px] border border-border-light bg-white px-5 py-4 shadow-premium">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">{label}</p>
            <p className="mt-0.5 text-[22px] font-bold leading-none text-primary-dark">{value}</p>
        </div>
    </div>
);

const UsersPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchAllUsers();
                setUsers(data);
            } catch (err) {
                if (err.message?.toLowerCase().includes('unauthorized')) {
                    navigate('/login');
                    return;
                }
                setError(err.message || 'Failed to load users.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [navigate]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
            const matchSearch =
                !q ||
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.phone.toLowerCase().includes(q);
            return matchRole && matchSearch;
        });
    }, [users, search, roleFilter]);

    const totalAdmins = useMemo(() => users.filter((u) => u.role === 'ADMIN').length, [users]);
    const totalRangers = useMemo(() => users.filter((u) => u.role === 'RANGER').length, [users]);

    return (
        <div className="mx-auto w-full max-w-6xl py-2">
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Users</h1>
                <p className="mt-1 text-[14px] text-text-gray">
                    All registered system users and their roles.
                </p>
            </div>

            {/* Stats */}
            <div className="mb-5 grid grid-cols-3 gap-4">
                <StatCard
                    label="Total Users"
                    value={loading ? '—' : users.length}
                    icon={Users}
                    accent="bg-[#f3f0ff] text-[#6741d9]"
                />
                <StatCard
                    label="Admins"
                    value={loading ? '—' : totalAdmins}
                    icon={ShieldCheck}
                    accent="bg-[#f3f0ff] text-[#6741d9]"
                />
                <StatCard
                    label="Rangers"
                    value={loading ? '—' : totalRangers}
                    icon={Users}
                    accent="bg-[#e8f5e9] text-[#2e7d32]"
                />
            </div>

            {/* Controls */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border-light bg-white px-4 py-2.5 shadow-premium min-w-[220px]">
                    <Search size={14} className="shrink-0 text-text-gray" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or phone..."
                        className="w-full bg-transparent text-[13px] text-primary-dark outline-none placeholder:text-text-gray"
                    />
                </div>

                <div className="flex gap-1.5 rounded-2xl border border-border-light bg-white p-1 shadow-premium">
                    {ROLES.map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRoleFilter(r)}
                            className={`rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${
                                roleFilter === r
                                    ? 'bg-primary-dark text-white'
                                    : 'text-text-gray hover:text-primary-dark'
                            }`}
                        >
                            {r === 'ALL' ? 'All Roles' : r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-[26px] border border-border-light bg-white shadow-premium overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-text-gray">
                        <LoaderCircle size={16} className="animate-spin" />
                        Loading users...
                    </div>
                ) : error ? (
                    <div className="px-6 py-10 text-center">
                        <p className="text-[13px] text-[#a4161a]">{error}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <Users size={32} className="mx-auto mb-3 text-border-light" />
                        <p className="text-[14px] font-semibold text-primary-dark">No users found</p>
                        <p className="mt-1 text-[12px] text-text-gray">
                            {search || roleFilter !== 'ALL'
                                ? 'Try adjusting your search or filter.'
                                : 'No users have been registered yet.'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border-light bg-bg-soft">
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-text-gray">
                                    User
                                </th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-text-gray">
                                    Email
                                </th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-text-gray">
                                    Phone
                                </th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-text-gray">
                                    Role
                                </th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-text-gray">
                                    Date Joined
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {filtered.map((user) => {
                                const style = ROLE_STYLES[user.role] ?? ROLE_STYLES.RANGER;
                                const initials = getInitials(user.name);
                                const colorClass = avatarColor(user.name);
                                return (
                                    <tr
                                        key={user.id}
                                        className="transition hover:bg-bg-soft"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${colorClass}`}
                                                >
                                                    {initials || '?'}
                                                </div>
                                                <span className="text-[13px] font-semibold text-primary-dark">
                                                    {user.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-[13px] text-text-gray">
                                            {user.email}
                                        </td>
                                        <td className="px-5 py-3.5 text-[13px] text-text-gray">
                                            {user.phone || '—'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-[13px] text-text-gray">
                                            {formatDate(user.createdAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="border-t border-border-light px-5 py-3">
                        <p className="text-[11px] text-text-gray">
                            Showing <span className="font-semibold text-primary-dark">{filtered.length}</span> of{' '}
                            <span className="font-semibold text-primary-dark">{users.length}</span> users
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersPage;
