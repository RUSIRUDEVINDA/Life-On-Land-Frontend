import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, Search, ShieldCheck, Users, Trash2, Edit2, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, updateUser, deleteUser } from '../../features/users/api/usersApi';

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

// eslint-disable-next-line no-unused-vars
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
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '', role: 'RANGER' });
    const [isSaving, setIsSaving] = useState(false);

    const [deletingUser, setDeletingUser] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSaving(true);
        try {
            const updated = await updateUser(editingUser.id, editFormData);
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
            setEditingUser(null);
        } catch (err) {
            alert(err.message || 'Failed to update user.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (user) => {
        setDeletingUser(user);
    };

    const handleConfirmDelete = async () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        try {
            await deleteUser(deletingUser.id);
            setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
            setDeletingUser(null);
        } catch (err) {
            alert(err.message || 'Failed to delete user.');
        } finally {
            setIsDeleting(false);
        }
    };

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

    // Reset to page 1 whenever filters change
    useEffect(() => { setCurrentPage(1); }, [search, roleFilter, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(currentPage * pageSize, filtered.length);

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
                            className={`rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${roleFilter === r
                                    ? 'bg-primary-dark text-white'
                                    : 'text-text-gray hover:text-primary-dark'
                                }`}
                        >
                            {r === 'ALL' ? 'All Roles' : r}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-border-light bg-white px-3 py-2 shadow-premium">
                    <span className="text-[12px] text-text-gray">Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="rounded-xl border border-border-light bg-bg-soft px-2.5 py-1 text-[12px] font-medium text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                    >
                        {[10, 20, 30].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    <span className="text-[12px] text-text-gray">per page</span>
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
                                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-text-gray">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedUsers.map((user) => {
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
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-text-gray transition hover:bg-bg-soft hover:text-primary-medium"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-text-gray transition hover:bg-[#ffebea] hover:text-[#d32f2f]"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-border-light px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[12px] text-text-gray">
                            Showing{' '}
                            <span className="font-semibold text-primary-dark">{rangeStart}–{rangeEnd}</span>{' '}
                            of{' '}
                            <span className="font-semibold text-primary-dark">{filtered.length}</span> users
                        </p>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`flex h-8 min-w-[32px] items-center justify-center rounded-xl border px-2 text-[12px] font-semibold transition ${page === currentPage
                                                ? 'border-primary-dark bg-primary-dark text-white'
                                                : 'border-border-light bg-white text-primary-dark hover:bg-bg-soft'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 justify-center items-center flex bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-[26px] bg-white p-6 shadow-premium relative">
                        <button
                            onClick={() => setEditingUser(null)}
                            className="absolute right-6 top-6 text-text-gray hover:text-primary-dark transition"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-[20px] font-bold text-primary-dark mb-4">Edit User</h2>
                        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-gray mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-2xl border border-border-light bg-bg-soft px-4 py-2.5 text-[13px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-gray mb-1.5">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full rounded-2xl border border-border-light bg-bg-soft px-4 py-2.5 text-[13px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                    value={editFormData.email}
                                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-gray mb-1.5">Phone (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full rounded-2xl border border-border-light bg-bg-soft px-4 py-2.5 text-[13px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                    value={editFormData.phone}
                                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-gray mb-1.5">Role</label>
                                <select
                                    required
                                    className="w-full rounded-2xl border border-border-light bg-bg-soft px-4 py-2.5 text-[13px] text-primary-dark outline-none transition focus:border-primary-medium focus:bg-white"
                                    value={editFormData.role}
                                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                                >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="RANGER">RANGER</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="rounded-xl px-5 py-2.5 text-[13px] font-semibold text-text-gray hover:text-primary-dark transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 rounded-xl bg-primary-dark px-6 py-2.5 text-[13px] font-semibold text-white transition hover:bg-primary-medium disabled:opacity-50"
                                >
                                    {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : null}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingUser && (
                <div className="fixed inset-0 z-50 justify-center items-center flex bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-premium relative text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffebea] text-[#d32f2f] mb-4">
                            <AlertTriangle size={24} />
                        </div>
                        <h2 className="text-[20px] font-bold text-primary-dark mb-2">Delete User?</h2>
                        <p className="text-[13px] text-text-gray mb-6">
                            Are you sure you want to delete <strong>{deletingUser.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => setDeletingUser(null)}
                                className="flex-1 rounded-xl px-5 py-3 text-[13px] font-semibold text-text-gray border border-border-light hover:bg-bg-soft transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-[#d32f2f] px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-[#b71c1c] disabled:opacity-50"
                            >
                                {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : null}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
