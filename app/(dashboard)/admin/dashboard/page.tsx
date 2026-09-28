'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Users, LayoutDashboard, Settings, Menu, Search, Filter, Shield, Bell, CheckCircle2, Clock, XCircle, ArrowUpRight, LogOut, Loader2, Save, Megaphone, Store, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase/client';
import AdConfigForm from '@/app/components/forms/AdConfigForm';
import { useAuth } from '@/lib/AuthContext';
import { fetchJson } from '@/lib/utils/fetchJson';

const stats = {
    totalParts: 1250,
    totalUsers: 8500,
    activeListings: 450,
    pendingApprovals: 12,
    totalSales: 3780000,
    revenue: 225000,
};

const recentListings = [
    { id: 1, part: 'Rotary Hook (KHS12-RYP)', seller: 'Ahmed Khan', price: 8500, date: 'Mar 7, 2026', status: 'pending' },
    { id: 2, part: 'Main Motor Belt', seller: 'Sara Malik', price: 4500, date: 'Mar 6, 2026', status: 'active' },
    { id: 3, part: 'Solenoid Valve Assembly', seller: 'Ali Raza', price: 12500, date: 'Mar 6, 2026', status: 'pending' },
    { id: 4, part: 'Needles DBxK5', seller: 'Fatima Noor', price: 2200, date: 'Mar 5, 2026', status: 'active' },
    { id: 5, part: 'Generic Timing Belt', seller: 'Usman Siddiq', price: 1500, date: 'Mar 5, 2026', status: 'rejected' },
];

const users = [
    { id: 1, name: 'Ahmed Khan', email: 'ahmed@example.com', listings: 3, joined: 'Jan 12, 2026', status: 'active' },
    { id: 2, name: 'Sara Malik', email: 'sara@example.com', listings: 1, joined: 'Feb 3, 2026', status: 'active' },
    { id: 3, name: 'Ali Raza', email: 'ali@example.com', listings: 2, joined: 'Feb 18, 2026', status: 'active' },
    { id: 4, name: 'Fatima Noor', email: 'fatima@example.com', listings: 1, joined: 'Mar 1, 2026', status: 'suspended' },
    { id: 5, name: 'Usman Siddiq', email: 'usman@example.com', listings: 4, joined: 'Dec 9, 2025', status: 'active' },
];

