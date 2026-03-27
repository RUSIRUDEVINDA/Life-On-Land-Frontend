import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Map,
    MapPin,
    ClipboardList,
    AlertTriangle,
    Activity, /* for movements */
    Cat, /* for animals */
    ShieldAlert, /* for alerts */
    Settings,
    LogOut,
    Bell,
    Search,
    MessageCircle
} from 'lucide-react';


const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Map Tracking', path: '/dashboard/maps', icon: <Map size={18} /> },
        { name: 'Risk Map', path: '/dashboard/risk-map', icon: <Map size={18} /> },
        { name: 'Protected Areas', path: '/dashboard/areas', icon: <MapPin size={18} /> },
        { name: 'Animals', path: '/dashboard/animals', icon: <Cat size={18} /> },
        { name: 'Movements', path: '/dashboard/movements', icon: <Activity size={18} /> },
        { name: 'Patrols', path: '/dashboard/patrols', icon: <ClipboardList size={18} /> },
        { name: 'Alerts', path: '/dashboard/alerts', icon: <ShieldAlert size={18} /> },
        { name: 'Incidents', path: '/dashboard/incidents', icon: <AlertTriangle size={18} /> }
    ];

    const generalItems = [
        { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={18} /> },
        { name: 'Help', path: '/dashboard/help', icon: <MessageCircle size={18} /> },
    ];

    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg-soft">
            {/* Sidebar navigation */}
            <aside className="w-[220px] bg-white border-r border-border-light flex flex-col z-10 transition-all duration-300">
                <div className="p-5 px-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-dark rounded-md flex items-center justify-center text-[12px] text-white">🌿</div>
                    <h2 className="text-lg font-bold text-primary-dark m-0 tracking-tight">EcoTrack</h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col px-4 pr-3 pb-4 gap-1">
                        <p className="text-[10px] font-semibold text-[#adb5bd] mb-1.5 mt-3 tracking-widest uppercase pl-2">MAIN MENU</p>
                        {menuItems.map(item => {
                            const isActive = item.path === '/dashboard'
                                ? location.pathname === '/dashboard'
                                : location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center text-[13px] font-medium py-2 transition-all duration-200 relative bg-transparent border-none cursor-pointer text-left w-full hover:text-primary-dark ${isActive ? 'text-primary-dark font-semibold before:content-[""] before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-[20px] before:bg-primary before:rounded-r-md' : 'text-[#868e96]'}`}
                                >
                                    <span className={`mr-3 flex items-center text-inherit opacity-80 ${isActive ? 'text-primary opacity-100' : ''}`}>{item.icon}</span>
                                    <span className="flex-1">{item.name}</span>
                                    {item.name === 'Map Tracking' && <span className="ml-auto bg-primary-dark text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">Live</span>}
                                </Link>
                            );
                        })}

                        <p className="text-[10px] font-semibold text-[#adb5bd] mb-1.5 mt-3 tracking-widest uppercase pl-2">GENERAL</p>
                        {generalItems.map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center text-[13px] font-medium py-2 transition-all duration-200 relative bg-transparent border-none cursor-pointer text-left w-full hover:text-primary-dark ${isActive ? 'text-primary-dark font-semibold before:content-[""] before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-[20px] before:bg-primary before:rounded-r-md' : 'text-[#868e96]'}`}
                                >
                                    <span className={`mr-3 flex items-center text-inherit opacity-80 ${isActive ? 'text-primary opacity-100' : ''}`}>{item.icon}</span>
                                    <span className="flex-1">{item.name}</span>
                                </Link>
                            );
                        })}
                        <button className="flex items-center text-[13px] font-medium py-2 transition-all duration-200 relative bg-transparent border-none cursor-pointer text-left w-full hover:text-primary-dark text-[#868e96]" onClick={handleLogout}>
                            <span className="mr-3 flex items-center text-inherit opacity-80"><LogOut size={18} /></span>
                            <span className="flex-1">Logout</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4">
                    <p className="text-[9px] color-[#adb5bd] text-center">EcoTrack v1.0 BETA</p>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-bg-soft">
                <header className="h-14 bg-transparent flex justify-between items-center px-6 z-[5]">
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-2xl w-[280px] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                        <Search size={14} className="text-[#adb5bd] mr-2" />
                        <input type="text" placeholder="Search areas, animals, incidents..." className="border-none bg-transparent w-full text-[12px] text-primary-dark focus:outline-none" />
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
                                <span className="text-[12px] font-semibold text-primary-dark">John Doe</span>
                                <span className="text-[10px] text-[#868e96]">john.doe@eco.com</span>
                            </div>
                            <div className="w-8 h-8 bg-primary-light text-primary-dark rounded-full flex justify-center items-center text-[11px] font-bold border-2 border-white">JD</div>
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
