import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Map,
    MapPin,
    ClipboardList,
    AlertTriangle,
    Activity,
    Cat,
    ShieldAlert,
    UserRound,
    Users,
    LogOut,
    Bell,
    Search,
    MessageCircle,
} from 'lucide-react';
import { getUserRole, getStoredUser } from '../../utils/auth';

const adminMenuItems = [
    { name: 'Dashboard', path: '/dashboard/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Map Tracking', path: '/dashboard/map-tracking', icon: <Map size={18} />, badge: 'Live' },
    { name: 'Risk Map', path: '/dashboard/risk-map', icon: <Map size={18} /> },
    { name: 'Protected Areas', path: '/dashboard/protected-areas', icon: <MapPin size={18} /> },
    { name: 'Animals', path: '/dashboard/animals', icon: <Cat size={18} /> },
    { name: 'Movements', path: '/dashboard/movements', icon: <Activity size={18} /> },
    { name: 'Patrols', path: '/dashboard/patrols', icon: <ClipboardList size={18} /> },
    { name: 'Alerts', path: '/dashboard/alerts', icon: <ShieldAlert size={18} /> },
    { name: 'Incidents', path: '/dashboard/incidents', icon: <AlertTriangle size={18} /> },
    { name: 'Users', path: '/dashboard/users', icon: <Users size={18} /> },
];

const rangerMenuItems = [
    { name: 'Dashboard', path: '/dashboard/ranger', icon: <LayoutDashboard size={18} /> },
    { name: 'My Incidents', path: '/dashboard/my-incidents', icon: <AlertTriangle size={18} /> },
    { name: 'Report Incident', path: '/dashboard/incidents/report', icon: <ClipboardList size={18} /> },
    { name: 'Assigned Patrols', path: '/dashboard/patrols', icon: <MapPin size={18} /> },
    { name: 'Movements', path: '/dashboard/movements', icon: <Activity size={18} /> },
];

const generalItems = [
    { name: 'My Profile', path: '/dashboard/profile', icon: <UserRound size={18} /> },
];

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const role = getUserRole();
    const user = getStoredUser();

    const menuItems = role === 'RANGER' ? rangerMenuItems : adminMenuItems;

    const displayName = user?.fullName || user?.name || user?.username || 'User';
    const displayEmail = user?.email || '';
    const initials = displayName
        .split(' ')
        .map((part) => part[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => {
        if (location.pathname === path) return true;
        if (path !== '/dashboard/admin' && path !== '/dashboard/ranger') {
            return location.pathname.startsWith(path);
        }
        return false;
    };

    const linkClass = (path) =>
        `flex items-center text-[13px] font-medium py-2 transition-all duration-200 relative bg-transparent border-none cursor-pointer text-left w-full hover:text-primary-dark ${
            isActive(path)
                ? 'text-primary-dark font-semibold before:content-[""] before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-[20px] before:bg-primary before:rounded-r-md'
                : 'text-[#868e96]'
        }`;

    const iconClass = (path) =>
        `mr-3 flex items-center text-inherit opacity-80 ${isActive(path) ? 'text-primary opacity-100' : ''}`;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg-soft">
            <aside className="w-[220px] bg-white border-r border-border-light flex flex-col z-10 transition-all duration-300">
                <div className="p-5 px-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-dark rounded-md flex items-center justify-center text-[12px] text-white">🌿</div>
                    <h2 className="text-lg font-bold text-primary-dark m-0 tracking-tight">EcoTrack</h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col px-4 pr-3 pb-4 gap-1">
                        <p className="text-[10px] font-semibold text-[#adb5bd] mb-1.5 mt-3 tracking-widest uppercase pl-2">Main Menu</p>
                        {menuItems.map((item) => (
                            <Link key={item.name} to={item.path} className={linkClass(item.path)}>
                                <span className={iconClass(item.path)}>{item.icon}</span>
                                <span className="flex-1">{item.name}</span>
                                {item.badge && (
                                    <span className="ml-auto bg-primary-dark text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}

                        <p className="text-[10px] font-semibold text-[#adb5bd] mb-1.5 mt-3 tracking-widest uppercase pl-2">General</p>
                        {generalItems.map((item) => (
                            <Link key={item.name} to={item.path} className={linkClass(item.path)}>
                                <span className={iconClass(item.path)}>{item.icon}</span>
                                <span className="flex-1">{item.name}</span>
                            </Link>
                        ))}

                        <button
                            className="flex items-center text-[13px] font-medium py-2 transition-all duration-200 relative bg-transparent border-none cursor-pointer text-left w-full hover:text-primary-dark text-[#868e96]"
                            onClick={handleLogout}
                        >
                            <span className="mr-3 flex items-center text-inherit opacity-80">
                                <LogOut size={18} />
                            </span>
                            <span className="flex-1">Logout</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4">
                    <p className="text-[9px] text-[#adb5bd] text-center">EcoTrack v1.0 BETA</p>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-bg-soft">
                <header className="h-14 bg-transparent flex justify-between items-center px-6 z-[5]">
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-2xl w-[280px] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                        <Search size={14} className="text-[#adb5bd] mr-2" />
                        <input
                            type="text"
                            placeholder="Search areas, animals, incidents..."
                            className="border-none bg-transparent w-full text-[12px] text-primary-dark focus:outline-none"
                        />
                        <div className="bg-bg-soft border border-border-light text-[#868e96] text-[9px] px-1.5 py-0.5 rounded-md font-semibold">⌘F</div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="bg-white border-none w-8 h-8 rounded-full flex justify-center items-center text-primary-dark relative shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:text-primary">
                            <MessageCircle size={16} />
                        </button>
                        <button className="bg-white border-none w-8 h-8 rounded-full flex justify-center items-center text-primary-dark relative shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:text-primary">
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-2.5 ml-2">
                            <div className="flex flex-col items-end">
                                <span className="text-[12px] font-semibold text-primary-dark">{displayName}</span>
                                <span className="text-[10px] text-[#868e96]">{displayEmail}</span>
                            </div>
                            <div className="w-8 h-8 bg-primary-light text-primary-dark rounded-full flex justify-center items-center text-[11px] font-bold border-2 border-white">
                                {initials || <UserRound size={14} />}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-6 pb-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