type Tab = 'dashboard' | 'listings' | 'users' | 'ads' | 'shop_verifications' | 'settings';

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string, text: string, icon: any }> = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock },
        active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle2 },
        rejected: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: XCircle },
        suspended: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: XCircle },
    };
    const { bg, text, icon: Icon } = config[status] || config.pending;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${bg} ${text} border border-current/10`}>
            {Icon && <Icon className="w-3 h-3" />}
            {status}
        </span>
    );
}

function StatCard({ title, value, icon: Icon, change, trend = 'up' }: any) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    {change && (
                        <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : null}
                            {change}
                        </p>
                    )}
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 border border-gray-100 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

function AdminDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [isAuthed, setIsAuthed] = useState(false);
    const [liveUsers, setLiveUsers] = useState<any[]>([]);
    const [liveCars, setLiveCars] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    
    // Shop Verifications State
    const [pendingShops, setPendingShops] = useState<any[]>([]);
    const [rejectingShopId, setRejectingShopId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Ad Management State
    const [adConfig, setAdConfig] = useState<any>({
        title: '',
        description: '',
        buttonText: '',
        buttonLink: '',
        imageUrl: '',
        badgeText: '',
        isActive: true,
    });
    const [savingAd, setSavingAd] = useState(false);
    const [adMessage, setAdMessage] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user || !isAdmin) {
                setIsAuthed(false);
            } else {
                setIsAuthed(true);
                // Load live data from real APIs
                setDataLoading(true);
                Promise.all([
                    fetchJson('/api/admin/users'),
                    fetchJson('/api/admin/cars'),
                    fetchJson('/api/ad'),
                ]).then(([uData, cData, aData]) => {
                    if (uData.data?.success) setLiveUsers((uData.data.users as Array<Record<string, unknown>>) || []);
                    if (cData.data?.success) setLiveCars((cData.data.cars as Array<Record<string, unknown>>) || []);
                    if (aData.data?.success && aData.data.ad) setAdConfig(aData.data.ad);
                }).catch(console.error).finally(() => setDataLoading(false));

                // Load pending shop verifications
                const supabase = createClient();
                supabase
                    .from('pending_shop_verifications')
                    .select('*')
                    .then(({ data }) => {
                        setPendingShops(data || []);
                    });
            }
        }
    }, [authLoading, user, isAdmin]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Delete this user permanently?')) return;
        await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        setLiveUsers(prev => prev.filter(u => u._id !== id));
    };

    const handleDeleteCar = async (id: string) => {
        if (!confirm('Delete this listing permanently?')) return;
        await fetch('/api/admin/cars', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        setLiveCars(prev => prev.filter(c => c._id !== id));
    };

    const handleSaveAdConfig = async () => {
        setSavingAd(true);
        setAdMessage('');
        try {
            // In real app, the token should be safely handled; here we rely on the cookie sent by browser automatically
            const { data } = await fetchJson('/api/admin/ad', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adConfig)
            });
            if (data.success) {
                setAdMessage('Ad configuration updated successfully!');
                setTimeout(() => setAdMessage(''), 3000);
            } else {
                setAdMessage(data.message || 'Failed to update ad configuration');
            }
        } catch (e: any) {
            setAdMessage('An error occurred while saving.');
        } finally {
            setSavingAd(false);
        }
    };

    const handleApproveShop = async (shopId: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('shops')
            .update({ verification_status: 'verified', verified_at: new Date().toISOString() })
            .eq('id', shopId);
        if (!error) {
            setPendingShops(prev => prev.filter(s => s.id !== shopId));
        }
    };

    const handleRejectShop = async () => {
        if (!rejectingShopId) return;
        const supabase = createClient();
        const { error } = await supabase
            .from('shops')
            .update({ verification_status: 'rejected', rejection_reason: rejectionReason.trim() || 'Does not meet requirements.' })
            .eq('id', rejectingShopId);
        if (!error) {
            setPendingShops(prev => prev.filter(s => s.id !== rejectingShopId));
            setRejectingShopId(null);
            setRejectionReason('');
        }
    };


    if (authLoading || (isAuthed && dataLoading)) {
        return (
            <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthed) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
                    <h1 className="text-6xl font-black text-gray-900 mb-6 tracking-tighter">404</h1>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
                    <p className="text-gray-500 mb-8 font-medium">The page you are looking for doesn't exist or has been removed.</p>
                    <Link href="/" className="inline-flex items-center justify-center w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-all duration-300 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:scale-[0.98]">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    const navItems: { tab: Tab; label: string; icon: any; count?: number }[] = [
        { tab: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
        { tab: 'listings', label: 'Manage Inventory', icon: Package, count: stats.pendingApprovals },
        { tab: 'users', label: 'User Directory', icon: Users },
        { tab: 'ads', label: 'Ad Content', icon: Megaphone },
        { tab: 'shop_verifications', label: 'Shop Verifications', icon: Store, count: pendingShops.length || undefined },
        { tab: 'settings', label: 'Platform Settings', icon: Settings },
    ];

    return (
        <div className="h-screen overflow-hidden bg-[#f8f9fa] flex text-gray-900 selection:bg-primary/20">
            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#0a0f1c]/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Premium Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-[#0a0f1c] z-40 flex flex-col transition-all duration-300 ease-out shadow-2xl lg:shadow-none
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static border-r border-white/5
                    ${sidebarExpanded ? 'w-72' : 'w-20 shrink-0'}
                `}
            >
                {/* Logo Area */}
                <div className={`px-4 py-8 flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'}`}>
                    <Link href="/" className={`inline-flex items-center gap-2 group ${sidebarExpanded ? '' : 'justify-center'}`}>
                        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                            <Shield className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                        </div>
                        {sidebarExpanded && (
                            <div className="overflow-hidden whitespace-nowrap">
                                <div className="flex font-black tracking-tighter text-xl">
                                    <span className="text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]">SANAT</span>
                                    <span className="text-white">KAR</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block -mt-1">Command Center</span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto pb-4 custom-scrollbar">
                    {sidebarExpanded && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-4 mt-2">Main Navigation</p>}
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.tab;
                        return (
                            <button
                                key={item.tab}
                                onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                                className={`w-full flex items-center ${sidebarExpanded ? 'justify-start px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-semibold transition-all duration-200 gap-3 text-left group relative outline-none
                                    ${isActive
                                        ? 'text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                title={!sidebarExpanded ? item.label : undefined}
                            >
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>}

                                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`} />

                                {sidebarExpanded && (
                                    <>
                                        <span className="whitespace-nowrap">{item.label}</span>
                                        {item.count && (
                                            <span className="ml-auto bg-amber-500/20 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">
                                                {item.count}
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile Area */}
                <div className={`p-4 mx-3 mb-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden group transition-all duration-300 ${!sidebarExpanded ? 'flex flex-col items-center justify-center p-2' : ''}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {sidebarExpanded ? (
                        <>
                            <div className="flex items-center gap-3 relative z-10 mb-3">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-primary to-orange-500 p-[2px]">
                                    <div className="w-full h-full bg-[#0a0f1c] rounded-full flex items-center justify-center border-2 border-[#0a0f1c]">
                                        <span className="text-white font-bold text-xs">SA</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white text-sm font-bold truncate">System Admin</p>
                                    <p className="text-gray-400 text-[11px] font-medium truncate">admin@SANATkar.com</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 text-gray-300 text-xs font-bold transition-all border border-transparent hover:border-amber-500/30 shrink-0 relative z-10"
                            >
                                Secure Logout
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 relative z-10">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-primary to-orange-500 p-[2px]" title="System Admin">
                                <div className="w-full h-full bg-[#0a0f1c] rounded-full flex items-center justify-center border-2 border-[#0a0f1c]">
                                    <span className="text-white font-bold text-xs">SA</span>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                title="Secure Logout"
                                className="w-10 h-10 flex shrink-0 items-center justify-center rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 text-gray-300 transition-all border border-transparent hover:border-amber-500/30"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Subtle background pattern for main content */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-center opacity-[0.015] pointer-events-none z-0"></div>

                {/* Header Navbar */}
                <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSidebarExpanded(!sidebarExpanded)}
                            className="hidden lg:flex p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl font-black text-gray-900 capitalize tracking-tight truncate">{activeTab.replace('-', ' ')}</h1>
                            <p className="text-xs font-semibold text-gray-400 hidden sm:block truncate">Manage your platform efficiently</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex relative group">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                className="pl-9 pr-4 py-2 bg-gray-100/50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white transition-all w-64 shadow-inner"
                            />
                        </div>

                        <div className="h-8 w-[1px] bg-gray-200 hidden sm:block mx-1"></div>

                        <button className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white animate-pulse"></span>
                        </button>

                        <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                            <Clock className="w-3.5 h-3.5" />
                            {stats.pendingApprovals} Task{stats.pendingApprovals !== 1 && 's'}
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 p-6 lg:p-8 overflow-auto relative z-10">
                    {/* DASHBOARD TAB */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 fade-in-up">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Total Parts" value={stats.totalParts} icon={Package} change="↑ 5.2% vs last month" />
                                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} change="↑ 12.1% vs last month" />
                                <StatCard title="Active Listings" value={stats.activeListings} icon={CheckCircle2} change="↑ 3.4% this week" />
                                <StatCard title="Pending Review" value={stats.pendingApprovals} icon={Clock} change="Action required" trend="down" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-gray-900 to-[#1a2a4a] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors"></div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Sales Vol. (PKR)</p>
                                    <p className="text-4xl font-black text-white relative z-10 drop-shadow-md">₨ {stats.totalSales.toLocaleString()}</p>
                                    <div className="mt-8 flex items-center justify-between text-sm relative z-10">
                                        <span className="text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-1 rounded">↑ 8.3% vs Q1</span>
                                        <button className="text-gray-300 hover:text-white font-medium flex items-center gap-1 group/btn">
                                            View Report <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Platform Revenue</p>
                                    <p className="text-4xl font-black text-gray-900 relative z-10">₨ {stats.revenue.toLocaleString()}</p>
                                    <div className="mt-8 flex items-center justify-between text-sm relative z-10">
                                        <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">↑ 15.2% vs Q1</span>
                                        <button className="text-primary hover:text-primary-dark font-bold flex items-center gap-1 group/btn">
                                            View Report <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Table */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <div className="w-2 h-6 bg-primary rounded-full"></div>
                                        Recent Listing Requests
                                    </h2>
                                    <button onClick={() => setActiveTab('listings')} className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:shadow">
                                        View All Directory
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-white border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                <th className="px-6 py-4 text-left">Part Details</th>
                                                <th className="px-6 py-4 text-left hidden sm:table-cell">Seller Info</th>
                                                <th className="px-6 py-4 text-left hidden md:table-cell">Requested Price</th>
                                                <th className="px-6 py-4 text-left">Status</th>
                                                <th className="px-6 py-4 text-left">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {liveCars.slice(0, 4).map(l => (
                                                <tr key={l._id} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-gray-800">{l.make} {l.model}</span>
                                                        <span className="text-gray-500 text-xs block mt-0.5">{l.year}{l.condition}</span>
                                                    </td>
                                                    <td className="px-6 py-4 hidden sm:table-cell">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">{(l.seller?.name || '?')[0]}</div>
                                                            <span className="font-medium text-gray-600">{l.seller?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden md:table-cell font-bold text-gray-700">₨ {l.price.toLocaleString()}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                                                    <td className="px-6 py-4">
                                                        <button className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200 hover:underline">
                                                            Review Ad →
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {liveCars.length === 0 && (
                                                <tr><td colSpan={5} className="text-center py-8 text-gray-400 font-medium">No recent listings</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LISTINGS TAB */}
                    {activeTab === 'listings' && (
                        <div className="space-y-6 fade-in-up">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Filter className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Filter Listings</p>
                                        <p className="text-xs text-gray-500">{liveCars.length} total records found</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <select className="text-sm border border-gray-200 rounded-xl px-4 py-2 font-medium bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-sm">
                                        <option>All Statuses</option>
                                        <option>Pending Review</option>
                                        <option>Active Ads</option>
                                        <option>Rejected/Removed</option>
                                    </select>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" placeholder="Search VIN, Car, or User..." className="text-sm border border-gray-200 rounded-xl pl-9 pr-4 py-2 font-medium bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-sm sm:w-64" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                <th className="px-6 py-4 text-left">Listing ID / Part</th>
                                                <th className="px-6 py-4 text-left hidden sm:table-cell">Seller</th>
                                                <th className="px-6 py-4 text-left hidden md:table-cell">Price (PKR)</th>
                                                <th className="px-6 py-4 text-left hidden lg:table-cell">Submission Date</th>
                                                <th className="px-6 py-4 text-left">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {liveCars.map(l => (
                                                <tr key={l._id} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-mono text-gray-400 block mb-0.5">#PKW-{l._id.substring(0, 6)}</span>
                                                        <span className="font-bold text-gray-800">{l.make} {l.model} {l.year}</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-600 hidden sm:table-cell">{l.seller?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 font-black tracking-tight text-gray-700 hidden md:table-cell">{l.price.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-gray-400 text-xs font-medium hidden lg:table-cell">{new Date(l.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleDeleteCar(l._id)}
                                                                className="text-xs font-bold bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-500 hover:text-white transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                            <Link href={`/seller?id=${l._id}`} className="text-xs font-bold bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors inline-block text-center">
                                                                Manage
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {liveCars.length === 0 && (
                                                <tr><td colSpan={6} className="text-center py-12 text-gray-400 font-medium">No listings found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="space-y-6 fade-in-up">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-gray-400" />
                                        User Directory ({liveUsers.length})
                                    </h2>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" placeholder="Search by name, email..." className="text-sm border border-gray-200 rounded-xl pl-9 pr-4 py-2 font-medium bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-sm w-full sm:w-64" />
                                    </div>
                                </div>
                                {dataLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-white border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    <th className="px-6 py-4 text-left">User Profile</th>
                                                    <th className="px-6 py-4 text-left hidden sm:table-cell">Email</th>
                                                    <th className="px-6 py-4 text-left">Role</th>
                                                    <th className="px-6 py-4 text-left hidden lg:table-cell">Joined</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {liveUsers.map(u => (
                                                    <tr key={u._id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs shadow-sm">
                                                                    {u.name?.[0] || '?'}
                                                                </div>
                                                                <span className="font-bold text-gray-800">{u.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 font-medium text-xs hidden sm:table-cell">{u.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-600 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-400 text-xs font-medium hidden lg:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            {u.role !== 'admin' && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u._id)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-amber-50 text-amber-500 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-500 hover:text-white"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {liveUsers.length === 0 && (
                                                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 font-medium">No users found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ADS TAB */}
                    {activeTab === 'ads' && (
                        <div className="fade-in-up max-w-4xl">
                            <AdConfigForm />
                        </div>
                    )}

                    {/* SHOP VERIFICATIONS TAB */}
                    {activeTab === 'shop_verifications' && (
                        <div className="fade-in-up space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Store className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Shop Verifications</h2>
                                    <p className="text-xs text-gray-400">{pendingShops.length} pending request{pendingShops.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {pendingShops.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
                                    <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                    <p className="font-bold text-gray-600">All caught up! No pending shop verifications.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingShops.map((shop: any) => (
                                        <div key={shop.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                                {/* Images */}
                                                {shop.image_urls?.length > 0 && (
                                                    <div className="flex gap-2 shrink-0">
                                                        {shop.image_urls.slice(0, 3).map((url: string, i: number) => (
                                                            <img key={i} src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-black text-gray-900 mb-1">{shop.title}</h3>
                                                    {shop.description && (
                                                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{shop.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-semibold">
                                                        {shop.username && <span>Seller: @{shop.username}</span>}
                                                        {shop.phone && <span>📞 {shop.phone}</span>}
                                                        {shop.verification_requested_at && (
                                                            <span>Requested: {new Date(shop.verification_requested_at).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleApproveShop(shop.id)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => { setRejectingShopId(shop.id); setRejectionReason(''); }}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reject Modal */}
                            {rejectingShopId && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Verification</h3>
                                        <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this shop.</p>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none min-h-[100px]"
                                            placeholder="Reason for rejection..."
                                        />
                                        <div className="flex justify-end gap-3 mt-4">
                                            <button
                                                onClick={() => setRejectingShopId(null)}
                                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleRejectShop}
                                                className="px-4 py-2 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors"
                                            >
                                                Confirm Rejection
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="fade-in-up max-w-4xl space-y-8">

                            {/* GENERAL SYSTEM SETTINGS */}
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 max-w-2xl text-sm font-medium relative overflow-hidden">
                                {/* Decorative background */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-bl-[100px] -z-10 border-l border-b border-gray-100 opacity-50"></div>

                                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                                    <div className="p-3 bg-gray-900 text-white rounded-xl shadow-md"><Settings className="w-5 h-5" /></div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight">System Configuration (Demo)</h2>
                                        <p className="text-gray-500 text-xs">Manage core platform parameters and rules</p>
                                    </div>
                                </div>

                                <div className="space-y-6 opacity-60 pointer-events-none">
                                    <div className="group">
                                        <label className="block font-bold text-gray-700 mb-2">Platform Name</label>
                                        <input type="text" defaultValue="SANATKAR" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 shadow-inner" />
                                    </div>

                                    <div className="group">
                                        <label className="block font-bold text-gray-700 mb-2">Technical Contact Email</label>
                                        <input type="email" defaultValue="admin@SANATkar.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 shadow-inner" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block font-bold text-gray-700 mb-2">Max Free Listings</label>
                                            <input type="number" defaultValue={5} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 shadow-inner" />
                                        </div>
                                        <div className="group">
                                            <label className="block font-bold text-gray-700 mb-2">Commission Rate (%)</label>
                                            <input type="number" defaultValue={2.5} step="0.1" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 shadow-inner" />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mt-8 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-gray-900">Manual Approval Workflow</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Force all new listings into 'Pending' queue</p>
                                            </div>
                                            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer shadow-inner">
                                                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-md" />
                                            </div>
                                        </div>
                                        <div className="h-px bg-gray-200"></div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-gray-900">Maintenance Mode</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Disable public access showing banner</p>
                                            </div>
                                            <div className="w-12 h-6 bg-gray-200 border border-gray-300 rounded-full relative cursor-pointer shadow-inner transition-colors">
                                                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        }>
            <AdminDashboardContent />
        </Suspense>
    );
}
