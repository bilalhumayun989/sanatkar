'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { createClient } from '@/lib/auth/supabase/client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { FIXED_CATEGORY_OPTIONS, normalizeCategoryValue } from '@/lib/categoryConstants';
import {
  Pencil, Trash2, Loader2, X, ImagePlus, Plus, CheckCircle2, Send,
  MapPin, MessageCircle, Camera, RotateCcw, ShoppingBag, Sparkles,
  Tag, AlertCircle
} from 'lucide-react';

const CONDITIONS = ['new', 'used', 'refurbished'] as const;
type Condition = (typeof CONDITIONS)[number];

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Other'];

interface ListingItem {
  id: string;
  title: string;
  price: number;
  status: string;
  image_urls?: string[];
  category?: string;
  brand?: string;
  make?: string;
  model?: string;
  year?: number | string | null;
  hours?: number | string | null;
  location?: string | null;
  city?: string | null;
  mileage?: number | string | null;
  description?: string | null;
  condition?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  secondary_phone?: string | null;
  allow_whatsapp?: boolean | null;
  seller_id?: string | null;
}

interface ListingFormState {
  title: string;
  brand: string;
  category: string;
  price: string;
  year: string;
  hours: string;
  location: string;
  description: string;
  make: string;
  model: string;
  city: string;
  mileage: string;
  condition: Condition;
  fuelType: string;
  transmission: string;
  phone: string;
  secondaryPhone: string;
  allowWhatsapp: boolean;
}

function createEmptyForm(): ListingFormState {
  return {
    title: '', brand: '', category: 'parts', price: '',
    year: new Date().getFullYear().toString(), hours: '', location: '',
    description: '', make: '', model: '', city: '', mileage: '',
    condition: 'new', fuelType: 'N/A', transmission: 'N/A',
    phone: '', secondaryPhone: '', allowWhatsapp: true,
  };
}

function getStoragePathFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    const publicIndex = parts.indexOf('public');
    if (publicIndex === -1 || publicIndex + 2 >= parts.length) return null;
    return {
      bucketName: decodeURIComponent(parts[publicIndex + 1]),
      path: parts.slice(publicIndex + 2).join('/') ? decodeURIComponent(parts.slice(publicIndex + 2).join('/')) : null,
    };
  } catch { return null; }
}

async function getStorageBucketCandidates(supabase: ReturnType<typeof createClient>) {
  const preferred = ['listing-images', 'listings', 'images', 'public', 'uploads'];
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (!error) {
      const available = (data || []).map((b: { name?: string }) => b.name).filter(Boolean) as string[];
      return Array.from(new Set([...preferred, ...available]));
    }
  } catch { /* ignore */ }
  return preferred;
}

async function uploadImageToStorage(supabase: ReturnType<typeof createClient>, image: File, userId: string, listingId: string) {
  const bucketCandidates = await getStorageBucketCandidates(supabase);
  let lastError: Error | null = null;
  for (const bucketName of bucketCandidates) {
    const fileName = `${Date.now()}-${image.name.replace(/\s+/g, '-').slice(0, 80)}`;
    const path = `${userId}/${listingId}-${fileName}`;
    const { error } = await supabase.storage.from(bucketName).upload(path, image, { upsert: true });
    if (!error) {
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
      return { bucketName, publicUrl: publicUrlData.publicUrl };
    }
    const msg = error.message?.toLowerCase() || '';
    if (!msg.includes('bucket') && !msg.includes('not found')) break;
    lastError = new Error(error.message);
  }
  throw lastError || new Error('Image upload failed');
}

async function removeImageFromStorage(supabase: ReturnType<typeof createClient>, bucketName: string, storagePath: string) {
  if (!bucketName || !storagePath) return;
  const candidates = Array.from(new Set([bucketName, 'listing-images', 'listings', 'images', 'public', 'uploads']));
  for (const name of candidates) {
    try {
      const { error } = await supabase.storage.from(name).remove([storagePath]);
      if (!error) return;
    } catch { /* ignore */ }
  }
}

