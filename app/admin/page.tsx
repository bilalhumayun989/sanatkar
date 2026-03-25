// 'use client';

// import { useState, useEffect } from 'react';
// import { useSearchParams } from 'next/navigation';
// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';
// import {
//     Car, Users, LayoutDashboard, LogOut, Trash2,
//     Eye, EyeOff, AlertCircle, ArrowRight, Loader2,
//     User, ShieldCheck, Package, TrendingUp
// } from 'lucide-react';

// type Tab = 'overview' | 'users' | 'cars';

// export default function AdminPage() {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [checkingAuth, setCheckingAuth] = useState(true);
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [showPass, setShowPass] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const searchParams = useSearchParams();
//     const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
//     const [adminUser, setAdminUser] = useState<any>(null);

//     const [users, setUsers] = useState<any[]>([]);
//     const [cars, setCars] = useState<any[]>([]);
//     const [dataLoading, setDataLoading] = useState(false);

//     useEffect(() => {
//         const checkAuth = async () => {
//             try {
//                 const res = await fetch('/api/auth/me');
//                 const data = await res.json();
//                 if (res.ok && data.user?.role === 'admin') {
//                     setAdminUser(data.user);
//                     setIsAuthenticated(true);
//                 }
//             } catch (e) {}
//             finally { setCheckingAuth(false); }
//         };
//         checkAuth();
//     }, []);

//     useEffect(() => {
//         if (!isAuthenticated) return;
//         const loadData = async () => {
//             setDataLoading(true);
//             const [uRes, cRes] = await Promise.all([
//                 fetch('/api/admin/users'),
//                 fetch('/api/admin/cars'),
//             ]);
//             const uData = await uRes.json();
//             const cData = await cRes.json();
//             if (uData.success) setUsers(uData.users);
//             if (cData.success) setCars(cData.cars);
//             setDataLoading(false);
//         };
//         loadData();
//     }, [isAuthenticated]);

//     const handleLogin = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');
//         try {
//             const res = await fetch('/api/auth/login', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email, password }),
//             });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message || 'Invalid credentials');
//             if (data.user?.role !== 'admin') throw new Error('Access denied: Admin only');
//             setAdminUser(data.user);
//             setIsAuthenticated(true);
//         } catch (err: any) {
//             setError(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleLogout = async () => {
//         await fetch('/api/auth/logout', { method: 'POST' });
//         setIsAuthenticated(false);
//         setAdminUser(null);
//     };

//     const handleDeleteUser = async (id: string) => {
//         if (!confirm('Delete this user permanently?')) return;
//         await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
//         setUsers(prev => prev.filter(u => u._id !== id));
//     };

//     const handleDeleteCar = async (id: string) => {
//         if (!confirm('Delete this car listing permanently?')) return;
//         await fetch('/api/admin/cars', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
//         setCars(prev => prev.filter(c => c._id !== id));
//     };

//     if (checkingAuth) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
//                 <Loader2 className="w-12 h-12 text-primary animate-spin" />
//             </div>
//         );
//     }

//     if (!isAuthenticated) {
//         return (
//             <div className="min-h-screen flex flex-col bg-[#0a0a0a] relative overflow-hidden">
//                 {/* Grid BG */}
//                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
//                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />

//                 <main className="flex-grow flex items-center justify-center px-4 py-20 relative z-10">
//                     <div className="w-full max-w-[420px]">
//                         <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
//                             <div className="text-center mb-10">
//                                 <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-500">
//                                     <ShieldCheck size={38} className="text-white" />
//                                 </div>
//                                 <h1 className="text-3xl font-black text-white mb-2">Admin Portal</h1>
//                                 <p className="text-gray-500 text-sm font-medium">Restricted access — admins only</p>
//                             </div>

//                             <form onSubmit={handleLogin} className="space-y-5">
//                                 <div className="space-y-2">
//                                     <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Email</label>
//                                     <div className="relative">
//                                         <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
//                                         <input
//                                             type="email"
//                                             value={email}
//                                             onChange={e => setEmail(e.target.value)}
//                                             placeholder="admin@pakwheels.com"
//                                             required
//                                             className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none text-white text-sm transition-all placeholder:text-gray-600"
//                                         />
//                                     </div>
//                                 </div>
//                                 <div className="space-y-2">
//                                     <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Password</label>
//                                     <div className="relative">
//                                         <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10">
//                                             {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
//                                         </button>
//                                         <input
//                                             type={showPass ? 'text' : 'password'}
//                                             value={password}
//                                             onChange={e => setPassword(e.target.value)}
//                                             placeholder="••••••••"
//                                             required
//                                             className="w-full px-5 py-4 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none text-white text-sm transition-all placeholder:text-gray-600"
//                                         />
//                                     </div>
//                                 </div>

