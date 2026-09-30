'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { createClient } from '@/lib/auth/supabase/client';
import { useAuth } from '@/lib/AuthContext';
import {
    Store, Loader2, ImagePlus, X, CheckCircle2, Clock,
    ShieldCheck, AlertCircle, ArrowRight, Eye, Save,
    BadgeCheck, Sparkles, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const MAX_IMAGES = 1;

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface ShopData {
    shop_name: string | null;
    shop_description: string | null;
    shop_image_url: string | null;
    seller_status: string | null;
    verification_status: string | null;
}

function VerificationBadge({ status, rejectionReason }: { status: VerificationStatus; rejectionReason?: string | null }) {
    const config = {
        pending: {
            bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
            icon: Clock,
            label: 'Pending Review',
        },
        approved: {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            icon: BadgeCheck,
            label: 'Verified Store',
        },
        rejected: {
            bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
            icon: X,
            label: 'Rejected',
        },
    };

    const { bg, icon: Icon, label } = config[status] || config.pending;

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-all ${bg}`}>
            <Icon size={15} className="shrink-0" />
            <span>{label}</span>
        </div>
    );
}

export default function MyShopPage() {
    const router = useRouter();
    const { user: authUser, loading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [shop, setShop] = useState<ShopData | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [upgrading, setUpgrading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        if (authLoading) return;
        if (!authUser) {
            router.push('/login?next=/my-shop');
            return;
        }
        if (authUser.role !== 'seller') {
            setLoading(false);
            return;
        }
        loadShop();
    }, [authLoading, authUser]);

    const loadShop = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let { data, error } = await supabase
                .from('profiles')
                .select('shop_name, shop_description, shop_image_url, seller_status, verification_status')
                .eq('id', user.id)
                .maybeSingle();

            if (error?.message?.toLowerCase().includes('verification_status')) {
                const fallback = await supabase
                    .from('profiles')
                    .select('shop_name, shop_description, shop_image_url, seller_status')
                    .eq('id', user.id)
                    .maybeSingle();
                data = fallback.data ? { ...fallback.data, verification_status: null } : null;
                error = fallback.error;
            }

            if (error) throw error;

            if (data) {
                setShop(data);
                setTitle(data.shop_name || '');
                setDescription(data.shop_description || '');
                setExistingImages(data.shop_image_url ? [data.shop_image_url] : []);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load shop.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalCount = existingImages.length + newFiles.length + files.length;
        if (totalCount > MAX_IMAGES) {
            setError(`You can only have up to ${MAX_IMAGES} images.`);
            return;
        }
        setError('');
        setNewFiles(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setNewFilePreviews(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeExistingImage = (url: string) => {
        setExistingImages(prev => prev.filter(i => i !== url));
    };

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
        setNewFilePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Shop title is required.'); return; }
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let newImageUrl = existingImages[0] || null;

            if (newFiles.length > 0) {
                const file = newFiles[0];
                const ext = file.name.split('.').pop();
                const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('shop-images')
                    .upload(path, file, { upsert: false });

                if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

                const { data: urlData } = supabase.storage
                    .from('shop-images')
                    .getPublicUrl(path);
                newImageUrl = urlData.publicUrl;
            }

            const shopPayload = {
                shop_name: title.trim(),
                shop_description: description.trim() || null,
                shop_image_url: newImageUrl,
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(shopPayload)
                .eq('id', user.id);
                
            if (updateError) throw updateError;

            setNewFiles([]);
            setNewFilePreviews([]);
            if (newImageUrl) {
                setExistingImages([newImageUrl]);
            } else {
                setExistingImages([]);
            }
            setSuccess('Shop details saved successfully!');
            await loadShop();
        } catch (err: any) {
            setError(err.message || 'Failed to save shop.');
        } finally {
            setSaving(false);
        }
    };



    const handleUpgradeToSeller = () => {
        router.push('/profile');
    };

    const totalImages = existingImages.length + newFiles.length;
    const canAddMore = totalImages < MAX_IMAGES;

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50/50">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={40} className="animate-spin text-primary" />
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Loading Storefront...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (authUser?.role !== 'seller') {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Navbar />
                <main className="flex-grow flex items-center justify-center px-4 py-20">
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 sm:p-10 max-w-md w-full text-center relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-primary">
                            <Store size={36} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Seller Account Required</h2>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            Creating a Shop is exclusively for <strong className="text-slate-800">Seller</strong> accounts. Upgrade your account for free to unlock your storefront.
                        </p>
                        {error && (
                            <div className="p-3 mb-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}
                        <button
                            onClick={handleUpgradeToSeller}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 px-6 rounded-xl font-bold tracking-wide uppercase text-xs transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Sparkles size={16} />
                            Go to Profile to Apply
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
            <Navbar />
            <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    
                    {/* Header Banner */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    Manage <span className="text-primary">Shop</span>
                                </h1>
                                {shop && shop.seller_status && (
                                    <VerificationBadge
                                        status={shop.seller_status as VerificationStatus}
                                    />
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Setup your storefront branding, images, and public profile details.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                            {shop && (
                                <Link
                                    href={`/shop/${authUser.id}`}
                                    target="_blank"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all active:scale-[0.98]"
                                >
                                    <Eye size={16} /> View Storefront
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                        
                        {/* Left Column: Form Controls */}
                        <div className="lg:col-span-7">
                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 p-5 sm:p-8">

                            
                                <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Store size={18} className="text-primary" /> Storefront Info
                                </h2>

                                <form onSubmit={handleSave} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                            Shop Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={100}
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="e.g. Apex Industrial Solutions"
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-slate-400 placeholder:font-normal"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                            Store Description
                                        </label>
                                        <textarea
                                            rows={4}
                                            maxLength={800}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Describe your store specialties, products, or service guarantees..."
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none placeholder:text-slate-400"
                                        />
                                    </div>

                                    {/* Upload Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                                Gallery & Banner Images
                                            </label>
                                            <span className="text-xs text-slate-400 font-semibold">{totalImages}/{MAX_IMAGES}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            {/* Existing images */}
                                            {existingImages.map((url) => (
                                                <div key={url} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                                                    <img src={url} alt="Shop gallery" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(url)}
                                                        className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-xs"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* New file previews */}
                                            {newFilePreviews.map((preview, i) => (
                                                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/40 group bg-slate-100">
                                                    <img src={preview} alt="New upload preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewFile(i)}
                                                        className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-xs"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add button */}
                                            {canAddMore && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary flex flex-col items-center justify-center text-slate-400 hover:text-primary bg-slate-50/50 hover:bg-primary/5 transition-all group"
                                                >
                                                    <ImagePlus size={22} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-[11px] font-bold mt-1">Upload</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <p className="text-[11px] text-slate-400 mt-2">Recommended size: 1:1 square or 16:9 banner. JPG, PNG, WebP.</p>
                                    </div>

                                    {/* Feedback Notifications */}
                                    {error && (
                                        <div className="p-3.5 bg-rose-50/80 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                            <AlertTriangle size={16} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    {success && (
                                        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                            <CheckCircle2 size={16} className="shrink-0" />
                                            <span>{success}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold tracking-wide uppercase text-xs transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 mt-4"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Saving Details...' : shop ? 'Save Changes' : 'Create Storefront'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Right Column: Live Card Preview */}
                        <div className="lg:col-span-5 lg:sticky lg:top-28">
                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 p-5 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store Card Preview</h2>
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Live Preview</span>
                                </div>

                                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-sm">
                                    {/* Header Hero Banner */}
                                    <div className="h-28 bg-slate-800 relative overflow-hidden">
                                        {(existingImages[0] || newFilePreviews[0]) ? (
                                            <img
                                                src={existingImages[0] || newFilePreviews[0]}
                                                alt="Banner preview"
                                                className="w-full h-full object-cover opacity-60"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-primary/40" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                                    </div>

                                    {/* Content Body */}
                                    <div className="p-4 pt-0 relative">
                                        <div className="flex items-end gap-3 -mt-8 mb-3">
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-md border-2 border-white overflow-hidden flex items-center justify-center shrink-0">
                                                {(existingImages[0] || newFilePreviews[0]) ? (
                                                    <img
                                                        src={existingImages[0] || newFilePreviews[0]}
                                                        alt="Logo Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Store size={24} className="text-slate-400" />
                                                )}
                                            </div>
                                            <div className="pb-1 min-w-0">
                                                <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
                                                    {title || 'Store Name Placeholder'}
                                                </h3>
                                                {shop?.verification_status === 'approved' && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                                        <BadgeCheck size={12} /> Verified Seller
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                                            {description || 'Your store description will appear here. Add details about your offerings to build trust with buyers.'}
                                        </p>

                                        {/* Thumbnail Grid */}
                                        {[...existingImages, ...newFilePreviews].length > 1 && (
                                            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                                                {[...existingImages, ...newFilePreviews].slice(1, 3).map((img, i) => (
                                                    <img
                                                        key={i}
                                                        src={img}
                                                        alt="Thumbnail"
                                                        className="w-11 h-11 rounded-lg object-cover border border-slate-200/80"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}