'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
    Lightbulb, CheckCircle2, Loader2, Plus, X, ImagePlus,
    Phone as PhoneIcon, Sparkles, Wrench, RotateCcw,
    MessageCircle, MapPin, Tag, FileText, Camera, Send,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { FIXED_CATEGORY_OPTIONS, normalizeCategoryValue } from '@/lib/categoryConstants';

const CONDITIONS = ['new', 'used', 'refurbished'] as const;
type Condition = typeof CONDITIONS[number];
type Category = string;

const CATEGORY_OPTIONS = FIXED_CATEGORY_OPTIONS.map(({ value, label }) => ({
    id: value,
    name: label,
    slug: value,
}));

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Other'];

const CONDITION_META: Record<Condition, { label: string; icon: typeof Sparkles }> = {
    new: { label: 'New', icon: Sparkles },
    used: { label: 'Old / Used', icon: Wrench },
    refurbished: { label: 'Refurbished', icon: RotateCcw },
};

const DESCRIPTION_TAGS = [
    'Like New Condition', 'First Owner', 'Genuine Parts', 'Full Service History',
    'Price Negotiable', 'Fresh Import', 'Minor Used', 'Authorized Workshop Maintained',
    'Complete Paperwork', 'Urgent Sale', 'No Repair Needed', 'Imported Model',
];

interface FormState {
    city: string;
    make: string;
    model: string;
    year: string;
    condition: Condition;
    category: Category;
    mileage: string;
    price: string;
    description: string;
    fuelType: string;
    transmission: string;
    phone: string;
    secondaryPhone: string;
    allowWhatsapp: boolean;
}

// Small numbered section header used across the form
function SectionHeader({ step, title, icon: Icon }: { step: number; title: string; icon: typeof FileText }) {
    return (
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {step}
            </div>
            <Icon size={18} className="text-primary" />
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
        </div>
    );
}

export default function SellerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F3F4F6]" />}> 
            <SellerPageContent />
        </Suspense>
    );
}

function SellerPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user: authUser, loading: authLoading } = useAuth();

    const urlCategory = searchParams.get('category') as Category | null;
    const urlCondition = searchParams.get('condition') as Condition | null;
    const editListingId = searchParams.get('edit');

    const [form, setForm] = useState<FormState>({
        city: '',
        make: '',
        model: '',
        year: new Date().getFullYear().toString(),
        condition: (urlCondition && CONDITIONS.includes(urlCondition as Condition)) ? urlCondition as Condition : 'new',
        category: 'parts',
        mileage: '',
        price: '',
        description: '',
        fuelType: 'N/A',
        transmission: 'N/A',
        phone: '',
        secondaryPhone: '',
        allowWhatsapp: true,
    });

    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [descChars, setDescChars] = useState(995);
    const [showMoreTags, setShowMoreTags] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [editingListing, setEditingListing] = useState(false);
    const [categoryOptions] = useState(CATEGORY_OPTIONS);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            category: (urlCategory && CATEGORY_OPTIONS.some(option => option.slug === urlCategory)) ? urlCategory : prev.category,
            condition: (urlCondition && CONDITIONS.includes(urlCondition as Condition)) ? urlCondition as Condition : prev.condition,
        }));
    }, [urlCategory, urlCondition]);

    useEffect(() => {
        const loadListingForEdit = async () => {
            if (!editListingId || !authUser) return;

            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', editListingId)
                    .eq('seller_id', authUser.id)
                    .maybeSingle();

                if (error || !data) {
                    setError('Unable to load the selected listing.');
                    return;
                }

                setEditingListing(true);
                setForm((prev) => ({
                    ...prev,
                    city: data.location || prev.city,
                    make: data.brand || data.make || prev.make,
                    model: data.model || prev.model,
                    year: String(data.year || prev.year),
                    condition: (CONDITIONS.includes(data.condition as Condition) ? data.condition : prev.condition) as Condition,
                    category: normalizeCategoryValue(data.category),
                    mileage: String(data.hours || data.mileage || prev.mileage),
                    price: String(data.price || prev.price),
                    description: data.description || prev.description,
                    fuelType: data.fuelType || prev.fuelType,
                    transmission: data.transmission || prev.transmission,
                    phone: data.phone || prev.phone,
                    secondaryPhone: data.secondary_phone || data.secondaryPhone || prev.secondaryPhone,
                    allowWhatsapp: data.allow_whatsapp ?? prev.allowWhatsapp,
                }));
            } catch (err) {
                console.error('Failed to load listing for edit', err);
                setError('Unable to load the selected listing.');
            }
        };

        loadListingForEdit();
    }, [editListingId, authUser]);

    if (!authLoading && authUser === null) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md w-full">
                    <h2 className="text-xl font-semibold mb-4 text-[#1E293B]">Login Required</h2>
                    <p className="text-gray-600 mb-6">You need to be logged in to post an ad.</p>
                    <button onClick={() => router.push(`/login?next=${encodeURIComponent('/seller')}`)} className="inline-block bg-[#E44E15] text-white px-6 py-2 rounded-md hover:bg-[#c44212] transition-colors">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'description') setDescChars(995 - value.length);
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const addTag = (tag: string) => {
        const current = form.description;
        const newDesc = current ? `${current}, ${tag}` : tag;
        setDescChars(995 - newDesc.length);
        setForm(prev => ({ ...prev, description: newDesc }));
    };

    const resetDesc = () => { setForm(prev => ({ ...prev, description: '' })); setDescChars(995); };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 6) { setError('Maximum 6 images allowed'); return; }
        setImages(prev => [...prev, ...files]);
        setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        setError('');
    };

    const removeImage = (i: number) => {
        URL.revokeObjectURL(previews[i]);
        setImages(prev => prev.filter((_, idx) => idx !== i));
        setPreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.city || !form.make || !form.price || !form.description || !form.phone) {
            setError('Please fill all required fields marked with *');
            return;
        }

        try {
            setSubmitting(true);
            const supabase = createClient();

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                setError('Please log in to post an ad.');
                return;
            }

            const basePayload: Record<string, unknown> = {
                title: `${form.make} ${form.model}`.trim(),
                brand: form.make,
                category: normalizeCategoryValue(form.category),
                price: Number(form.price),
                year: Number(form.year) || new Date().getFullYear(),
                hours: Number(form.mileage) || 0,
                location: form.city,
                description: form.description,
                image_urls: [],
                seller_id: user.id,
                condition: form.condition,
                status: 'active',
                phone: form.phone,
                secondary_phone: form.secondaryPhone,
                allow_whatsapp: form.allowWhatsapp,
            };

            let listing: { id: string } | null = null;
            let insertError: { message?: string } | null = null;

            if (editListingId) {
                const result = await supabase
                    .from('listings')
                    .update(basePayload)
                    .eq('id', editListingId)
                    .eq('seller_id', user.id)
                    .select('id')
                    .single();

                listing = result.data as { id: string } | null;
                insertError = result.error;
            } else {
                const result = await supabase
                    .from('listings')
                    .insert(basePayload)
                    .select('id')
                    .single();

                listing = result.data as { id: string } | null;
                insertError = result.error;
            }

            if (insertError) {
                if (insertError.message?.includes('AD_LIMIT_REACHED')) {
                    setError('You have reached the 3-ad limit. Upgrade to a Seller account to post more ads.');
                } else {
                    setError(insertError.message || (editListingId ? 'Failed to update listing.' : 'Failed to post listing.'));
                }
                return;
            }

            if (!listing?.id) {
                setError(editListingId ? 'Failed to update listing.' : 'Failed to create listing.');
                return;
            }

            let uploadedUrls: string[] = [];
            if (images.length > 0) {
                setUploading(true);

                uploadedUrls = await Promise.all(images.map(async (image) => {
                    const preferredBuckets = ['listing-images', 'listings', 'images', 'public', 'uploads'];
                    let availableBuckets: string[] = [];

                    try {
                        const { data, error } = await supabase.storage.listBuckets();
                        if (!error) {
                            availableBuckets = (data || [])
                                .map((bucket: { name?: string }) => bucket.name)
                                .filter(Boolean) as string[];
                        }
                    } catch {
                        // Ignore and use the preferred names.
                    }

                    const bucketCandidates = Array.from(new Set([...preferredBuckets, ...availableBuckets]));
                    const fileName = `${Date.now()}-${image.name.replace(/\s+/g, '-').slice(0, 80)}`;
                    const path = `${user.id}/${listing.id}-${fileName}`;
                    let lastError: Error | null = null;

                    for (const bucketName of bucketCandidates) {
                        const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, image, { upsert: true });
                        if (!uploadError) {
                            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
                            return publicUrlData.publicUrl;
                        }

                        const message = uploadError.message?.toLowerCase() || '';
                        if (!message.includes('bucket') && !message.includes('not found')) {
                            break;
                        }

                        lastError = new Error(uploadError.message);
                    }

                    throw lastError || new Error('Image upload failed');
                }));
            }

            const { error: updateError } = await supabase
                .from('listings')
                .update({ image_urls: uploadedUrls })
                .eq('id', listing.id)
                .eq('seller_id', user.id);

            if (updateError) throw updateError;

            setSuccess(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to post listing';
            setError(message.includes('AD_LIMIT_REACHED') ? 'You have reached the 3-ad limit. Upgrade to a Seller account to post more ads.' : message);
            setUploading(false);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 pt-20">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-md w-full">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={36} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ad Posted Successfully!</h2>
                        <p className="text-gray-500 mb-6">Your {form.category} listing has been submitted and is under review.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => { setSuccess(false); setImages([]); setPreviews([]); }} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:border-primary hover:text-primary transition-colors text-sm">
                                Post Another
                            </button>
                            <Link href="/buyer" className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">
                                View Listings
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const isMachine = form.category === 'machines';
    const visibleTags = showMoreTags ? DESCRIPTION_TAGS : DESCRIPTION_TAGS.slice(0, 6);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#F3F4F6] pt-20 pb-16">
                <div className="max-w-4xl mx-auto px-4">

                    {/* Page title */}
                    <div className="py-6 mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Post Your Ad</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            All fields marked with <span className="text-primary font-semibold">*</span> are mandatory
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ── SECTION 1: Listing Info ── */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <SectionHeader step={1} title="Listing Information" icon={FileText} />
                            <div className="px-6 py-6 space-y-5">

                                {/* Category */}
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-3">
                                        {categoryOptions.map(option => (
                                            <button key={option.slug} type="button" onClick={() => setForm(p => ({ ...p, category: option.slug }))}
                                                className={`flex-1 min-w-[140px] py-2.5 rounded-lg border font-semibold text-sm transition-colors ${form.category === option.slug ? 'bg-primary border-primary text-white' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                                                {option.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* City */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1 flex items-center justify-end gap-1.5">
                                        <MapPin size={14} className="text-gray-400" /> City <span className="text-primary">*</span>
                                    </label>
                                    <div className="col-span-2">
                                        <select name="city" value={form.city} onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                                            <option value="">Select City</option>
                                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Make / Model */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1">{isMachine ? 'Brand / Name' : 'Part Name'} <span className="text-primary">*</span></label>
                                    <div className="col-span-2">
                                        <input name="make" value={form.make} onChange={handleChange}
                                            placeholder={isMachine ? 'e.g. Toyota, Siemens' : 'e.g. Brake Pad, Filter'}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                    </div>
                                </div>

                              

                                {/* Condition */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1">Condition <span className="text-primary">*</span></label>
                                    <div className="col-span-2 flex gap-2">
                                        {CONDITIONS.map(c => {
                                            const { label, icon: Icon } = CONDITION_META[c];
                                            const active = form.condition === c;
                                            return (
                                                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, condition: c }))}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${active ? 'bg-primary border-primary text-white' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                                                    <Icon size={15} />
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Year */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1">Year</label>
                                    <div className="col-span-2 grid grid-cols-2 gap-3">
                                        <input name="year" type="number" value={form.year} onChange={handleChange}
                                            min="1900" max={new Date().getFullYear() + 1}
                                            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right col-span-1 pt-2.5">
                                        Price (Rs.) <span className="text-primary">*</span>
                                    </label>
                                    <div className="col-span-2 space-y-1">
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-sm text-gray-500 font-semibold">PKR</span>
                                            <input name="price" type="number" value={form.price} onChange={handleChange}
                                                placeholder="Price"
                                                className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Lightbulb size={12} className="text-primary" /> Please enter a realistic price to get more genuine responses.
                                        </p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1 flex items-center justify-end gap-1.5">
                                        <Tag size={14} className="text-gray-400" /> Ad Description <span className="text-primary">*</span>
                                    </label>
                                    <div className="col-span-2 space-y-2">
                                        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                            <textarea name="description" value={form.description} onChange={handleChange} rows={5}
                                                maxLength={995}
                                                placeholder={`Describe your ${isMachine ? 'machine' : 'part'}:\nExample: Like new condition, first owner, genuine parts, full service history...`}
                                                className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none resize-none" />
                                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-t border-gray-200">
                                                <span className="text-xs text-gray-400">Remaining Characters {descChars}</span>
                                                <button type="button" onClick={resetDesc} className="text-xs text-primary font-semibold hover:underline">Reset</button>
                                            </div>
                                        </div>
                                        {/* Suggestion tags */}
                                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                            <p className="text-xs text-gray-500 mb-2 font-medium">You can also use these suggestions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {visibleTags.map(tag => (
                                                    <button key={tag} type="button" onClick={() => addTag(tag)}
                                                        className="px-3 py-1 rounded-full border border-primary/40 text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors">
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                            <button type="button" onClick={() => setShowMoreTags(p => !p)}
                                                className="mt-2 text-xs font-semibold text-gray-600 hover:text-primary transition-colors">
                                                {showMoreTags ? 'Show Less' : 'Show More Suggestions'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── SECTION 2: Upload Media ── */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <SectionHeader step={2} title="Upload Media" icon={Camera} />
                            <div className="px-6 py-6">
                                {/* Drop zone */}
                                <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 mb-4">
                                    <div className="flex flex-col items-center gap-3 mb-6">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                            <ImagePlus size={28} className="text-primary" />
                                        </div>
                                        <button type="button" onClick={() => fileInputRef.current?.click()}
                                            className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2">
                                            <Plus size={16} /> Add Photos
                                        </button>
                                        <p className="text-xs text-gray-400">(Max limit 5 MB per image)</p>
                                    </div>
                                    {/* Tips */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                                        {[
                                            ['Adding at least 6 pictures', 'improves the chances for a quick sale.'],
                                            ['Adding clear Front, Back and Interior pictures', 'increases the quality of your Ad.'],
                                            ['Photos should be in', "'jpeg, jpg, png, gif' format only."],
                                            ['Pictures should be', '800x600 centre frame image'],
                                        ].map(([bold, rest], i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                                                <span><strong>{bold}</strong> {rest}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Image previews */}
                                    {previews.length > 0 && (
                                        <div className="grid grid-cols-4 gap-3 mt-5">
                                            {previews.map((src, i) => (
                                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => removeImage(i)}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-gray-900/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={10} className="text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                            {previews.length < 6 && (
                                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-primary transition-colors">
                                                    <Plus size={20} className="text-gray-400" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                            </div>
                        </div>

                        {/* ── SECTION 3: Contact Information ── */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <SectionHeader step={3} title="Contact Information" icon={PhoneIcon} />
                            <div className="px-6 py-6 space-y-5">

                                {/* Phone */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1">Mobile Number <span className="text-primary">*</span></label>
                                    <div className="col-span-2 space-y-1">
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100">
                                                <PhoneIcon size={15} className="text-gray-500" />
                                            </span>
                                            <input name="phone" value={form.phone} onChange={handleChange}
                                                placeholder="Mobile Number (03XXXXXXXXX)"
                                                maxLength={11}
                                                className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-start gap-1">
                                            <PhoneIcon size={11} className="text-primary mt-0.5 shrink-0" />
                                            Enter a genuine 11 digit mobile no. with format 03XXXXXXXXX. All inquiries will come on this number.
                                        </p>
                                    </div>
                                </div>

                                {/* Secondary Phone */}
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <label className="text-sm font-semibold text-gray-600 text-right col-span-1">Secondary Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <div className="col-span-2">
                                        <input name="secondaryPhone" value={form.secondaryPhone} onChange={handleChange}
                                            placeholder="Secondary Number"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                    </div>
                                </div>

                                {/* WhatsApp toggle */}
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <div className="col-span-1" />
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <MessageCircle size={16} className="text-primary" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 flex-1">Allow WhatsApp Contact</span>
                                        <button type="button" onClick={() => setForm(p => ({ ...p, allowWhatsapp: !p.allowWhatsapp }))}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${form.allowWhatsapp ? 'bg-primary' : 'bg-gray-300'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.allowWhatsapp ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-white border border-primary/30 rounded-xl px-4 py-3 text-primary text-sm font-medium flex items-center gap-2">
                                <X size={16} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex justify-end pb-4">
                            <button type="submit" disabled={submitting}
                                className="bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-10 py-3 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                                {submitting ? (
                                    <><Loader2 size={16} className="animate-spin" />{uploading ? 'Uploading...' : 'Posting...'}</>
                                ) : (
                                    <><Send size={16} /> Submit &amp; Continue</>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}