//                                 {error && (
//                                     <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl px-4 py-3 flex items-center gap-2">
//                                         <AlertCircle size={16} className="text-red-400 shrink-0" />
//                                         <span>{error}</span>
//                                     </div>
//                                 )}

//                                 <button
//                                     type="submit"
//                                     disabled={loading}
//                                     className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
//                                 >
//                                     {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Access Dashboard</span><ArrowRight size={16} /></>}
//                                 </button>
//                             </form>

//                             <div className="mt-8 pt-6 border-t border-white/5 text-center">
//                                 <p className="text-[10px] text-gray-600">© 2026 PakWheels Admin Panel</p>
//                             </div>
//                         </div>
//                     </div>
//                 </main>
//             </div>
//         );
//     }

//     const stats = [
//         { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500/10 text-blue-400' },
//         { label: 'Total Listings', value: cars.length, icon: Car, color: 'bg-primary/10 text-primary' },
//         { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: 'bg-purple-500/10 text-purple-400' },
//     ];

//     const tabs: { id: Tab; label: string; icon: any }[] = [
//         { id: 'overview', label: 'Overview', icon: LayoutDashboard },
//         { id: 'users', label: `Users (${users.length})`, icon: Users },
//         { id: 'cars', label: `Listings (${cars.length})`, icon: Car },
//     ];

//     return (
//         <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
//             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

//             {/* Top Bar */}
//             <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
//                 <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
//                             <ShieldCheck size={20} className="text-white" />
//                         </div>
//                         <div>
//                             <p className="font-black text-white text-sm">PakWheels Admin</p>
//                             <p className="text-[10px] text-gray-500 font-medium">{adminUser?.email}</p>
//                         </div>
//                     </div>
//                     <button
//                         onClick={handleLogout}
//                         className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 px-4 py-2 rounded-xl border border-white/10 hover:border-red-500/20"
//                     >
//                         <LogOut size={16} /> Logout
//                     </button>
//                 </div>
//             </header>

//             <div className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 relative z-10">
//                 {/* Tab Nav */}
//                 <div className="flex gap-2 mb-8 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 w-fit">
//                     {tabs.map(t => (
//                         <button
//                             key={t.id}
//                             onClick={() => setTab(t.id)}
//                             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id
//                                 ? 'bg-primary text-white shadow-lg shadow-primary/20'
//                                 : 'text-gray-500 hover:text-white hover:bg-white/5'
//                                 }`}
//                         >
//                             <t.icon size={15} />
//                             {t.label}
//                         </button>
//                     ))}
//                 </div>

