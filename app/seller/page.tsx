'use client';

import { useEffect, useState, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    Package, Eye, EyeOff, AlertCircle, LogOut, Camera, ArrowRight, User, 
    Lock, Save, Send, Loader2, X, Plus, Star, ChevronDown, LayoutDashboard, 
    ShoppingCart, Settings, Menu, Search, Filter, Bell, Clock, ArrowUpRight, 
    CheckCircle2, XCircle, Shield
} from 'lucide-react';

type Tab = 'dashboard' | 'products' | 'orders' | 'post' | 'settings';

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string, text: string, icon: any }> = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock },
        confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: CheckCircle2 },
        shipped: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', icon: Send },
        delivered: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle2 },
        cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', icon: XCircle },
    };
    const { bg, text, icon: Icon } = config[status] || config.pending;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${bg} ${text} border border-current/10`}>
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
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{typeof value === 'number' ? `₨ ${value.toLocaleString()}` : value}</p>
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

function SellerContent() {
    const { user: authUser, loading: authLoading, isSeller } = useAuth();
    const isStandardUser = authUser?.role === 'user';
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>((searchParams?.get('tab') as Tab) || 'dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);

    // Auth States
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    // Dashboard Data States
    const [sellerProducts, setSellerProducts] = useState<any[]>([]);
    const [sellerOrders, setSellerOrders] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalSales: 0,
        activeProducts: 0,
        pendingOrders: 0,
        completedOrders: 0
    });

    // Product Form States
    const [formData, setFormData] = useState({
        brand: '',
        category: '',
        compatibility: '',
        price: '',
        description: '',
        condition: 'new' as any,
        stockStatus: 'In Stock',
        location: '',
    });
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [publishError, setPublishError] = useState('');
    const [publishSuccess, setPublishSuccess] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const editId = searchParams?.get('id');

    // Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (res.ok && data.user) {
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
            }
        };
        checkAuth();
    }, []);

    // Load Dashboard Data
    useEffect(() => {
        const loadDashboardData = async () => {
            if (isAuthenticated) {
                setDataLoading(true);
                try {
                    const [pRes, oRes] = await Promise.all([
                        fetch('/api/seller/products').then(r => r.json()),
                        fetch('/api/seller/orders').then(r => r.json())
                    ]);

                    if (pRes.success) setSellerProducts(pRes.products);
                    if (oRes.success) setSellerOrders(oRes.orders);

                    const active = pRes.products?.filter((p: any) => p.status === 'available').length || 0;
                    const pending = oRes.orders?.filter((o: any) => o.status === 'pending').length || 0;
                    const completed = oRes.orders?.filter((o: any) => o.status === 'delivered').length || 0;
                    const totalSales = oRes.orders?.filter((o: any) => o.status !== 'cancelled').reduce((acc: number, o: any) => acc + o.totalPrice, 0) || 0;

                    setStats({ activeProducts: active, pendingOrders: pending, completedOrders: completed, totalSales });
                } catch (err) {
                    console.error('Failed to load dashboard data:', err);
                } finally {
                    setDataLoading(false);
                }
            }
        };
        loadDashboardData();
    }, [isAuthenticated, publishSuccess]);

    // Load Edit Data
    useEffect(() => {
        if (editId) {
            fetch(`/api/cars/${editId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.message) {
                        setFormData({
                            brand: data.make || '',
                            category: data.model || '',
                            compatibility: data.description?.match(/^Compatibility: (.*?)(?:\. |$)/)?.[1] || '',
                            price: data.price ? data.price.toString() : '',
                            description: data.description?.replace(/^Compatibility: .*?(?:\. |$)/, '') || data.description || '',
                            condition: data.condition || 'new',
                            stockStatus: data.transmission || 'In Stock',
                            location: data.location || '',
                        });
                        setUploadedImages(data.images || []);
                        setActiveTab('post');
                    }
                })
                .catch(console.error);
        }
    }, [editId]);

    // Load Categories
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => { if (data.success) setCategories(data.categories); })
            .catch(console.error);
    }, []);

    // Handlers
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid credentials');
            setIsAuthenticated(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setSellerOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (err) {
            console.error('Failed to update order status:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setPublishLoading(true);
        setPublishError('');
        setPublishSuccess(false);
        
        
        // Product limit check for regular users
        if (isStandardUser && sellerProducts.length >= 3 && !editId) {
            setPublishError('Standard Account Limit: You can only post a maximum of 3 products. Please contact support to upgrade to a Seller account.');
            setPublishLoading(false);
            return;
        }

        try {
            const url = editId ? `/api/cars/${editId}` : '/api/cars';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    make: formData.brand,
                    model: formData.category,
                    year: 2024,
                    mileage: 0,
                    location: formData.location,
                    price: parseInt(formData.price),
                    description: `Compatibility: ${formData.compatibility}. ${formData.description}`,
                    condition: formData.condition,
                    fuelType: formData.condition,
                    transmission: formData.stockStatus,
                    images: uploadedImages.length > 0 ? uploadedImages : []
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to publish ad');
            }

            setPublishSuccess(true);
            setUploadedImages([]);
            setFormData({ brand: '', category: '', compatibility: '', price: '', description: '', condition: 'new', stockStatus: 'In Stock', location: '' });
            if (editId) {
                router.push('/seller?tab=products');
            }
        } catch (err: any) {
            setPublishError(err.message);
        } finally {
            setPublishLoading(false);
        }
    };
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Image upload limit for standard users
        if (isStandardUser && sellerProducts.length >= 3 && !editId) {
            alert('Standard Account Limit: You have reached the maximum of 3 products. Please delete an older product or upgrade to a Seller account.');
            return;
        }

        setUploading(true);
        const uploadData = new FormData();
        Array.from(files).forEach(file => uploadData.append('files', file));
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setUploadedImages(prev => [...prev, ...data.urls]);
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setAddingCategory(true);
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setNewCategoryName('');
                fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCategories(d.categories); });
            }
        } catch (err) {
            console.error('Add category error:', err);
        } finally {
            setAddingCategory(false);
        }
    };

    const togglePopular = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation(); e.preventDefault();
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPopular: !currentStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setCategories(prev => prev.map(c => c.id === id ? { ...c, isPopular: !currentStatus } : c));
            }
        } catch (err) {
            console.error('Toggle popular error:', err);
        }
    };

    const navItems = [
        { tab: 'dashboard' as Tab, label: 'Overview', icon: LayoutDashboard },
        { tab: 'products' as Tab, label: 'My Inventory', icon: Package },
        { tab: 'orders' as Tab, label: 'Sales Orders', icon: ShoppingCart, count: stats.pendingOrders },
        { tab: 'post' as Tab, label: 'Post New Product', icon: Plus },
        { tab: 'settings' as Tab, label: 'Shop Settings', icon: Settings },
    ];

    if (authLoading || (isAuthenticated && dataLoading)) {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a0f1c]">
                <Navbar forceSolid />
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),transparent_70%)]" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                </div>

                <main className="flex-grow flex items-center justify-center px-4 py-20 relative z-10">
                    <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-10 shadow-2xl relative group">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-colors duration-500" />
                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <Package size={32} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-white tracking-tight mb-2">Seller Portal</h1>
                                <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-10">Secure Access Required</p>

                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="relative group">
                                        <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none text-white text-sm transition-all placeholder:text-gray-600" />
                                    </div>
                                    <div className="relative group">
                                        <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                                        <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full pl-14 pr-14 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none text-white text-sm transition-all placeholder:text-gray-600" />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3 text-left">{error}</div>}
                                    <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-primary text-white text-sm font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Dashboard <ArrowRight size={18} /></>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-[#f8f9fa] flex text-gray-900">
            {sidebarOpen && <div className="fixed inset-0 bg-[#0a0f1c]/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />}

            <aside className={`fixed top-0 left-0 h-full bg-[#0a0f1c] z-[70] flex flex-col transition-all duration-300 ease-out shadow-2xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static border-r border-white/5 ${sidebarExpanded ? 'w-72' : 'w-20 shrink-0'}`}>
                <div className={`px-4 py-8 flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'}`}>
                    <Link href="/" className={`inline-flex items-center gap-2 group ${sidebarExpanded ? '' : 'justify-center'}`}>
                        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                            <Shield className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                        </div>
                        {sidebarExpanded && (
                            <div className="overflow-hidden whitespace-nowrap">
                                <div className="flex font-black tracking-tighter text-xl"><span className="text-primary italic">SANAT</span><span className="text-white">KAR</span></div>
                                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block -mt-1">Seller Network</span>
                            </div>
                        )}
                    </Link>
                </div>

                <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto pb-4 custom-scrollbar">
                    {sidebarExpanded && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-4 mt-2">Personal Shop</p>}
                    {navItems.map((item) => {
                        const Icon = item.icon; 
                        const isActive = activeTab === item.tab;
                        const isRestricted = isStandardUser && item.tab === 'settings';

                        return (
                            <button 
                                key={item.tab} 
                                onClick={() => { 
                                    if (isRestricted) return;
                                    setActiveTab(item.tab); 
                                    setSidebarOpen(false); 
                                }} 
                                className={`w-full flex items-center ${sidebarExpanded ? 'justify-start px-4' : 'justify-center px-0'} py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 gap-3 text-left group relative outline-none 
                                    ${isActive ? 'text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                    ${isRestricted ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                                `}
                                title={isRestricted ? "Standard Account Limit: Professional Sellers Only" : ""}
                            >
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>}
                                <div className="relative">
                                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                    {isRestricted && <Lock size={10} className="absolute -top-1 -right-1 text-primary" />}
                                </div>
                                {sidebarExpanded && <><span className="whitespace-nowrap">{item.label}</span>{item.count ? <span className="ml-auto bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">{item.count}</span> : null}</>}
                            </button>
                        );
                    })}
                </nav>

                <div className={`p-4 mx-3 mb-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col ${!sidebarExpanded ? 'items-center' : ''}`}>
                    {sidebarExpanded && (
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30"><User size={14} className="text-primary" /></div>
                            <div className="min-w-0"><p className="text-white text-xs font-bold truncate">{authUser?.name || 'Seller'}</p><p className="text-gray-500 text-[10px] truncate">{authUser?.email}</p></div>
                        </div>
                    )}
                    <button onClick={() => { fetch('/api/auth/logout', {method: 'POST'}).then(() => window.location.href = '/') }} className={`flex items-center gap-2 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-xs ${!sidebarExpanded ? 'justify-center w-10 h-10' : 'px-3 w-full'}`} title="Sign Out"><LogOut size={sidebarExpanded ? 14 : 18} />{sidebarExpanded && "Logout"}</button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
                <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-gray-100 rounded-xl text-gray-600"><Menu size={18} /></button>
                        <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="hidden lg:flex p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 border border-gray-100 transition-colors"><Menu size={18} /></button>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight capitalize">{activeTab}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border font-black text-[10px] uppercase tracking-widest shadow-sm ${isStandardUser ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {isStandardUser ? <Lock size={12} /> : <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                            {isStandardUser ? 'Standard Account' : 'Verified Seller Account'}
                        </div>
                        {isStandardUser && (
                             <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                <Package size={12} />
                                {sellerProducts.length}/3 LISTINGS
                             </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-gray-50/50">
                    {/* DASHBOARD OVERVIEW */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Total Sales" value={stats.totalSales} icon={ShoppingCart} change="All time" />
                                <StatCard title="Active Listings" value={stats.activeProducts} icon={Package} change="Live on store" />
                                <StatCard title="Pending Orders" value={stats.pendingOrders} icon={Clock} trend="down" change={stats.pendingOrders > 0 ? "Requires Action" : "Up to date"} />
                                <StatCard title="Completed Sales" value={stats.completedOrders} icon={CheckCircle2} change="Total delivered" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
                                    <h2 className="text-lg font-black text-secondary flex items-center gap-2 mb-8"><div className="w-1.5 h-4 bg-primary rounded-full" />Recent Orders</h2>
                                    <div className="space-y-4">
                                        {sellerOrders.slice(0, 5).map((order) => (
                                            <div key={order.id} className="flex items-center justify-between p-4 rounded-3xl bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center p-1.5 overflow-hidden border border-gray-50"><img src={order.product?.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover rounded-lg" /></div>
                                                    <div><p className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">{order.product?.make} {order.product?.model}</p><p className="text-[10px] text-gray-400 font-medium tracking-tight">To: {order.buyer?.name}</p></div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-secondary">₨ {order.totalPrice.toLocaleString()}</p>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                            </div>
                                        ))}
                                        {sellerOrders.length === 0 && <div className="py-12 text-center text-gray-400 font-medium italic">No sales activity documented yet.</div>}
                                    </div>
                                </section>

                                <section className="bg-gradient-to-br from-secondary to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    <h2 className="text-2xl font-black mb-3 text-primary !text-white tracking-tighter italic uppercase">Scale Fast</h2>
                                    <p className="text-gray-400 text-xs mb-10 leading-relaxed font-semibold max-w-[280px]">Your professional shop is ready. Expand your inventory or reach out to our dedicated support.</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setActiveTab('post')} className="bg-primary text-white py-4 rounded-2xl font-black text-xs hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">Post New Item</button>
                                        <button onClick={() => setActiveTab('products')} className="bg-white/10 backdrop-blur-md text-white border border-white/10 py-4 rounded-2xl font-black text-xs hover:bg-white/20 transition-all">Listings Manager</button>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {/* INVENTORY MANAGER */}
                    {activeTab === 'products' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-secondary rounded-2xl text-white shadow-lg"><Package size={20} /></div>
                                    <div><p className="text-sm font-black text-secondary">Global Inventory</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{sellerProducts.length} Total Units</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative group"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search Part SKU..." className="pl-10 pr-6 py-2.5 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-xs font-bold w-48 transition-all" /></div>
                                    <button onClick={() => setActiveTab('post')} className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"><Plus size={20} /></button>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto"><table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5 text-left">Unit Information</th><th className="px-6 py-5 text-left">Quality</th><th className="px-6 py-5 text-left">Valuation</th><th className="px-6 py-5 text-left">Storefront Status</th><th className="px-8 py-5 text-right">Unit Actions</th></tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sellerProducts.map(p => (
                                            <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                                                <td className="px-8 py-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shrink-0 shadow-sm border border-white"><img src={p.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" /></div><div><p className="font-black text-secondary text-sm">{p.make} {p.model}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{p.location}</p></div></div></td>
                                                <td className="px-6 py-6"><span className="text-[10px] font-black uppercase px-2.5 py-1 bg-gray-100 text-gray-500 rounded-xl border border-gray-200">{p.condition}</span></td>
                                                <td className="px-6 py-6 font-black text-secondary text-base tracking-tighter">₨ {p.price.toLocaleString()}</td>
                                                <td className="px-6 py-6"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'available' ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}><span className={`w-1.5 h-1.5 rounded-full ${p.status === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />{p.status === 'available' ? 'Active Listing' : 'Sold Out'}</span></td>
                                                <td className="px-8 py-6 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => router.push(`/seller?id=${p.id}`)} className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all"><Plus size={16} /></button><button className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={16} /></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table></div>
                            </div>
                        </div>
                    )}

                    {/* SALES ORDER MANAGER */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                                <div><h2 className="text-xl font-black text-secondary flex items-center gap-2 tracking-tighter"><ShoppingCart size={22} className="text-primary" /> Processing Orders</h2><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Real-time sales tracking & fulfillment</p></div>
                                <div className="flex items-center gap-3 px-5 py-2.5 bg-secondary text-white rounded-2xl shadow-xl shadow-secondary/10"><Clock size={16} className="text-primary animate-pulse" /><span className="text-xs font-black uppercase tracking-widest">{stats.pendingOrders} To Process</span></div>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                {sellerOrders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 hover:shadow-2xl hover:shadow-secondary/5 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-bl-[4rem] -z-10 group-hover:bg-primary/5 transition-colors" />
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                                <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl border border-gray-50 shrink-0"><img src={order.product?.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 italic">ID: SAN-{order.id.substring(order.id.length-6).toUpperCase()}</p>
                                                    <h3 className="text-2xl font-black text-secondary tracking-tighter leading-none">{order.product?.make} {order.product?.model}</h3>
                                                    <div className="flex flex-wrap gap-5 text-xs font-bold text-gray-500">
                                                        <span className="flex items-center gap-2"><div className="w-5 h-5 rounded-lg bg-gray-100 flex items-center justify-center"><User size={12} className="text-secondary" /></div> {order.buyer?.name}</span>
                                                        <span className="flex items-center gap-2 tracking-tighter italic"><Clock size={14} /> Received: {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        <span className="text-primary font-black text-base drop-shadow-sm">₨ {order.totalPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center gap-6 self-center xl:self-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-gray-50 w-full xl:w-auto">
                                                <div className="flex flex-col items-center sm:items-end flex-1 xl:flex-none"><p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-[0.2em]">Fulfillment Scale</p><StatusBadge status={order.status} /></div>
                                                <div className="hidden sm:block h-12 w-px bg-gray-100" />
                                                <div className="flex gap-3 w-full sm:w-auto">
                                                    <button onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')} disabled={order.status !== 'pending'} className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-secondary text-white text-[10px] font-black uppercase shadow-lg shadow-secondary/20 hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:translate-y-0">Confirm</button>
                                                    <button onClick={() => handleUpdateOrderStatus(order.id, 'shipped')} disabled={order.status !== 'confirmed'} className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:translate-y-0">Shipment</button>
                                                    <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} disabled={['delivered', 'cancelled'].includes(order.status)} className="p-3.5 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"><XCircle size={20} /></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50 group-hover:bg-white transition-colors duration-500">
                                            <div className="space-y-2"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />Dispatch Location</p><p className="text-xs font-bold text-gray-700 leading-relaxed italic">{order.shippingAddress?.fullName}<br/>{order.shippingAddress?.address}<br/>{order.shippingAddress?.city}, Pakistan</p></div>
                                            <div className="space-y-2"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />Secure Contact</p><p className="text-base font-black text-primary tracking-widest font-mono group-hover:scale-105 origin-left transition-transform">{order.shippingAddress?.phone}</p></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* POST PART UI */}
                    {activeTab === 'post' && (
                        <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-700">
                             <div className="bg-white rounded-[3rem] shadow-2xl shadow-secondary/5 border border-gray-100 overflow-hidden">
                                <div className="bg-secondary px-10 py-10 flex items-center justify-between relative overflow-hidden group/header">
                                    <div className="absolute top-0 right-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover/header:bg-primary/20 transition-all duration-700" />
                                    <div className="relative z-10"><h2 className="text-3xl font-black !text-white tracking-tighter">Submit Product Listing</h2><p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Global Marketplace Integration</p></div>
                                    <div className="flex flex-col items-end gap-2 relative z-10">
                                        <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl"><Send size={24} className="text-white group-hover/header:translate-x-1 group-hover/header:-translate-y-1 transition-transform" /></div>
                                        {isStandardUser && (
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md ${sellerProducts.length >= 3 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-emerald-400'}`}>
                                                {sellerProducts.length}/3 Slots Used
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <form onSubmit={handlePublish} className="p-10 lg:p-14 space-y-12">
                                    {isStandardUser && sellerProducts.length >= 3 && !editId && (
                                        <div className="bg-red-500/10 border-2 border-red-500/20 text-red-500 p-8 rounded-[2.5rem] flex items-start gap-5 animate-in slide-in-from-top duration-500">
                                            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20"><AlertCircle size={24} /></div>
                                            <div className="space-y-1">
                                                <p className="font-black text-lg uppercase tracking-tight">Standard Listing Limit Reached</p>
                                                <p className="text-sm font-medium opacity-80 leading-relaxed">You have utilized all 3 complimentary listing slots. To post more products and unlock premium features, please upgrade to a <span className="font-black underline cursor-pointer hover:text-red-600 transition-colors">Verified Seller Account.</span></p>
                                            </div>
                                        </div>
                                    )}
                                    {publishSuccess && <div className="bg-emerald-50 border-2 border-emerald-100 text-emerald-800 px-8 py-5 rounded-3xl flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500 shadow-xl shadow-emerald-500/5"><div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0"><CheckCircle2 size={24} /></div><div className="space-y-0.5"><p className="font-black text-sm uppercase tracking-tight">Listing Deployed!</p><p className="text-xs font-semibold opacity-80">Your product is now indexed across the Sanatkar network.</p></div></div>}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        <div className="space-y-3 group"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-primary transition-colors italic">Manufacturer / Brand</label><input name="brand" value={formData.brand} onChange={handleInputChange} required placeholder="e.g. Brother" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white text-sm font-black text-secondary outline-none transition-all shadow-sm" /></div>
                                        <div className="space-y-3 group relative"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-primary transition-colors italic">Category / Type</label><div onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent hover:border-primary/20 cursor-pointer flex items-center justify-between text-sm font-black transition-all shadow-sm"><span className={formData.category ? 'text-secondary' : 'text-gray-400'}>{formData.category || 'Identify Product Type'}</span><ChevronDown size={14} className={`text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} /></div>
                                            {showCategoryDropdown && (<div className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] overflow-hidden animate-in fade-in zoom-in-95"><div className="max-h-64 overflow-y-auto p-3 custom-scrollbar">
                                                {categories.map((c) => (
                                                    <div key={c.id} className="px-5 py-3.5 rounded-2xl hover:bg-primary/5 transition-all cursor-pointer text-sm font-bold text-gray-700 flex items-center justify-between group/item" onClick={() => { setFormData(prev => ({ ...prev, category: c.name })); setShowCategoryDropdown(false); }}>
                                                        <span>{c.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => togglePopular(e, c.id, c.isPopular)}
                                                            className={`p-1.5 rounded-lg transition-all ${c.isPopular ? 'text-red-500 bg-red-50/50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50/50 opacity-0 group-hover/item:opacity-100'}`}
                                                        >
                                                            <Star className={`w-3.5 h-3.5 ${c.isPopular ? 'fill-current' : ''}`} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {categories.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-xs font-medium">No categories available</div>}
                                            </div>
                                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                                                <input
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    placeholder="Add new category..."
                                                    className="flex-grow px-4 py-2.5 rounded-xl border-2 border-transparent focus:border-primary/20 text-xs font-bold focus:outline-none bg-white shadow-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleAddCategory(); }}
                                                    disabled={addingCategory}
                                                    className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 shrink-0"
                                                >
                                                    {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            </div>)}
                                        </div>
                                        <div className="space-y-3 group"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-primary transition-colors italic">Model SKU / Compatibility</label><input name="compatibility" value={formData.compatibility} onChange={handleInputChange} required placeholder="e.g. KH-S Series" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white text-sm font-black text-secondary outline-none transition-all shadow-sm" /></div>
                                        <div className="space-y-3 group h-full"><label className="text-[10px] font-black text-primary uppercase italic tracking-[0.2em]">Listing Price (PKR)</label><div className="relative h-[58px]"><span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-primary text-lg">₨</span><input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="w-full h-full pl-12 pr-6 py-4 rounded-2xl bg-primary/5 border-2 border-primary/30 focus:border-primary focus:bg-white text-xl font-black text-secondary outline-none transition-all shadow-xl shadow-primary/5" /></div></div>
                                        <div className="space-y-3 group"><label className="text-[10px] font-black text-gray-400 uppercase italic">Quality Grade</label><select name="condition" value={formData.condition} onChange={handleInputChange} className="w-full px-6 py-[1.15rem] rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white text-sm font-black text-secondary outline-none transition-all appearance-none cursor-pointer shadow-sm"><option value="new">Brand New / Factory</option><option value="used">Used / Tested Good</option><option value="refurbished">Refurbished / Certified</option></select></div>
                                        <div className="space-y-3 group"><label className="text-[10px] font-black text-gray-400 uppercase italic">Warehouse Location</label><input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Lahore Depot" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white text-sm font-black text-secondary transition-all outline-none shadow-sm" /></div>
                                        <div className="space-y-3 group md:col-span-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] font-mono">Detailed Specifications / Maintenance Notes</label><textarea name="description" value={formData.description} onChange={handleInputChange} required rows={4} placeholder="Technical data, manufacturing origin, or shipping constraints..." className="w-full px-8 py-6 rounded-[2.5rem] bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white text-sm font-medium text-secondary outline-none transition-all resize-none shadow-sm" /></div>
                                        <div className="space-y-8 md:col-span-3">
                                            <label className={`relative border-4 border-dashed rounded-[3rem] py-16 flex flex-col items-center justify-center bg-gray-50 transition-all group/upload overflow-hidden shadow-sm ${isStandardUser && sellerProducts.length >= 3 && !editId ? 'opacity-50 cursor-not-allowed border-gray-100 grayscale' : 'hover:bg-white hover:border-primary/40 cursor-pointer border-gray-100'}`}>
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading || (isStandardUser && sellerProducts.length >= 3 && !editId)} />
                                                <Camera size={48} className="text-gray-200 group-hover/upload:text-primary transition-all duration-500 mb-6 group-hover/upload:scale-110" />
                                                <p className="text-lg font-black text-secondary uppercase tracking-[0.2em] group-hover/upload:text-primary transition-colors">Capture Asset Graphics</p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">{isStandardUser && sellerProducts.length >= 3 && !editId ? 'Upload Restricted: Limit Reached' : 'Drag & Drop or Click to browse'}</p>
                                                {uploading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[3rem]"><Loader2 className="w-12 h-12 text-primary animate-spin mb-4" /><p className="text-xs font-black text-primary uppercase tracking-widest animate-pulse">Syncing Media Assets...</p></div>}
                                            </label>
                                            {uploadedImages.length > 0 && (<div className="flex flex-wrap gap-5 px-4">
                                                {uploadedImages.map((img, idx) => (
                                                    <div key={idx} className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white group/img hover:scale-110 transition-transform duration-500">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-600/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100 transition-opacity"><X size={24} /></button>
                                                    </div>
                                                ))}
                                            </div>)}
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-8"><button type="submit" disabled={publishLoading || uploading || (isStandardUser && sellerProducts.length >= 3 && !editId)} className="bg-primary text-white px-20 py-5 rounded-[2rem] text-sm font-black shadow-[0_20px_40px_rgba(239,68,68,0.3)] hover:bg-primary-dark hover:-translate-y-1 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center gap-4 uppercase tracking-widest">
                                        {publishLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus size={24} /> {isStandardUser && sellerProducts.length >= 3 && !editId ? 'Limit Reached' : 'List Asset Now'}</>}
                                    </button></div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* SHOP SETTINGS */}
                    {activeTab === 'settings' && (
                        <div className="max-w-2xl animate-in fade-in duration-700 space-y-10 pb-20">
                             <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-2xl shadow-secondary/5 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                                <div className="flex items-center gap-5 mb-12">
                                    <div className="p-4 bg-secondary rounded-[1.5rem] text-white shadow-xl shadow-secondary/20 rotate-6 group-hover:rotate-0 transition-transform duration-500"><Settings size={28} /></div>
                                    <div className="space-y-1"><h2 className="text-2xl font-black text-secondary tracking-tighter italic uppercase">Shop Parameters</h2><p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] font-mono">Store configuration keys</p></div>
                                </div>
                                <form className="space-y-8">
                                    <div className="space-y-3 group"><label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-primary transition-colors">Store Display Name</label><input type="text" defaultValue={authUser?.name || ''} placeholder="My Professional Shop" className="w-full px-6 py-4.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white text-xs font-bold text-secondary outline-none transition-all shadow-sm" /></div>
                                    <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 relative group/badge overflow-hidden">
                                        <div className="absolute inset-0 bg-white/40 translate-x-full group-hover/badge:-translate-x-full transition-transform duration-1000 skew-x-12" />
                                        <div className="flex items-start gap-5 relative z-10"><div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20"><Shield size={20} className="text-white" /></div><div className="space-y-1.5"><p className="text-xs font-black text-emerald-900 uppercase tracking-widest tracking-tight">Verified Professional Badge</p><p className="text-[10px] text-emerald-700 font-semibold leading-relaxed max-w-sm">Your store is verified as a professional seller on Sanatkar. Build confidence with large-scale buyers through high-quality listings.</p></div></div>
                                    </div>
                                    <button disabled className="w-full py-5 rounded-[1.5rem] bg-gray-100 text-gray-400 text-xs font-black uppercase tracking-[0.3em] cursor-not-allowed border border-gray-200 shadow-inner">Update Shop Profile (In Dev)</button>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function SellerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <SellerContent />
        </Suspense>
    );
}
