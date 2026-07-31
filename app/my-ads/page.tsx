'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/AuthContext';
import { FIXED_CATEGORY_OPTIONS, normalizeCategoryValue } from '@/lib/categoryConstants';
import { Pencil, Trash2, Loader2, X, ImagePlus, Plus, CheckCircle2, Send, MapPin, Phone as PhoneIcon, MessageCircle, Tag, Camera, Sparkles, Wrench, RotateCcw } from 'lucide-react';

const CONDITIONS = ['new', 'used', 'refurbished'] as const;
type Condition = (typeof CONDITIONS)[number];

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Other'];

const CONDITION_META: Record<Condition, { label: string }> = {
  new: { label: 'New' },
  used: { label: 'Old / Used' },
  refurbished: { label: 'Refurbished' },
};

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
    title: '',
    brand: '',
    category: 'parts',
    price: '',
    year: new Date().getFullYear().toString(),
    hours: '',
    location: '',
    description: '',
    make: '',
    model: '',
    city: '',
    mileage: '',
    condition: 'new',
    fuelType: 'N/A',
    transmission: 'N/A',
    phone: '',
    secondaryPhone: '',
    allowWhatsapp: true,
  };
}

function getStoragePathFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    const publicIndex = parts.indexOf('public');
    if (publicIndex === -1 || publicIndex + 2 >= parts.length) return null;

    const bucketName = parts[publicIndex + 1];
    const path = parts.slice(publicIndex + 2).join('/');
    return {
      bucketName: decodeURIComponent(bucketName),
      path: path ? decodeURIComponent(path) : null,
    };
  } catch {
    return null;
  }
}

async function getStorageBucketCandidates(supabase: ReturnType<typeof createClient>) {
  const preferredBuckets = ['listing-images', 'listings', 'images', 'public', 'uploads'];

  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (!error) {
      const availableBuckets = (data || [])
        .map((bucket: { name?: string }) => bucket.name)
        .filter(Boolean) as string[];

      return Array.from(new Set([...preferredBuckets, ...availableBuckets]));
    }
  } catch {
    // Ignore and fall back to the preferred names.
  }

  return preferredBuckets;
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

    const message = error.message?.toLowerCase() || '';
    if (!message.includes('bucket') && !message.includes('not found')) {
      break;
    }

    lastError = new Error(error.message);
  }

  throw lastError || new Error('Image upload failed');
}

async function removeImageFromStorage(supabase: ReturnType<typeof createClient>, bucketName: string, storagePath: string) {
  if (!bucketName || !storagePath) return;

  const bucketCandidates = Array.from(new Set([bucketName, 'listing-images', 'listings', 'images', 'public', 'uploads']));
  for (const candidateName of bucketCandidates) {
    try {
      const { error } = await supabase.storage.from(candidateName).remove([storagePath]);
      if (!error) return;
    } catch {
      // Ignore and try the next candidate.
    }
  }
}

