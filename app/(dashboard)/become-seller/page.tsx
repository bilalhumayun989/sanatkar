'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, MapPin, Phone, Store, Upload, UserRound } from 'lucide-react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';
import { fetchJson } from '@/lib/utils/fetchJson';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Other'];

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [city, setCity] = useState('');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/become-seller');
    }
  }, [authLoading, router, user]);

  const handleNext = () => {
    setMessage(null);
    if (activeStep === 1 && !imageFile) {
      setMessage({ text: 'Please add a shop photo to continue.', type: 'error' });
      return;
    }
    if (activeStep === 2 && (!shopName.trim() || !shopDescription.trim() || !shopAddress.trim() || !city)) {
      setMessage({ text: 'Please complete all shop information fields.', type: 'error' });
      return;
    }
    setActiveStep(step => Math.min(step + 1, 3));
  };

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!phone.trim() || !cnic.trim()) {
      setMessage({ text: 'Please enter your contact number and CNIC number.', type: 'error' });
      return;
    }
    setSubmitting(true);

    try {
      if (!imageFile) throw new Error('Please add a shop photo.');
      if (!user) throw new Error('You must be signed in to apply.');

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) throw new Error('Your session has expired. Please sign in again.');
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('folder', 'shops');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.success || !uploadResult.urls?.[0]) {
        throw new Error(uploadResult.message || 'Photo upload failed.');
      }
      const shopImageUrl = uploadResult.urls[0] as string;

      const { response, data } = await fetchJson('/api/profile/seller-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ shopName, shopDescription, shopAddress, city, cnic, phone, shopImageUrl }),
      });

      if (response.status === 401) {
        router.replace('/login?next=/become-seller');
        return;
      }

      if (!data.success) {
        setMessage({ text: data.message || 'Could not submit your application.', type: 'error' });
        return;
      }

      setMessage({ text: 'Application submitted. An admin will review your seller account.', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-[#F3F4F6]" />;
  }

  if (user.role === 'regular' && user.seller_status === 'pending') {
    return (
      <>
        <Navbar forceSolid />
        <main className="min-h-screen bg-[#F3F4F6] px-4 pb-16 pt-28 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Seller application</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">Request already submitted</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Your seller application is under admin review. You will see seller access here after approval.</p>
            <Link href="/profile" className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20">Back to profile</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar forceSolid />
      <main className="min-h-screen bg-[#F3F4F6] px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Store size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Seller application · Step {activeStep} of 3</p>
                <h1 className="mt-1 text-3xl font-black text-slate-900">Become a Seller</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Tell us about your business. Your application will be sent to an admin for review before seller access is enabled.</p>
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {[
              { step: 1, label: 'Shop photo', icon: ImagePlus },
              { step: 2, label: 'Shop information', icon: Store },
              { step: 3, label: 'Contact details', icon: UserRound },
            ].map(({ step, label, icon: Icon }) => (
              <button key={step} type="button" onClick={() => step < activeStep && setActiveStep(step)} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition ${activeStep === step ? 'bg-primary text-white' : step < activeStep ? 'text-primary hover:bg-primary/10' : 'text-slate-400'}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[11px]">{step}</span>
                <Icon size={15} className="hidden sm:block" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
            {activeStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Add your shop photo</h2>
                  <p className="mt-1 text-sm text-slate-500">Use a clear photo or logo that helps buyers recognize your business.</p>
                </div>
                <label className="relative flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-6 text-center transition hover:border-primary">
                  {imagePreview ? <img src={imagePreview} alt="Shop preview" className="absolute inset-0 h-full w-full object-cover" /> : <><Upload size={32} className="mb-3 text-primary" /><span className="text-sm font-bold text-slate-700">Upload shop photo</span><span className="mt-1 text-xs text-slate-400">JPG, PNG or WebP</span></>}
                  <input type="file" accept="image/*" onChange={event => handleImageChange(event.target.files?.[0])} className="sr-only" />
                  {imagePreview && <span className="absolute bottom-3 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white">Change photo</span>}
                </label>
              </div>
            )}

            {activeStep === 2 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="shopName" className="text-sm font-bold text-slate-700">Shop name *</label>
                <input id="shopName" value={shopName} onChange={event => setShopName(event.target.value)} required placeholder="e.g. Apex Industrial Solutions" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="shopDescription" className="text-sm font-bold text-slate-700">What do you sell? *</label>
                <textarea id="shopDescription" value={shopDescription} onChange={event => setShopDescription(event.target.value)} required rows={4} placeholder="Describe your products, services, experience, and the areas you serve." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="shopAddress" className="flex items-center gap-2 text-sm font-bold text-slate-700"><MapPin size={16} className="text-primary" /> Shop address *</label>
                <input id="shopAddress" value={shopAddress} onChange={event => setShopAddress(event.target.value)} required placeholder="Street, area, market or landmark" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="city" className="text-sm font-bold text-slate-700">City *</label>
                <select id="city" value={city} onChange={event => setCity(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
                  <option value="">Select city</option>
                  {CITIES.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
            )}

            {activeStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">Your contact details</h2>
                <p className="mt-1 text-sm text-slate-500">These details will be reviewed by the admin with your application.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-bold text-slate-700"><Phone size={16} className="text-primary" /> Contact number *</label>
                <input id="phone" value={phone} onChange={event => setPhone(event.target.value)} required placeholder="+92 300 0000000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </div>
              <div className="space-y-2">
                <label htmlFor="cnic" className="text-sm font-bold text-slate-700">CNIC number *</label>
                <input id="cnic" value={cnic} onChange={event => setCnic(event.target.value)} required placeholder="35201-0000000-0" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </div>
            </div>
            )}

            {message && (
              <div className={`mt-6 flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => { setMessage(null); setActiveStep(step => Math.max(step - 1, 1)); }} disabled={activeStep === 1 || submitting} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:invisible">Back</button>
              {activeStep < 3 ? (
                <button type="button" onClick={handleNext} className="rounded-xl bg-primary px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark">Continue</button>
              ) : (
                <button type="submit" disabled={submitting || message?.type === 'success'} className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting && <Loader2 size={17} className="animate-spin" />}
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
