'use client';

import { useState } from 'react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import Link from 'next/link';
import {
    LayoutDashboard, Users, ShieldAlert, Activity, Settings,
    ArrowUpRight, ArrowDownRight, Zap, Target, Server, ShieldCheck, Download,
    Menu, LogOut
} from 'lucide-react';

export default function SuperAdminPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-[#0a0f1c] text-white selection:bg-primary/30">
            <Navbar />

            {/* Ambient Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
            </div>

            <div className="flex flex-1 relative z-10 w-full max-w-7xl mx-auto my-4 lg:my-8 border border-white/10 rounded-3xl overflow-hidden bg-white/[0.02] backdrop-blur-xl shadow-2xl">
                {/* Sidebar overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-[#0a0f1c]/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Modern Sidebar */}
                <aside
                    className={`absolute lg:static top-0 left-0 h-full bg-black/40 border-r border-white/5 flex flex-col backdrop-blur-3xl z-40 transition-all duration-300 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        ${sidebarExpanded ? 'w-72' : 'w-20 shrink-0'}
                    `}
                >
                    <div className={`p-6 flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'} border-b border-white/5`}>
                        <div className={`flex items-center gap-4 group cursor-pointer ${sidebarExpanded ? '' : 'justify-center'}`}>
                            <div className="relative shrink-0">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#0a0f1c] rounded-full relative flex items-center justify-center font-black text-sm lg:text-lg border-2 border-white/10 shadow-inner overflow-hidden">
                                    <span className="bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">SA</span>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-3.5 lg:h-3.5 bg-emerald-500 border-2 border-[#0a0f1c] rounded-full z-10 ring-2 ring-emerald-500/20"></div>
                            </div>
                            {sidebarExpanded && (
                                <div className="overflow-hidden whitespace-nowrap">
                                    <h2 className="font-extrabold text-sm lg:text-base tracking-tight text-white group-hover:text-primary transition-colors">Super Admin</h2>
                                    <p className="text-[10px] lg:text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Root Access
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto custom-scrollbar">
                        {sidebarExpanded && <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 pl-2 mt-2">System Controls</p>}
                        <NavItem label="Command Center" icon={LayoutDashboard} active expanded={sidebarExpanded} />
                        <NavItem label="Global Users" icon={Users} expanded={sidebarExpanded} />
                        <NavItem label="System Health" icon={Activity} badge="99.9%" badgeColor="emerald" expanded={sidebarExpanded} />
                        <NavItem label="Security Logs" icon={ShieldAlert} badge="3" badgeColor="red" expanded={sidebarExpanded} />
                        <NavItem label="Core Settings" icon={Settings} expanded={sidebarExpanded} />
                    </nav>

                    {/* Expand/Collapse Toggle (Desktop only) */}
                    <div className="p-4 border-t border-white/5 hidden lg:block">
                        <button
                            onClick={() => setSidebarExpanded(!sidebarExpanded)}
                            className="w-full flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar relative flex flex-col min-w-0">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-0"></div>

                    <div className="p-6 lg:p-10 relative z-10 flex-1">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-start lg:items-end justify-between gap-6 mb-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <button
                                        className="lg:hidden p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                        onClick={() => setSidebarOpen(true)}
                                    >
                                        <Menu className="w-6 h-6" />
                                    </button>
                                    <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
                                        Site-wide Overview
                                        <span className="hidden sm:flex px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest items-center gap-1 font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></span> Live
                                        </span>
                                    </h1>
                                </div>
                                <p className="text-sm font-medium text-gray-400 max-w-lg">
                                    Monitor platform health, financial metrics, and user activity across the entire SANATKAR infrastructure.
                                </p>
                            </div>
                            <button className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_4px_15px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 group active:scale-95">
                                <Download className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" /> Report
                            </button>
                        </div>

                        {/* Top Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <MetricCard
                                label="Total Platform Revenue"
                                value="$145,200"
                                trend="+12.5% vs last mo"
                                type="up"
                                icon={Target}
                                color="primary"
                            />
                            <MetricCard
                                label="Global Active Users"
                                value="48.5k"
                                trend="+5.2% vs last mo"
                                type="up"
                                icon={Users}
                                color="blue"
                            />
                            <MetricCard
                                label="Server Load Average"
                                value="24%"
                                trend="-2.1% optimally"
                                type="down"
                                icon={Server}
                                color="emerald"
                            />
                        </div>

                        {/* Main Charts & Events */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* Chart Area */}
                            <div className="xl:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-colors backdrop-blur-md">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div>
                                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-400" /> Network Traffic
                                        </h3>
                                        <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mt-1">Requests per hour (Last 7 Days)</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {['1D', '7D', '1M'].map((period, i) => (
                                            <button key={i} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${i === 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-64 flex items-end gap-3 justify-between relative z-10">
                                    {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar cursor-pointer">
                                            <div className="w-full relative bg-white/5 rounded-t-xl overflow-hidden shadow-inner" style={{ height: '100%' }}>
                                                <div
                                                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600/80 to-blue-400/80 rounded-t-xl transition-all duration-700 opacity-60 group-hover/bar:opacity-100 group-hover/bar:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                                    style={{ height: `${h}%` }}
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-white/40"></div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover/bar:text-white transition-colors">
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Events Log */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:border-white/20 transition-colors">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-400" /> Platform Events
                                    </h3>
                                    <button className="text-xs font-bold text-primary hover:text-white transition-colors">View All</button>
                                </div>
                                <div className="space-y-4">
                                    <EventItem title="High-Value Listing Flagged" time="2 mins ago" type="alert" desc="Automated system caught suspicious pricing on a Tajima Rotary Hook Batch." />
                                    <EventItem title="DB Automated Backup" time="45 mins ago" type="system" desc="Snapshot created successfully without downtime." />
                                    <EventItem title="New Vendor Verified" time="3 hours ago" type="user" desc="SANAT Solutions verification packet approved." />
                                    <EventItem title="Traffic Spike Detected" time="5 hours ago" type="system" desc="Expected peak hours. Auto-scaling triggered." isLast />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}

function NavItem({ label, icon: Icon, active = false, badge, badgeColor, expanded = true }: any) {
    const badgeColors: any = {
        emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
        red: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
        primary: 'bg-primary/20 text-primary border-primary/20',
    };

    return (
        <button
            className={`w-full flex items-center ${expanded ? 'justify-between px-4' : 'justify-center px-0'} py-3.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden border focus:outline-none 
                ${active ? 'bg-white/10 text-white border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}
            `}
            title={!expanded ? label : undefined}
        >
            <div className="flex items-center gap-3 relative z-10">
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
                {expanded && <span className="whitespace-nowrap">{label}</span>}
            </div>
            {badge && expanded && (
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeColors[badgeColor] || badgeColors.primary} relative z-10 block`}>
                    {badge}
                </span>
            )}
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-blue-400 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
            )}
        </button>
    );
}

function MetricCard({ label, value, trend, type, icon: Icon, color }: any) {
    const isUp = type === 'up';
    const colorMap: any = {
        primary: 'from-primary/20 to-transparent text-primary bg-primary/10 border-primary/20',
        blue: 'from-blue-500/20 to-transparent text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'from-emerald-500/20 to-transparent text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };

    const [gradient] = colorMap[color].split(' bg-');

    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradient} opacity-50 blur-2xl group-hover:opacity-100 transition-opacity pointer-events-none`}></div>

            <div className="flex items-start justify-between relative z-10 mb-6">
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-3xl font-black text-white tracking-tight">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform ${colorMap[color].split('text-')[1].split(' ')[0]} shadow-inner`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
                <span className={`flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${isUp ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend.split(' ')[0]}
                </span>
                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">{trend.substring(trend.indexOf(' ') + 1)}</span>
            </div>
        </div>
    );
}

function EventItem({ title, desc, time, type, isLast }: any) {
    const config: any = {
        user: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        system: { icon: Server, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        alert: { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
    };

    const { icon: Icon, color, bg } = config[type] || config.system;

    return (
        <div className={`flex gap-4 group ${!isLast ? 'relative pb-5' : ''}`}>
            {!isLast && (
                <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent group-hover:from-white/20 transition-colors"></div>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 z-10 transition-colors shadow-sm ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors cursor-pointer hover:underline">{title}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap shrink-0">{time}</p>
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