//                 {dataLoading ? (
//                     <div className="flex items-center justify-center py-32">
//                         <Loader2 className="w-10 h-10 text-primary animate-spin" />
//                     </div>
//                 ) : (
//                     <>
//                         {/* Overview */}
//                         {tab === 'overview' && (
//                             <div className="space-y-8">
//                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                                     {stats.map(s => (
//                                         <div key={s.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-colors">
//                                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${s.color}`}>
//                                                 <s.icon size={24} />
//                                             </div>
//                                             <p className="text-3xl font-black mb-1">{s.value}</p>
//                                             <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{s.label}</p>
//                                         </div>
//                                     ))}
//                                 </div>
//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
//                                         <h3 className="font-black text-sm uppercase tracking-widest mb-5 text-gray-300">Recent Users</h3>
//                                         <div className="space-y-3">
//                                             {users.slice(0, 5).map(u => (
//                                                 <div key={u._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
//                                                     <div>
//                                                         <p className="font-bold text-sm">{u.name}</p>
//                                                         <p className="text-gray-500 text-xs">{u.email}</p>
//                                                     </div>
//                                                     <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-gray-400'}`}>
//                                                         {u.role}
//                                                     </span>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                     <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
//                                         <h3 className="font-black text-sm uppercase tracking-widest mb-5 text-gray-300">Recent Listings</h3>
//                                         <div className="space-y-3">
//                                             {cars.slice(0, 5).map(c => (
//                                                 <div key={c._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
//                                                     <div>
//                                                         <p className="font-bold text-sm">{c.make} {c.model} ({c.year})</p>
//                                                         <p className="text-gray-500 text-xs">Rs. {c.price?.toLocaleString()} • {c.location}</p>
//                                                     </div>
//                                                     <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${c.status === 'available' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
//                                                         {c.status}
//                                                     </span>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Users Table */}
//                         {tab === 'users' && (
//                             <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
//                                 <div className="px-6 py-5 border-b border-white/10">
//                                     <h2 className="font-black text-lg">All Users</h2>
//                                     <p className="text-gray-500 text-xs mt-1">{users.length} registered accounts</p>
//                                 </div>
//                                 <div className="overflow-x-auto">
//                                     <table className="w-full text-sm">
//                                         <thead>
//                                             <tr className="border-b border-white/10 text-gray-500 text-[11px] font-black uppercase tracking-widest">
//                                                 <th className="px-6 py-4 text-left">Name</th>
//                                                 <th className="px-6 py-4 text-left">Email</th>
//                                                 <th className="px-6 py-4 text-left">Role</th>
//                                                 <th className="px-6 py-4 text-left">Joined</th>
//                                                 <th className="px-6 py-4 text-right">Actions</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {users.map(u => (
//                                                 <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
//                                                     <td className="px-6 py-4 font-bold">{u.name}</td>
//                                                     <td className="px-6 py-4 text-gray-400">{u.email}</td>
//                                                     <td className="px-6 py-4">
//                                                         <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-gray-400'}`}>
//                                                             {u.role}
//                                                         </span>
//                                                     </td>
//                                                     <td className="px-6 py-4 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
//                                                     <td className="px-6 py-4 text-right">
//                                                         {u.role !== 'admin' && (
//                                                             <button
//                                                                 onClick={() => handleDeleteUser(u._id)}
//                                                                 className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
//                                                             >
//                                                                 <Trash2 size={16} />
//                                                             </button>
//                                                         )}
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Cars Table */}
//                         {tab === 'cars' && (
//                             <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
//                                 <div className="px-6 py-5 border-b border-white/10">
//                                     <h2 className="font-black text-lg">All Listings</h2>
//                                     <p className="text-gray-500 text-xs mt-1">{cars.length} total car listings</p>
//                                 </div>
//                                 <div className="overflow-x-auto">
//                                     <table className="w-full text-sm">
//                                         <thead>
//                                             <tr className="border-b border-white/10 text-gray-500 text-[11px] font-black uppercase tracking-widest">
//                                                 <th className="px-6 py-4 text-left">Car</th>
//                                                 <th className="px-6 py-4 text-left">Seller</th>
//                                                 <th className="px-6 py-4 text-left">Price</th>
//                                                 <th className="px-6 py-4 text-left">Location</th>
//                                                 <th className="px-6 py-4 text-left">Status</th>
//                                                 <th className="px-6 py-4 text-right">Actions</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {cars.map(c => (
//                                                 <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
//                                                     <td className="px-6 py-4">
//                                                         <p className="font-bold">{c.make} {c.model}</p>
//                                                         <p className="text-gray-500 text-xs">{c.year} • {c.condition}</p>
//                                                     </td>
//                                                     <td className="px-6 py-4 text-gray-400 text-xs">
//                                                         <p className="font-bold text-white">{c.seller?.name || 'N/A'}</p>
//                                                         <p>{c.seller?.email || ''}</p>
//                                                     </td>
//                                                     <td className="px-6 py-4 font-bold text-primary">Rs. {c.price?.toLocaleString()}</td>
//                                                     <td className="px-6 py-4 text-gray-400 text-xs">{c.location}</td>
//                                                     <td className="px-6 py-4">
//                                                         <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${c.status === 'available' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
//                                                             {c.status}
//                                                         </span>
//                                                     </td>
//                                                     <td className="px-6 py-4 text-right">
//                                                         <button
//                                                             onClick={() => handleDeleteCar(c._id)}
//                                                             className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
//                                                         >
//                                                             <Trash2 size={16} />
//                                                         </button>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         )}
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// }


import React from 'react'

const page = () => {
  return (
    <div>I am admin</div>
  )
}

export default page