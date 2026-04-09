'use client';

import { useEffect, useState, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Eye, EyeOff, AlertCircle, LogOut, Camera, ArrowRight, User, Lock, Save, Send, Loader2, X, Plus, Star, ChevronDown } from 'lucide-react';

function SellerContent() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams?.get('id');

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, authLoading, router]);

    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [formData, setFormData] = useState({
        brand: '',
        category: '',
        compatibility: '',
        price: '',
        description: '',
        condition: 'new',
        stockStatus: 'In Stock',
        location: '',
    });
    const [publishLoading, setPublishLoading] = useState(false);
    const [publishError, setPublishError] = useState('');
    const [publishSuccess, setPublishSuccess] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, authLoading, router]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (res.ok && data.user) {
                    setUser(data.user);
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
            } finally {
                setCheckingAuth(false);
            }
        };
        checkAuth();
    }, []);

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
                        if (data.images && data.images.length > 0) {
                            setUploadedImages(data.images);
                        }
                    }
                })
                .catch(console.error);
        }
    }, [editId]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) setCategories(data.categories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

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

            if (!res.ok) {
                throw new Error(data.message || 'Invalid credentials');
            }

            setUser(data.user);
            setIsAuthenticated(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
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

        if (!formData.category) {
            setPublishError('Please select a category.');
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
                    images: uploadedImages.length > 0 ? uploadedImages : ["https://ae01.alicdn.com/kf/H9872be9c3c5448388915e7fb04899583E/KHS12-RYP-Tajima-Embroidery-Machine-Parts-Rotary-Hook.jpg"]
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to publish ad');
            }

            setPublishSuccess(true);
            setUploadedImages([]);
            setFormData({
                brand: '',
                category: '',
                compatibility: '',
                price: '',
                description: '',
                condition: 'new',
                stockStatus: 'In Stock',
                location: '',
            });
        } catch (err: any) {
            setPublishError(err.message);
        } finally {
            setPublishLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const uploadData = new FormData();
        Array.from(files).forEach(file => uploadData.append('files', file));

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setUploadedImages(prev => [...prev, ...data.urls]);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
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
                fetchCategories();
            } else {
                alert(data.message || 'Failed to add category');
            }
        } catch (err) {
            console.error('Add category error:', err);
        } finally {
            setAddingCategory(false);
        }
    };

    const togglePopular = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPopular: !currentStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setCategories(prev => prev.map(c => c._id === id ? { ...c, isPopular: !currentStatus } : c));
            }
        } catch (err) {
            console.error('Toggle popular error:', err);
        }
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col relative overflow-hidden">
                <Navbar forceSolid />

                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80"
                        alt="Background"
                        className="w-full h-full object-cover grayscale-[0.2] brightness-[0.3]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-secondary/80 via-secondary/40 to-secondary/90 backdrop-blur-[2px]" />
                </div>

                <main className="flex-grow flex items-center justify-center px-4 py-20 relative z-10">
                    <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 shadow-2xl shadow-black/50 overflow-hidden relative group">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-colors duration-500" />

                            <div className="relative z-10">
                                <div className="text-center mb-10">
                                    <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                                        <Package size={40} className="text-white" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Inventory Portal</h1>
                                    <p className="text-gray-400 text-sm font-medium tracking-wide">Enter your credentials to list your parts</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Email Address</label>
                                        <div className="relative group">
                                            <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="e.g. seller@SANATkar.com"
                                                required
                                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none text-white text-sm transition-all placeholder:text-gray-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Password</label>
                                        <div className="relative group">
                                            <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type={showPass ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                className="w-full pl-14 pr-14 py-4 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none text-white text-sm transition-all placeholder:text-gray-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPass(!showPass)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                            >
                                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-2xl px-5 py-4 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                                            <AlertCircle size={18} className="text-red-400 shrink-0" />
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 rounded-2xl bg-primary text-white text-sm font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Authenticating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign In to Portal</span>
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Demo Access</span>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">seller</span>
                                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">seller123</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-medium">© 2026 SANATKAR Industrial Network</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar forceSolid />
            <main className="flex-grow py-16 px-4">
                <div className="container-wide max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">List Your Parts</span>
                                <div className="h-px w-12 bg-primary/20" />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-secondary text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-secondary/20 relative group overflow-hidden">
                                    <User size={32} className="relative z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-secondary tracking-tight">{editId ? 'Update Your' : 'Post Your'} <span className="text-primary italic">Machine Parts</span></h1>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAuthenticated(false)}
                            className="bg-white text-secondary border border-gray-100 px-6 py-3.5 rounded-2xl font-bold text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center gap-3 shadow-xl shadow-secondary/5 group"
                        >
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Sign Out Portal</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-secondary/5 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                        <div className="bg-gradient-to-r from-secondary to-secondary/90 px-10 py-8 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-white tracking-tight">Part Specifications</h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Section 01 / Inventory Details</p>
                            </div>
                            <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 relative z-10">
                                <Package size={28} className="text-primary" />
                            </div>
                        </div>

                        <form onSubmit={handlePublish} className="p-10 space-y-12">
                            {publishSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                                        <Save size={16} />
                                    </div>
                                    <span className="font-bold">Your part has been listed successfully!</span>
                                </div>
                            )}

                            {publishError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
                                    <AlertCircle size={20} className="text-red-500" />
                                    <span className="font-bold">{publishError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                                <div className="space-y-6 lg:col-span-3">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-2 h-2 bg-primary rounded-full" />
                                        <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Part Identification</h3>
                                        <div className="flex-grow h-px bg-gray-100" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Brand / Manufacturer</label>
                                            <input
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. Tajima"
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 text-sm font-bold text-secondary transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-3 group relative">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Category</label>
                                            <div
                                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent hover:border-primary/20 cursor-pointer flex items-center justify-between transition-all"
                                            >
                                                <span className={`text-sm font-bold ${formData.category ? 'text-secondary' : 'text-gray-400'}`}>
                                                    {formData.category || 'Select Category'}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                                            </div>

                                            {showCategoryDropdown && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                                                        {categories.map((c) => (
                                                            <div
                                                                key={c._id}
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, category: c.name }));
                                                                    setShowCategoryDropdown(false);
                                                                }}
                                                                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer group/item"
                                                            >
                                                                <span className="text-sm font-bold text-gray-700">{c.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => togglePopular(e, c._id, c.isPopular)}
                                                                    className={`p-1.5 rounded-lg transition-all ${c.isPopular ? 'text-red-500 bg-red-50/50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50/50'}`}
                                                                >
                                                                    <Star className={`w-3.5 h-3.5 ${c.isPopular ? 'fill-current' : ''}`} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {categories.length === 0 && (
                                                            <div className="px-4 py-8 text-center text-gray-400 text-xs font-medium">No categories created yet</div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                                                        <input
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder="New category..."
                                                            className="flex-grow px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                        />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAddCategory(); }}
                                                            disabled={addingCategory}
                                                            className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                                        >
                                                            {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Compatibility</label>
                                            <input
                                                name="compatibility"
                                                value={formData.compatibility}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. TFMX Series"
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 text-sm font-bold text-secondary transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 lg:col-span-3">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-2 h-2 bg-primary rounded-full" />
                                        <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Pricing & Status</h3>
                                        <div className="flex-grow h-px bg-gray-100" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Price (PKR)</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-primary">Rs.</div>
                                                <input
                                                    type="number"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full pl-16 pr-6 py-5 rounded-2xl bg-primary/5 border-2 border-primary/20 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 text-lg font-black text-secondary transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Condition</label>
                                            <select
                                                name="condition"
                                                value={formData.condition}
                                                onChange={handleInputChange}
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 text-sm font-bold text-secondary transition-all outline-none appearance-none"
                                            >
                                                <option value="new">Brand New</option>
                                                <option value="used">Used / Tested</option>
                                                <option value="refurbished">Refurbished</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Stock Status</label>
                                            <select
                                                name="stockStatus"
                                                value={formData.stockStatus}
                                                onChange={handleInputChange}
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 text-sm font-bold text-secondary transition-all outline-none appearance-none"
                                            >
                                                <option>In Stock</option>
                                                <option>Out of Stock</option>
                                                <option>Limited Supply</option>
                                                <option>Bulk Order Only</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Location</label>
                                            <input
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Faisalabad"
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 text-sm font-bold text-secondary transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 lg:col-span-3">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-2 h-2 bg-primary rounded-full" />
                                        <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Part Description</h3>
                                        <div className="flex-grow h-px bg-gray-100" />
                                    </div>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        rows={4}
                                        placeholder="Technical details, part numbers, origin, etc."
                                        className="w-full px-6 py-6 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 text-sm font-medium text-secondary resize-none transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-6 lg:col-span-3">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-2 h-2 bg-primary rounded-full" />
                                        <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Part Media</h3>
                                        <div className="flex-grow h-px bg-gray-100" />
                                    </div>
                                    <label className="relative border-3 border-dashed border-gray-100 rounded-[2.5rem] py-12 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-primary/30 transition-all cursor-pointer">
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                        <Camera size={32} className="text-primary mb-4" />
                                        <p className="text-lg font-black text-secondary">Upload High Quality Images</p>
                                    </label>
                                    
                                    {uploadedImages.length > 0 && (
                                        <div className="flex flex-wrap gap-4 mt-4">
                                            {uploadedImages.map((img, idx) => (
                                                <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                                                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setUploadedImages(prev => prev.filter((_, i) => i !== idx));
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded-full backdrop-blur-sm transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 justify-end pt-10 border-t border-gray-50">
                                <button type="submit" disabled={publishLoading} className="bg-primary text-white px-12 py-5 rounded-2xl text-sm font-black shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3">
                                    {publishLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                    <span>{editId ? 'Update Part Details' : 'List Part Globally'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function SellerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-secondary">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <SellerContent />
        </Suspense>
    );
}
