import React from 'react';
import { Plus, TreePine, ShieldAlert, Compass, Cat } from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import LiveMap from '../../components/dashboard/LiveMap';
import AlertCard from '../../components/dashboard/AlertCard';
import RecentMovements from '../../components/dashboard/RecentMovements';
import PatrolList from '../../components/dashboard/PatrolList';
import RiskOverview from '../../components/dashboard/RiskOverview';
import IncidentCard from '../../components/dashboard/IncidentCard';

const DashboardPage = () => {
    const movements = [
        { name: 'Elephant "Tusker-1"', description: 'Moved into Zone B', time: '1h ago', statusColor: 'bg-[#fab005]' },
        { name: 'Lion Pride "Alpha"', description: 'Stationary near River', time: '3h ago', statusColor: 'bg-[#fab005]' },
        { name: 'Rhino "Big Horn"', description: 'Detected entering Park', time: '5h ago', statusColor: 'bg-primary-medium' }
    ];

    const patrols = [
        { name: 'Sarah Woods', initials: 'SW', unit: 'Unit 1', zone: 'Zone Alpha', status: 'Patrolling', color: 'bg-primary-light' },
        { name: 'Mark Rivers', initials: 'MR', unit: 'Unit 2', zone: 'Zone Beta', status: 'Patrolling', color: 'bg-primary-medium' },
        { name: 'James Lee', initials: 'JL', unit: 'Unit 4', zone: 'Base Camp', status: 'Standby', color: 'bg-primary-light' }
    ];

    return (
        <div className="flex flex-col gap-3">
            {/* Top Header Section */}
            <div className="flex justify-between items-end mb-0.5">
                <div className="mb-0">
                    <h1 className="text-[22px] font-semibold text-primary-dark mb-0.5 tracking-tighter">Overview</h1>
                    <p className="text-text-gray text-[12px]">Monitor protected areas, animals, movements, and alerts.</p>
                </div>
                <div className="flex gap-2 pb-1">
                    <button className="bg-primary-dark text-white border-none px-3.5 py-2 rounded-2xl text-[12px] font-medium flex items-center gap-1.5 transition-colors hover:bg-black">
                        <Plus size={14} /> <span>Log Incident</span>
                    </button>
                    <button className="bg-transparent text-primary-dark border border-primary-medium px-3.5 py-2 rounded-2xl text-[12px] font-medium flex items-center gap-1.5 transition-colors hover:bg-primary-light/10">
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
                <StatsCard
                    title="Protected Areas"
                    value="12,450"
                    unit="ha"
                    icon={TreePine}
                    trend="12 Zones Active"
                    isDark={true}
                />
                <StatsCard
                    title="Tracked Animals"
                    value="48"
                    icon={Cat}
                    trend="+5 tags this month"
                />
                <StatsCard
                    title="Active Patrols"
                    value="14"
                    icon={Compass}
                    trend="All sectors assigned"
                />
                <StatsCard
                    title="Pending Alerts"
                    value="3"
                    icon={ShieldAlert}
                    trend="Requires review"
                    trendColor="text-[#E63946] font-semibold"
                />
            </div>

            {/* Middle Grid */}
            <div className="grid grid-cols-3 gap-3">
                <LiveMap />
                <div className="flex flex-col gap-3 col-span-1">
                    <AlertCard
                        title="Critical Alert"
                        type="Perimeter Breach"
                        location="Zone C (North Edge)"
                        time="12 mins ago"
                        actionLabel="Dispatch Patrol"
                    />
                    <RecentMovements movements={movements} />
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-3 gap-3">
                <PatrolList patrols={patrols} />
                <RiskOverview percentage={82} label="Low Risk Zones" />
                <IncidentCard
                    title="Poaching Suspected"
                    description="Unregistered vehicle spotted near Zone C."
                    time="Reported 20 mins ago"
                />
            </div>
        </div>
    );
};

export default DashboardPage;