export default function MyAdsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingSoldId, setMarkingSoldId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<ListingItem | null>(null);
  const [form, setForm] = useState<ListingFormState>(createEmptyForm());
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadListings = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('listings').select('*').eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) setListings((data || []) as ListingItem[]);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login?next=/my-ads'); return; }
    loadListings();
  }, [authLoading, router, user]);

  const resetEditor = () => {
    setEditingListing(null);
    setForm(createEmptyForm());
    setExistingImages([]);
    setRemovedExistingImages([]);
    setNewImages([]);
    setNewImagePreviews([]);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const startEdit = async (listing: ListingItem) => {
    if (!user) return;
    setErrorMessage(''); setSuccessMessage(''); setSaving(false);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('listings').select('*')
        .eq('id', listing.id).eq('seller_id', user.id).maybeSingle();
      if (error || !data) { setErrorMessage(t('this_listing_not_loaded')); return; }

      const nextForm: ListingFormState = {
        title: data.title || `${data.brand || data.make || ''} ${data.model || ''}`.trim(),
        brand: data.brand || data.make || '',
        category: normalizeCategoryValue(data.category),
        price: String(data.price || ''),
        year: data.year ? String(data.year) : new Date().getFullYear().toString(),
        hours: data.hours ? String(data.hours) : data.mileage ? String(data.mileage) : '',
        location: data.location || data.city || '',
        description: data.description || '',
        make: data.make || data.brand || '',
        model: data.model || '',
        city: data.city || data.location || '',
        mileage: data.mileage ? String(data.mileage) : data.hours ? String(data.hours) : '',
        condition: (CONDITIONS.includes(data.condition as Condition) ? data.condition : 'new') as Condition,
        fuelType: data.fuel_type || 'N/A',
        transmission: data.transmission || 'N/A',
        phone: data.phone_number || data.phone || '',
        secondaryPhone: data.secondary_phone || '',
        allowWhatsapp: data.allow_whatsapp ?? true,
      };
      setEditingListing(data as ListingItem);
      setForm(nextForm);
      setExistingImages(Array.isArray(data.image_urls) ? data.image_urls : []);
      setRemovedExistingImages([]); setNewImages([]); setNewImagePreviews([]);
    } catch (err) {
      console.error('Failed to prepare edit form', err);
      setErrorMessage(t('unable_open_editor'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('listings').delete().eq('id', id).eq('seller_id', user.id);
      if (!error) setListings(prev => prev.filter(l => l.id !== id));
    } catch (err) { console.error('Failed to delete listing', err); }
    finally { setDeletingId(null); }
  };

  const handleMarkAsSold = async (id: string, currentStatus: string) => {
    if (!user || currentStatus === 'sold') return;
    const newStatus = 'sold';
    setMarkingSoldId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', id).eq('seller_id', user.id);
      if (!error) {
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        setSuccessMessage(newStatus === 'sold' ? t('listing_marked_sold') : t('listing_reactivated'));
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) { console.error('Failed to update listing status', err); }
    finally { setMarkingSoldId(null); }
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (existingImages.length - removedExistingImages.length + newImages.length + files.length > 6) {
      setErrorMessage(t('images_limit')); return;
    }
    setNewImages(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    setErrorMessage('');
  };

  const removeExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(u => u !== imageUrl));
    setRemovedExistingImages(prev => prev.includes(imageUrl) ? prev : [...prev, imageUrl]);
  };

  const removeNewImage = (index: number) => {
    const preview = newImagePreviews[index];
    if (preview) URL.revokeObjectURL(preview);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingListing || !user) return;
    setSaving(true); setErrorMessage(''); setSuccessMessage('');
    try {
      const supabase = createClient();
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error(t('log_in_again'));

      const remaining = existingImages.filter(u => !removedExistingImages.includes(u));
      for (const url of removedExistingImages) {
        const pathInfo = getStoragePathFromUrl(url);
        if (pathInfo?.path) await removeImageFromStorage(supabase, pathInfo.bucketName, pathInfo.path);
      }

      const uploadedUrls: string[] = [];
      for (const image of newImages) {
        const { publicUrl } = await uploadImageToStorage(supabase, image, authUser.id, editingListing.id);
        uploadedUrls.push(publicUrl);
      }

      const payload = {
        title: form.title || `${form.brand} ${form.model}`.trim(),
        brand: form.brand || form.make,
        category: normalizeCategoryValue(form.category),
        price: Number(form.price) || 0,
        year: Number(form.year) || new Date().getFullYear(),
        hours: Number(form.hours) || Number(form.mileage) || 0,
        location: form.location || form.city,
        description: form.description,
        condition: form.condition,
        image_urls: [...remaining, ...uploadedUrls],
        status: editingListing.status || 'active',
        phone_number: form.phone,
        secondary_phone: form.secondaryPhone,
        allow_whatsapp: form.allowWhatsapp,
      };

      const { error: updateError } = await supabase.from('listings').update(payload)
        .eq('id', editingListing.id).eq('seller_id', authUser.id);
      if (updateError) throw updateError;

      setSuccessMessage(t('listing_updated'));
      await loadListings();
      resetEditor();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : t('unable_update_listing'));
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <Navbar forceSolid />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 pt-32">

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
              <Sparkles size={14} /> {t('seller_dashboard')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t('manage_listings')}</h1>
          </div>
          <Link href="/seller"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all active:scale-95 shrink-0">
            <Plus size={18} /> {t('post_new_ad')}
          </Link>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
            <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-semibold text-rose-800 shadow-sm">
            <AlertCircle className="text-rose-600 shrink-0" size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Edit Form */}
        {editingListing && (
          <div className="mb-12 rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('editing_item')}</p>
                <h2 className="text-2xl font-black text-slate-900">{editingListing.title}</h2>
              </div>
              <button type="button" onClick={resetEditor}
                className="rounded-full bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Core Info */}
              <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 space-y-6">
                <div className="flex items-center gap-2.5 text-slate-900">
                  <Tag className="text-primary" size={20} />
                  <h3 className="text-lg font-bold">{t('item_specifications')}</h3>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('title_label')}</label>
                    <input name="title" value={form.title} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('brand_label')}</label>
                    <input name="brand" value={form.brand} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('make_label')}</label>
                    <input name="make" value={form.make} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('model_label')}</label>
                    <input name="model" value={form.model} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('price_pkr')}</label>
                    <input name="price" type="number" value={form.price} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('year')}</label>
                    <input name="year" type="number" value={form.year} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('hours_mileage')}</label>
                    <input name="hours" type="number" value={form.hours} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2.5 block text-xs font-bold uppercase text-slate-600">{t('category_label')}</label>
                  <div className="flex flex-wrap gap-2">
                    {FIXED_CATEGORY_OPTIONS.map(option => (
                      <button key={option.value} type="button"
                        onClick={() => setForm(prev => ({ ...prev, category: option.value }))}
                        className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                          form.category === option.value
                            ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="mb-2.5 block text-xs font-bold uppercase text-slate-600">{t('condition_chip')}</label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map(condition => (
                      <button key={condition} type="button"
                        onClick={() => setForm(prev => ({ ...prev, condition }))}
                        className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                          form.condition === condition
                            ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                        {condition === 'new' ? t('cond_new') : condition === 'used' ? t('cond_used') : t('cond_refurbished')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location & Contact */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('city')}</label>
                    <select name="city" value={form.city} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                      <option value="">{t('select_city')}</option>
                      {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('specific_location')}</label>
                    <input name="location" value={form.location} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('phone_label')}</label>
                    <input name="phone" value={form.phone} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('secondary_phone')}</label>
                    <input name="secondaryPhone" value={form.secondaryPhone} onChange={handleFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">{t('description_label')}</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-slate-900">
                  <Camera className="text-primary" size={20} />
                  <h3 className="text-lg font-bold">{t('photos_label')} ({existingImages.length + newImages.length}/6)</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {existingImages.map(imageUrl => (
                    <div key={imageUrl} className="relative h-28 w-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm group">
                      <img src={imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <button type="button" onClick={() => removeExistingImage(imageUrl)}
                        className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-rose-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {newImagePreviews.map((previewUrl, index) => (
                    <div key={`${previewUrl}-${index}`} className="relative h-28 w-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm group">
                      <img src={previewUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <button type="button" onClick={() => removeNewImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-rose-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {existingImages.length + newImages.length < 6 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-400 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all">
                      <Plus size={24} />
                      <span className="text-[11px] font-bold uppercase">{t('add_photo')}</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </div>

              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="text-emerald-500" size={20} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t('allow_whatsapp')}</p>
                    <p className="text-xs text-slate-500">{t('whatsapp_contact')}</p>
                  </div>
                </div>
                <button type="button"
                  onClick={() => setForm(prev => ({ ...prev, allowWhatsapp: !prev.allowWhatsapp }))}
                  className={`relative h-7 w-12 rounded-full transition-colors ${form.allowWhatsapp ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${form.allowWhatsapp ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={resetEditor}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {saving ? t('saving') : t('save_changes')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <Loader2 className="mb-4 animate-spin text-primary" size={32} />
            <span className="text-base font-bold text-slate-700">{t('loading')}</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{t('no_listings_yet')}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">{t('no_listings_desc')}</p>
            <Link href="/seller"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-all">
              <Plus size={18} /> {t('start_selling')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map(listing => {
              const isSold = listing.status === 'sold';
              return (
                <div key={listing.id}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl ${
                    isSold ? 'border-slate-200 opacity-80' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={Array.isArray(listing.image_urls) && listing.image_urls[0] ? listing.image_urls[0] : '/hero.jpg'}
                      alt={listing.title}
                      className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isSold ? 'grayscale' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
                    <div className="absolute left-4 top-4 flex gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm ${
                        isSold ? 'bg-slate-900 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {isSold ? t('sold_badge') : t('active_badge')}
                      </span>
                    </div>
                    {listing.city && (
                      <div className="absolute bottom-3 left-4 flex items-center gap-1 text-xs font-semibold text-white drop-shadow">
                        <MapPin size={14} className="text-primary" />
                        <span>{listing.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{listing.category || 'General'}</span>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</h3>
                      <p className="mt-2 text-xl font-black text-primary">PKR {Number(listing.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(listing)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95">
                          <Pencil size={15} /> {t('edit')}
                        </button>
                        <button type="button" onClick={() => handleDelete(listing.id)} disabled={deletingId === listing.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 shadow-md shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-60">
                          <Trash2 size={15} /> {deletingId === listing.id ? t('deleting') : t('delete')}
                        </button>
                      </div>
                      {!isSold ? (
                        <button type="button" onClick={() => handleMarkAsSold(listing.id, listing.status)} disabled={markingSoldId === listing.id}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-60 bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10">
                          {markingSoldId === listing.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <><ShoppingBag size={15} /> {t('mark_sold')}</>
                          )}
                        </button>
                      ) : (
                        <div className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={15} /> {t('sold_badge')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
