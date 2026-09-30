'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
    Lightbulb, CheckCircle2, Loader2, Plus, X, ImagePlus,
    Phone as PhoneIcon, Sparkles, Wrench, RotateCcw,
    MessageCircle, MapPin, Tag, FileText, Camera, Send,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { createClient } from '@/lib/auth/supabase/client';
import { FIXED_CATEGORY_OPTIONS, normalizeCategoryValue } from '@/lib/categoryConstants';

import BrandSelect from '@/app/components/BrandSelect';

const CONDITIONS = ['new', 'used', 'refurbished'] as const;
type Condition = typeof CONDITIONS[number];
type Category = string;

const CATEGORY_OPTIONS = FIXED_CATEGORY_OPTIONS.map(({ value, label }) => ({
    id: value,
    name: value === 'others' ? 'Other' : label,
    slug: value,
}));

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Other'];

interface FormState {
    title: string;
    origin: string;
    stock_status: string;
    city: string;
    make: string;
    model: string;
    year: string;
    condition: Condition;
    category: Category;
    mileage: string;
    price: string;
    description: string;
    phone: string;
    allowWhatsapp: boolean;
}

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
    const { t, language } = useLanguage();

    const urlCategory = searchParams.get('category') as Category | null;
    const urlCondition = searchParams.get('condition') as Condition | null;
    const editListingId = searchParams.get('edit');

    const conditionMeta: Record<Condition, { label: string; icon: typeof Sparkles }> = {
        new: { label: t('cond_new'), icon: Sparkles },
        used: { label: t('cond_used'), icon: Wrench },
        refurbished: { label: t('cond_refurbished'), icon: RotateCcw },
    };

    const [form, setForm] = useState<FormState>({
        title: '',
        origin: '',
        stock_status: '',
        city: '',
        make: '',
        model: '',
        year: '',
        condition: (urlCondition && CONDITIONS.includes(urlCondition as Condition)) ? urlCondition as Condition : 'new',
        category: 'parts',
        mileage: '',
        price: '',
        description: '',
        phone: '',
        allowWhatsapp: true,
    });

    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [descChars, setDescChars] = useState(995);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [editingListing, setEditingListing] = useState(false);
    const [categoryOptions] = useState(CATEGORY_OPTIONS);
    const [activeStep, setActiveStep] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            category: (urlCategory && CATEGORY_OPTIONS.some(o => o.slug === urlCategory)) ? urlCategory : prev.category,
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

                if (error || !data) { setError(t('unable_open_editor')); return; }

                setEditingListing(true);
                setExistingImages(data.image_urls || []);
                setForm(prev => ({
                    ...prev,
                    title: data.title || '',
                    origin: data.origin || '',
                    stock_status: data.stock_status || '',
                    city: data.location || prev.city,
                    make: data.brand || data.make || prev.make,
                    model: data.model || prev.model,
                    year: String(data.year ?? ''),
                    condition: (CONDITIONS.includes(data.condition?.toLowerCase() as Condition) ? data.condition.toLowerCase() : prev.condition) as Condition,
                    category: normalizeCategoryValue(data.category),
                    mileage: String(data.hours ?? ''),
                    price: String(data.price ?? ''),
                    description: data.description || prev.description,
                    phone: data.phone_number || prev.phone,
                    allowWhatsapp: data.contact_option?.toLowerCase() === 'whatsapp',
                }));
            } catch {
                setError(t('unable_open_editor'));
            }
        };
        loadListingForEdit();
    }, [editListingId, authUser]);

    if (!authLoading && authUser === null) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md w-full">
                    <h2 className="text-xl font-semibold mb-4 text-[#1E293B]">{t('login_required')}</h2>
                    <p className="text-gray-600 mb-6">{t('need_login_to_post')}</p>
                    <button onClick={() => router.push(`/login?next=${encodeURIComponent('/seller')}`)} className="inline-block bg-[#E44E15] text-white px-6 py-2 rounded-md hover:bg-[#c44212] transition-colors">
                        {t('go_to_login')}
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

    const resetDesc = () => { setForm(prev => ({ ...prev, description: '' })); setDescChars(995); };

    const handleNextStep = () => {
        setError('');
        if (activeStep === 1 && (!form.title.trim() || !form.city || !form.make.trim() || !form.price || !Number.isFinite(Number(form.price)) || Number(form.price) < 0 || !form.description.trim())) {
            setError(t('fill_required_fields'));
            return;
        }
        if (activeStep === 2 && images.length + existingImages.length === 0) {
            setError(t('adding_pictures_tip'));
        }
        setActiveStep(prev => Math.min(prev + 1, 3));
    };

    const handlePreviousStep = () => {
        setError('');
        setActiveStep(prev => Math.max(prev - 1, 1));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (existingImages.length + images.length + files.length > 6) { setError(t('max_images_allowed')); return; }
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
        if (!form.title.trim() || !form.city || !form.make.trim() || !form.price || !Number.isFinite(Number(form.price)) || Number(form.price) < 0 || !form.description.trim() || !form.phone) {
            setError(t('fill_required_fields'));
            return;
        }

        try {
            setSubmitting(true);
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) { setError(t('login_required')); return; }

            const basePayload: Record<string, unknown> = {
                title: form.title.trim(),
                brand: form.make.trim(),
                model: form.model,
                category: normalizeCategoryValue(form.category),
                price: Number(form.price),
                year: form.year ? Number(form.year) : null,
                hours: form.mileage ? Number(form.mileage) : null,
                origin: form.origin.trim() || null,
                stock_status: form.stock_status || null,
                location: form.city,
                description: form.description,
                image_urls: existingImages,
                seller_id: user.id,
                condition: form.condition,
                status: 'active',
                phone_number: form.phone,
                contact_option: form.allowWhatsapp ? 'WhatsApp' : 'Call',
            };

            let listing: { id: string } | null = null;
            let insertError: { message?: string; details?: string; hint?: string } | null = null;

            if (editListingId) {
                const result = await supabase.from('listings').update(basePayload).eq('id', editListingId).eq('seller_id', user.id).select('id').single();
                listing = result.data as { id: string } | null;
                insertError = result.error;
            } else {
                const result = await supabase.from('listings').insert(basePayload).select('id').single();
                listing = result.data as { id: string } | null;
                insertError = result.error;
            }

            if (insertError) {
                if (insertError.message?.includes('AD_LIMIT_REACHED')) {
                    setError(t('ad_limit_reached'));
                } else {
                    const details = [insertError.message, insertError.details, insertError.hint].filter(Boolean).join(' ');
                    setError(details || (editListingId ? t('failed_update_listing') : t('failed_post_listing')));
                }
                return;
            }

            if (!listing?.id) { setError(editListingId ? t('failed_update_listing') : t('failed_create_listing')); return; }

            let uploadedUrls: string[] = [];
            if (images.length > 0) {
                setUploading(true);
                uploadedUrls = await Promise.all(images.map(async (image) => {
                    const preferredBuckets = ['listing-images', 'listings', 'images', 'public', 'uploads'];
                    let availableBuckets: string[] = [];
                    try {
                        const { data, error } = await supabase.storage.listBuckets();
                        if (!error) availableBuckets = (data || []).map((b: { name?: string }) => b.name).filter(Boolean) as string[];
                    } catch { /* ignore */ }
                    const bucketCandidates = Array.from(new Set([...preferredBuckets, ...availableBuckets]));
                    const fileName = `${Date.now()}-${image.name.replace(/\s+/g, '-').slice(0, 80)}`;
                    const path = `${user.id}/${listing!.id}-${fileName}`;
                    let lastError: Error | null = null;
                    for (const bucketName of bucketCandidates) {
                        const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, image, { upsert: true });
                        if (!uploadError) {
                            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
                            return publicUrlData.publicUrl;
                        }
                        const msg = uploadError.message?.toLowerCase() || '';
                        if (!msg.includes('bucket') && !msg.includes('not found')) break;
                        lastError = new Error(uploadError.message);
                    }
                    throw lastError || new Error('Image upload failed');
                }));
            }

            const { error: imageError } = await supabase.from('listings').update({ image_urls: [...existingImages, ...uploadedUrls] }).eq('id', listing.id).eq('seller_id', user.id);
            if (imageError) throw imageError;
            setSuccess(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('failed_post_listing');
            setError(message.includes('AD_LIMIT_REACHED') ? t('ad_limit_reached') : message);
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
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('ad_posted_success')}</h2>
                        <p className="text-gray-500 mb-6">{t('listing_submitted')}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => { setSuccess(false); setImages([]); setPreviews([]); setExistingImages([]); }} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:border-primary hover:text-primary transition-colors text-sm">
                                {t('post_another')}
                            </button>
                            <Link href="/buyer" className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">
                                {t('view_listings')}
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const isMachine = form.category === 'machines';

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#F3F4F6] pt-20 pb-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="py-6 mb-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">SANATKAR SELLER</p>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{editingListing ? t('edit_your_ad') : t('post_your_ad')}</h1>
                            <p className="text-sm text-gray-500 mt-1">{t('all_fields_mandatory')}</p>
                        </div>
                        <div className="text-left lg:text-right">
                            <span className="text-xs font-bold text-gray-400">STEP {activeStep} OF 3</span>
                            <div className="mt-2 h-1.5 w-48 rounded-full bg-gray-200 overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(activeStep / 3) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
                            {[
                                { step: 1, label: t('listing_information'), icon: FileText },
                                { step: 2, label: t('upload_media'), icon: Camera },
                                { step: 3, label: t('contact_section'), icon: PhoneIcon },
                            ].map(({ step, label, icon: Icon }) => (
                                <button key={step} type="button" onClick={() => step < activeStep && setActiveStep(step)}
                                    className={`flex items-center justify-center gap-2 rounded-lg px-2 py-3 text-xs sm:text-sm font-bold transition-colors ${activeStep === step ? 'bg-primary text-white shadow-sm' : step < activeStep ? 'text-primary hover:bg-primary/10' : 'text-gray-400'}`}>
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${activeStep === step ? 'bg-white/20' : 'bg-gray-100'}`}>{step}</span>
                                    <Icon size={15} className="hidden sm:block" />
                                    <span className="hidden sm:block">{label}</span>
                                </button>
                            ))}
                        </div>

                        {activeStep === 1 && <>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <SectionHeader step={1} title={t('listing_information')} icon={FileText} />
                            <div className="px-4 sm:px-8 py-6 space-y-5">

                                {/* Category */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label htmlFor="listing-category" className="text-sm font-semibold text-gray-600 text-right pt-2.5">Category *</label>
                                    <select id="listing-category" name="category" value={form.category} onChange={handleChange}
                                        className="col-span-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                                        {categoryOptions.map(option => <option key={option.slug} value={option.slug}>{option.name}</option>)}
                                    </select>
                                </div>

                                {/* City */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1 flex items-center justify-end gap-1.5">
                                        <MapPin size={14} className="text-gray-400" /> {t('city')} <span className="text-primary">*</span>
                                    </label>
                                    <div className="col-span-2">
                                        <select name="city" value={form.city} onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                                            <option value="">{t('select_city')}</option>
                                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5">Title *</label>
                                    <input aria-label="Product title" name="title" value={form.title} onChange={handleChange} required className="col-span-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                                </div>
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5">Brand *</label>
                                    <div className="col-span-2"><BrandSelect value={form.make} onChange={make => setForm(prev => ({ ...prev, make }))} /></div>
                                </div>
                                {([{ name: 'model', label: 'Model', type: 'text' }, { name: 'mileage', label: 'Hours', type: 'number' }, { name: 'origin', label: 'Origin', type: 'text' }] as const).map(field => (
                                    <div key={field.name} className="grid grid-cols-3 gap-4 items-start">
                                        <label className="text-sm font-semibold text-gray-600 text-right pt-2.5">{field.label}</label>
                                        <input aria-label={field.label} name={field.name} type={field.type} min={field.type === 'number' ? 0 : undefined} value={form[field.name]} onChange={handleChange} className="col-span-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                                    </div>
                                ))}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5">Stock status</label>
                                    <select aria-label="Stock status" name="stock_status" value={form.stock_status} onChange={handleChange} className="col-span-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
                                        <option value="">Not specified</option><option>In Stock</option><option>Out of Stock</option>
                                    </select>
                                </div>

                                {/* Condition */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1">
                                        {t('condition_label')} <span className="text-primary">*</span>
                                    </label>
                                    <div className="col-span-2 flex gap-2">
                                        {CONDITIONS.map(c => {
                                            const { label, icon: Icon } = conditionMeta[c];
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
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1">{t('year_label')}</label>
                                    <div className="col-span-2 grid grid-cols-2 gap-3">
                                        <input name="year" type="number" value={form.year} onChange={handleChange}
                                            min="1900" max={new Date().getFullYear() + 1}
                                            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right col-span-1 pt-2.5">
                                        {t('price_rs')} <span className="text-primary">*</span>
                                    </label>
                                    <div className="col-span-2 space-y-1">
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-sm text-gray-500 font-semibold">PKR</span>
                                            <input name="price" type="number" value={form.price} onChange={handleChange}
                                                placeholder={t('price')}
                                                className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Lightbulb size={12} className="text-primary" /> {t('realistic_price_tip')}
                                        </p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1 flex items-center justify-end gap-1.5">
                                        <Tag size={14} className="text-gray-400" /> {t('ad_description')} <span className="text-primary">*</span>
                                    </label>
                                    <div className="col-span-2 space-y-2">
                                        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                            <textarea name="description" value={form.description} onChange={handleChange} rows={5}
                                                maxLength={995}
                                                placeholder={isMachine ? t('describe_machine') : t('describe_part')}
                                                className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none resize-none" />
                                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-t border-gray-200">
                                                <span className="text-xs text-gray-400">{t('remaining_chars')} {descChars}</span>
                                                <button type="button" onClick={resetDesc} className="text-xs text-primary font-semibold hover:underline">{t('reset_desc')}</button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                        </>}

                        {activeStep === 2 && <>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <SectionHeader step={2} title={t('upload_media')} icon={Camera} />
                            <div className="px-4 sm:px-8 py-6">
                                <div className="border-2 border-dashed border-primary/30 rounded-xl p-5 sm:p-8 mb-4 bg-primary/[0.02]">
                                    <div className="flex flex-col items-center gap-3 mb-6">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                            <ImagePlus size={28} className="text-primary" />
                                        </div>
                                        <button type="button" onClick={() => fileInputRef.current?.click()}
                                            className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2">
                                            <Plus size={16} /> {t('add_photos')}
                                        </button>
                                        <p className="text-xs text-gray-400">{t('max_image_size')}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                                        {[
                                            t('adding_pictures_tip'),
                                            t('clear_front_back_tip'),
                                            t('photo_format_tip'),
                                            t('picture_size_tip'),
                                        ].map((tip, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {existingImages.length > 0 && <div className="mb-4 grid grid-cols-4 gap-3">
                                        {existingImages.map((src, index) => <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                                            <img src={src} alt="Saved product photo" className="h-full w-full object-cover" />
                                            <button type="button" aria-label="Remove saved photo" onClick={() => setExistingImages(current => current.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-white p-1"><X size={14} /></button>
                                        </div>)}
                                    </div>}
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
                        </>}

                        {activeStep === 3 && <>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <SectionHeader step={3} title={t('contact_section')} icon={PhoneIcon} />
                            <div className="px-4 sm:px-8 py-6 space-y-5">

                                {/* Phone */}
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <label className="text-sm font-semibold text-gray-600 text-right pt-2.5 col-span-1">
                                        {t('primary_phone')}
                                    </label>
                                    <div className="col-span-2 space-y-1">
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100">
                                                <PhoneIcon size={15} className="text-gray-500" />
                                            </span>
                                            <input name="phone" value={form.phone} onChange={handleChange}
                                                placeholder="03XXXXXXXXX"
                                                maxLength={20}
                                                className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                        </div>
                                    </div>
                                </div>

                                {/* WhatsApp toggle */}
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <div className="col-span-1" />
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <MessageCircle size={16} className="text-primary" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 flex-1">{t('whatsapp_contact')}</span>
                                        <button type="button" onClick={() => setForm(p => ({ ...p, allowWhatsapp: !p.allowWhatsapp }))}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${form.allowWhatsapp ? 'bg-primary' : 'bg-gray-300'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.allowWhatsapp ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </>}

                        {/* Error */}
                        {error && (
                            <div className="bg-white border border-primary/30 rounded-xl px-4 py-3 text-primary text-sm font-medium flex items-center gap-2">
                                <X size={16} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4 pb-1">
                            <button type="button" onClick={handlePreviousStep} disabled={activeStep === 1}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:invisible">
                                BACK
                            </button>
                            {activeStep < 3 ? (
                                <button type="button" onClick={handleNextStep}
                                    className="flex items-center gap-2 rounded-lg bg-primary px-7 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark">
                                    CONTINUE <Send size={15} />
                                </button>
                            ) : (
                                <button type="submit" disabled={submitting}
                                    className="bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-8 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                                    {submitting ? (
                                        <><Loader2 size={16} className="animate-spin" />{uploading ? t('uploading') : t('posting')}</>
                                    ) : (
                                        <><Send size={16} /> {editingListing ? t('update_listing_btn') : t('post_listing_btn')}</>
                                    )}
                                </button>
                            )}
                        </div>

                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}