export default function MyAdsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setListings((data || []) as ListingItem[]);
      }
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/my-ads');
      return;
    }

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
    setErrorMessage('');
    setSuccessMessage('');
    setSaving(false);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listing.id)
        .eq('seller_id', user.id)
        .maybeSingle();

      if (error || !data) {
        setErrorMessage('This listing could not be loaded.');
        return;
      }

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
        phone: data.phone || '',
        secondaryPhone: data.secondary_phone || '',
        allowWhatsapp: data.allow_whatsapp ?? true,
      };

      setEditingListing(data as ListingItem);
      setForm(nextForm);
      setExistingImages(Array.isArray(data.image_urls) ? data.image_urls : []);
      setRemovedExistingImages([]);
      setNewImages([]);
      setNewImagePreviews([]);
    } catch (err) {
      console.error('Failed to prepare edit form', err);
      setErrorMessage('Unable to open the editor right now.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('listings').delete().eq('id', id).eq('seller_id', user.id);
      if (!error) {
        setListings((prev) => prev.filter((listing) => listing.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete listing', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (existingImages.length - removedExistingImages.length + newImages.length + files.length > 6) {
      setErrorMessage('You can keep up to 6 images total on a listing.');
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImages((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...previews]);
    setErrorMessage('');
  };

  const removeExistingImage = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
    setRemovedExistingImages((prev) => (prev.includes(imageUrl) ? prev : [...prev, imageUrl]));
  };

  const removeNewImage = (index: number) => {
    const previewToRevoke = newImagePreviews[index];
    if (previewToRevoke) URL.revokeObjectURL(previewToRevoke);
    setNewImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setNewImagePreviews((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingListing || !user) return;

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const supabase = createClient();
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        throw new Error('Please log in again to continue.');
      }

      const remainingExistingImages = existingImages.filter((imageUrl) => !removedExistingImages.includes(imageUrl));

      for (const imageUrl of removedExistingImages) {
        const pathInfo = getStoragePathFromUrl(imageUrl);
        if (pathInfo?.path) {
          await removeImageFromStorage(supabase, pathInfo.bucketName, pathInfo.path);
        }
      }

      const uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        for (const image of newImages) {
          const { publicUrl } = await uploadImageToStorage(supabase, image, authUser.id, editingListing.id);
          uploadedUrls.push(publicUrl);
        }
      }

      const finalImageUrls = [...remainingExistingImages, ...uploadedUrls];

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
        image_urls: finalImageUrls,
        status: editingListing.status || 'active',
      };

      const { error: updateError } = await supabase
        .from('listings')
        .update(payload)
        .eq('id', editingListing.id)
        .eq('seller_id', authUser.id);

      if (updateError) throw updateError;

      setSuccessMessage('Listing updated successfully.');
      await loadListings();
      resetEditor();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to update your listing.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-black">
      <Navbar forceSolid />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">My Ads</p>
            <h1 className="text-3xl font-black text-gray-900">Your listings</h1>
          </div>
          <Link href="/seller" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">Post new ad</Link>
        </div>

        {successMessage ? (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {editingListing ? (
          <div className="mb-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Edit listing</p>
                <h2 className="text-2xl font-black text-gray-900">{editingListing.title}</h2>
              </div>
              <button type="button" onClick={resetEditor} className="text-sm font-semibold text-gray-500 hover:text-primary">Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Camera size={18} className="text-primary" />
                  <h3 className="text-lg font-black text-gray-900">Listing details</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Title</label>
                    <input name="title" value={form.title} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Brand</label>
                    <input name="brand" value={form.brand} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Make</label>
                    <input name="make" value={form.make} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Model</label>
                    <input name="model" value={form.model} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {FIXED_CATEGORY_OPTIONS.map((option) => (
                        <button key={option.value} type="button" onClick={() => setForm((prev) => ({ ...prev, category: option.value }))} className={`rounded-full border px-3 py-2 text-sm font-semibold ${form.category === option.value ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Price (PKR)</label>
                    <input name="price" type="number" value={form.price} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Year</label>
                    <input name="year" type="number" value={form.year} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Hours / Mileage</label>
                    <input name="hours" type="number" value={form.hours} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Location</label>
                    <input name="location" value={form.location} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">City</label>
                    <select name="city" value={form.city} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm">
                      <option value="">Select city</option>
                      {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Mileage</label>
                    <input name="mileage" type="number" value={form.mileage} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Condition</label>
                    <div className="flex flex-wrap gap-2">
                      {CONDITIONS.map((condition) => (
                        <button key={condition} type="button" onClick={() => setForm((prev) => ({ ...prev, condition }))} className={`rounded-full border px-3 py-2 text-sm font-semibold ${form.condition === condition ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600'}`}>
                          {CONDITION_META[condition].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Fuel type</label>
                    <input name="fuelType" value={form.fuelType} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Transmission</label>
                    <input name="transmission" value={form.transmission} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Phone</label>
                    <input name="phone" value={form.phone} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Secondary phone</label>
                    <input name="secondaryPhone" value={form.secondaryPhone} onChange={handleFormChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} rows={5} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ImagePlus size={18} className="text-primary" />
                  <h3 className="text-lg font-black text-gray-900">Images</h3>
                </div>
                <div className="mb-4 flex flex-wrap gap-3">
                  {existingImages.map((imageUrl) => (
                    <div key={imageUrl} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-gray-200">
                      <img src={imageUrl} alt="Existing listing image" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(imageUrl)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {newImagePreviews.map((previewUrl, index) => (
                    <div key={`${previewUrl}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-gray-200">
                      <img src={previewUrl} alt="New listing preview" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeNewImage(index)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {(existingImages.length + newImages.length) < 6 ? (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary">
                      <Plus size={20} />
                    </button>
                  ) : null}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                <p className="text-sm text-gray-500">Add or remove photos. New images upload immediately after you save.</p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MessageCircle size={16} className="text-primary" />
                  Allow WhatsApp contact
                </label>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, allowWhatsapp: !prev.allowWhatsapp }))} className={`relative h-6 w-11 rounded-full transition-colors ${form.allowWhatsapp ? 'bg-primary' : 'bg-gray-300'}`}>
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.allowWhatsapp ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-gray-200 bg-white p-10">
            <Loader2 className="mr-3 animate-spin text-primary" size={20} />
            <span className="text-sm font-semibold text-gray-600">Loading your ads…</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
            You haven’t posted any listings yet.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <div key={listing.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <img src={Array.isArray(listing.image_urls) && listing.image_urls[0] ? listing.image_urls[0] : '/hero.jpg'} alt={listing.title} className="h-48 w-full object-cover" />
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-gray-900">{listing.title}</h2>
                      <p className="mt-1 text-sm text-gray-500">{listing.category || 'Uncategorized'}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-600">{listing.status}</span>
                  </div>
                  <p className="mb-4 text-base font-bold text-primary">PKR {Number(listing.price || 0).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(listing)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary">
                      <Pencil size={16} /> Edit
                    </button>
                    <button onClick={() => handleDelete(listing.id)} disabled={deletingId === listing.id} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                      <Trash2 size={16} /> {deletingId === listing.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
