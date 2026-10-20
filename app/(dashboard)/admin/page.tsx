'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck, BarChart3, Check, ChevronRight, FolderKanban, LayoutDashboard,
  LogOut, Menu, Package, Pencil, Plus, Search, Shield, Star, Store, Trash2, Users, X, XCircle
} from 'lucide-react';
import { RefreshCw, BookOpen } from 'lucide-react';
import BlogManager from '@/app/components/blog/BlogManager';

type Section = 'dashboard' | 'sellers' | 'categories' | 'brands' | 'listings' | 'badges' | 'users' | 'blogs';
type CategoryInput = {
  name: string;
  icon_code: string;
  description: string;
  image_url: string;
  is_active: boolean;
  is_popular: boolean;
};
type CategoryRecord = {
  id: string;
  name: string;
  icon_code: number | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  is_popular: boolean;
  slug?: string;
};
type BrandInput = {
  name: string;
  logo_url: string;
  description: string;
  is_active: boolean;
};
type BrandRecord = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean | null;
};

const emptyCategory: CategoryInput = {
  name: '',
  icon_code: '58345',
  description: '',
  image_url: '',
  is_active: true,
  is_popular: false,
};
const emptyBrand: BrandInput = { name: '', logo_url: '', description: '', is_active: true };

const sections: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'blogs', label: 'Manage Blogs', icon: BookOpen },
  { id: 'sellers', label: 'Verify Sellers', icon: Store },
  { id: 'categories', label: 'Categories', icon: FolderKanban },
  { id: 'brands', label: 'Brands', icon: BadgeCheck },
  { id: 'listings', label: 'Manage Listings', icon: Package },
  { id: 'badges', label: 'Badge Requests', icon: Shield },
  { id: 'users', label: 'User Management', icon: Users },
];

async function adminRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Admin request failed.');
  return result;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [sellerRequests, setSellerRequests] = useState<any[]>([]);
  const [badgeRequests, setBadgeRequests] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryInput | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [brandForm, setBrandForm] = useState<BrandInput | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);

  const supabase = createClient();

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await adminRequest('/api/admin/overview', { cache: 'no-store' });
      setProfiles(result.profiles || []);
      setListings(result.listings || []);
      setCategories(result.categories || []);
      setBrands(result.brands || []);
      setSellerRequests(result.seller_requests || []);
      setBadgeRequests(result.badge_requests || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      notify(error instanceof Error ? error.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.replace('/');
      return;
    }
    loadData();
  }, [authLoading, isAdmin, user]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const refreshOnFocus = () => { void loadData(); };
    const interval = window.setInterval(() => { void loadData(); }, 15000);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [isAdmin, user]);

  const updateProfile = async (id: string, updates: Record<string, unknown>, success: string) => {
    let payload: Record<string, unknown> = updates;
    if (updates.role === 'seller' && updates.seller_status === 'approved') payload = { action: 'approve_seller' };
    else if (updates.seller_status === 'rejected') payload = { action: 'reject_seller' };
    else if (updates.verification_status === 'approved') payload = { action: 'approve_verification' };
    else if (updates.verification_status === 'rejected') payload = { action: 'reject_verification' };
    try {
      await adminRequest(`/api/admin/profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      notify(success);
      await loadData();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to update profile.');
    }
  };

  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const togglePopular = async (id: string, popular: boolean) => {
    if (updatingCategory) return;
    setUpdatingCategory(id);
    try {
      await adminRequest(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_popular: popular }),
      });
      setCategories(items => items.map(item => item.id === id ? { ...item, is_popular: popular } : item));
      notify(popular ? 'Category marked popular' : 'Category removed from popular');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update category.');
    } finally { setUpdatingCategory(null); }
  };

  const deleteRecord = async (table: 'categories' | 'brands' | 'listings' | 'profiles', id: string) => {
    if (!window.confirm('Delete this item?')) return;
    if (table === 'profiles') {
      notify('Profiles are tied to Supabase Auth identities and cannot be deleted here.');
      return;
    }
    const endpoint = table === 'listings' ? `/api/listings/${id}` : `/api/${table}/${id}`;
    try {
      await adminRequest(endpoint, { method: 'DELETE' });
      notify('Deleted successfully');
      await loadData();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to delete item.');
    }
  };

  const saveBrand = async () => {
    if (!brandForm || savingBrand) return;
    setSavingBrand(true);
    try {
      await adminRequest(editingBrand ? `/api/brands/${editingBrand}` : '/api/brands', {
        method: editingBrand ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandForm),
      });
      setBrandForm(null);
      setEditingBrand(null);
      notify('Brand saved');
      await loadData();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save brand.');
    } finally {
      setSavingBrand(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryForm || savingCategory) return;
    setSavingCategory(true);
    try {
      await adminRequest(editingCategory ? `/api/categories/${editingCategory}` : '/api/categories', {
        method: editingCategory ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryForm,
          icon_code: Number(categoryForm.icon_code),
        }),
      });
      setCategoryForm(null);
      setEditingCategory(null);
      notify('Category saved');
      await loadData();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => `${profile.full_name || ''} ${profile.username || ''} ${profile.email || ''}`.toLowerCase().includes(search.toLowerCase()));
  const filteredListings = listings.filter(listing => `${listing.title || ''} ${listing.brand || ''} ${listing.category || ''}`.toLowerCase().includes(search.toLowerCase()));

  if (authLoading || loading && !user) return <div className="min-h-screen bg-[#071a20]" />;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#f5f8f9] text-slate-900">
      {sidebarOpen && <button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#071a20] text-white shadow-2xl transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#73e3e2] text-[#071a20]"><Shield size={22} /></div><div><p className="font-black tracking-tight">SANATKAR</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#73e3e2]">Admin control</p></div></div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          <p className="px-3 pb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Workspace</p>
          {sections.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); setSearch(''); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${section === item.id ? 'bg-[#73e3e2] text-[#071a20]' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}><Icon size={18} /><span>{item.label}</span>{item.id === 'sellers' && sellerRequests.length > 0 && <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] text-[#071a20]">{sellerRequests.length}</span>}{item.id === 'badges' && badgeRequests.length > 0 && <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] text-[#071a20]">{badgeRequests.length}</span>}</button>; })}
        </nav>
        <div className="border-t border-white/10 p-4"><div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-black text-white">A</div><div className="min-w-0"><p className="truncate text-xs font-bold">{user.email}</p><p className="text-[10px] uppercase tracking-wider text-white/40">Administrator</p></div></div><button onClick={async () => { await supabase.auth.signOut(); router.replace('/'); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white"><LogOut size={15} /> Sign out</button></div>
      </aside>

      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={21} /></button><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Admin workspace</p><h1 className="text-xl font-black capitalize">{section.replace('-', ' ')}</h1></div></div><div className="flex items-center gap-3"><div className="relative hidden sm:block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search current view" className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white" /></div><button type="button" onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:border-primary hover:text-primary"><RefreshCw size={15} /> Refresh</button></div></header>
        <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
          {message && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>}
          {section === 'blogs' && <BlogManager />}
          {section === 'dashboard' && <DashboardStats profiles={profiles} listings={listings} sellerRequests={sellerRequests} badgeRequests={badgeRequests} onNavigate={setSection} />}
          {section === 'sellers' && <SellerRequests requests={sellerRequests} onApprove={(id: string) => updateProfile(id, { role: 'seller', seller_status: 'approved' }, 'Seller approved')} onReject={(id: string) => updateProfile(id, { seller_status: 'rejected' }, 'Seller rejected')} />}
          {section === 'badges' && <BadgeRequests requests={badgeRequests} onApprove={(id: string) => updateProfile(id, { verification_status: 'approved', verification_reviewed_at: new Date().toISOString() }, 'Badge approved')} onReject={(id: string) => updateProfile(id, { verification_status: 'rejected', verification_reviewed_at: new Date().toISOString() }, 'Badge rejected')} />}
          {section === 'categories' && <CategoryManagement
            items={categories}
            onAdd={() => { setEditingCategory(null); setCategoryForm({ ...emptyCategory }); }}
            onEdit={(item: CategoryRecord) => {
              setEditingCategory(item.id);
              setCategoryForm({
                name: item.name,
                icon_code: String(item.icon_code || 58345),
                description: item.description || '',
                image_url: item.image_url || '',
                is_active: item.is_active !== false,
                is_popular: item.is_popular,
              });
            }}
            onTogglePopular={togglePopular}
            updatingCategory={updatingCategory}
            onDelete={(id: string) => deleteRecord('categories', id)}
          />}
          {section === 'brands' && <BrandManagement
            items={brands}
            onAdd={() => { setEditingBrand(null); setBrandForm({ ...emptyBrand }); }}
            onEdit={(item: BrandRecord) => {
              setEditingBrand(item.id);
              setBrandForm({
                name: item.name,
                logo_url: item.logo_url || '',
                description: item.description || '',
                is_active: item.is_active !== false,
              });
            }}
            onDelete={(id: string) => deleteRecord('brands', id)}
          />}
          {section === 'users' && <UserManagement profiles={filteredProfiles} onUpdate={(id: string, role: 'regular' | 'seller' | 'admin') => updateProfile(id, { role }, 'User role updated')} onDelete={(id: string) => deleteRecord('profiles', id)} />}
          {section === 'listings' && <ListingManagement listings={filteredListings} onUpdate={async (id: string, updates: Record<string, unknown>) => { try { await adminRequest(`/api/listings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); notify('Listing updated'); await loadData(); } catch (error) { notify(error instanceof Error ? error.message : 'Unable to update listing.'); } }} onDelete={(id: string) => deleteRecord('listings', id)} />}
        </div>
      </main>
      {categoryForm && <CategoryEditor
        value={categoryForm}
        editing={Boolean(editingCategory)}
        saving={savingCategory}
        onChange={setCategoryForm}
        onClose={() => { if (!savingCategory) { setCategoryForm(null); setEditingCategory(null); } }}
        onSave={() => void saveCategory()}
      />}
      {brandForm && <BrandEditor
        value={brandForm}
        editing={Boolean(editingBrand)}
        saving={savingBrand}
        onChange={setBrandForm}
        onClose={() => { if (!savingBrand) { setBrandForm(null); setEditingBrand(null); } }}
        onSave={() => void saveBrand()}
      />}
    </div>
  );
}

function DashboardStats({ profiles, listings, sellerRequests, badgeRequests, onNavigate }: any) {
  const cards = [{ label: 'Total users', value: profiles.length, icon: Users }, { label: 'Live listings', value: listings.filter((item: any) => item.status === 'active').length, icon: Package }, { label: 'Seller requests', value: sellerRequests.length, icon: Store }, { label: 'Badge requests', value: badgeRequests.length, icon: BadgeCheck }];
  return <div><div className="mb-8"><p className="text-sm font-bold text-primary">Command center</p><h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Platform overview</h2><p className="mt-2 text-sm text-slate-500">Review marketplace activity and keep seller operations moving.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card: any) => { const Icon = card.icon; return <button key={card.label} onClick={() => onNavigate(card.label === 'Seller requests' ? 'sellers' : card.label === 'Badge requests' ? 'badges' : card.label === 'Total users' ? 'users' : 'listings')} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p><p className="mt-3 text-3xl font-black text-slate-900">{card.value}</p></div><span className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-white"><Icon size={21} /></span></div></button>; })}</div><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-black text-slate-900">Quick actions</h3><div className="mt-4 flex flex-wrap gap-3">{['sellers', 'categories', 'brands', 'listings', 'badges', 'users'].map((item: any) => <button key={item} onClick={() => onNavigate(item)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold capitalize text-slate-600 hover:border-primary hover:text-primary">Manage {item}</button>)}</div></div></div>;
}

function SellerRequests({ requests, onApprove, onReject }: any) { return <ReviewList title="Seller verification requests" requests={requests} onApprove={onApprove} onReject={onReject} renderDetails={(item: any) => <><p className="font-black text-slate-900">{item.shop_name || 'Unnamed shop'}</p><p className="text-sm text-slate-500">{item.full_name || item.username || item.email}</p><p className="mt-2 text-sm text-slate-500">{item.shop_description}</p><p className="mt-2 text-xs font-bold text-slate-400">{item.phone || 'No phone'} {item.city ? ` · ${item.city}` : ''} {item.cnic ? ` · CNIC ${item.cnic}` : ''}</p>{item.shop_image_url && <img src={item.shop_image_url} alt="Shop" className="mt-3 h-24 w-24 rounded-xl object-cover" />}</>} />; }
function BadgeRequests({ requests, onApprove, onReject }: any) { return <ReviewList title="Paid badge requests" requests={requests} onApprove={onApprove} onReject={onReject} renderDetails={(item: any) => <><p className="font-black text-slate-900">{item.shop_name || item.full_name || item.username}</p><p className="text-sm text-slate-500">{item.email} · {item.phone || 'No phone'}</p>{item.verification_proof_url && <a href={item.verification_proof_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-primary">View payment proof</a>}</>} />; }
function ReviewList({ title, requests, onApprove, onReject, renderDetails }: any) { return <div><div className="mb-6"><h2 className="text-2xl font-black text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{requests.length} pending request{requests.length === 1 ? '' : 's'}</p></div>{requests.length === 0 ? <Empty text="No pending requests" /> : <div className="space-y-4">{requests.map((item: any) => <div key={item.id} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between"><div>{renderDetails(item)}</div><div className="flex shrink-0 gap-2"><button onClick={() => onApprove(item.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-600"><Check size={15} /> Approve</button><button onClick={() => onReject(item.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-100"><XCircle size={15} /> Reject</button></div></div>)}</div>}</div>; }
function BrandManagement({ items, onAdd, onEdit, onDelete }: {
  items: BrandRecord[];
  onAdd: () => void;
  onEdit: (item: BrandRecord) => void;
  onDelete: (id: string) => void;
}) {
  return <div>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-2xl font-black">Manage Brands</h2><p className="mt-1 text-sm text-slate-500">Create, edit, and archive marketplace brands.</p></div>
      <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 self-start rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-white"><Plus size={15} /> Add brand</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(item => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {item.logo_url ? <img src={item.logo_url} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 object-contain" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">{item.name.slice(0, 2).toUpperCase()}</span>}
        <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.is_active === false ? 'Inactive' : 'Active'}</p></div>
        <div className="flex gap-1">
          <button type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"><Pencil size={15} /></button>
          <button type="button" onClick={() => onDelete(item.id)} aria-label={`Archive ${item.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
        </div>
      </div>)}
    </div>
  </div>;
}

function BrandEditor({ value, editing, saving, onChange, onClose, onSave }: {
  value: BrandInput;
  editing: boolean;
  saving: boolean;
  onChange: (value: BrandInput) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary';
  const update = <K extends keyof BrandInput>(key: K, next: BrandInput[K]) => onChange({ ...value, [key]: next });
  const uploadImage = async (file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'brands');
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.urls) || typeof result.urls[0] !== 'string') {
        throw new Error(result.message || 'Brand image upload failed.');
      }
      update('logo_url', result.urls[0]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Brand image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };
  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="brand-editor-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between"><div><h2 id="brand-editor-title" className="text-xl font-black">{editing ? 'Edit brand' : 'Add brand'}</h2><p className="mt-1 text-sm text-slate-500">Set the brand details and visibility.</p></div><button type="button" onClick={onClose} disabled={saving || uploadingImage} aria-label="Close brand form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">×</button></div>
      <div className="space-y-4">
        <label className="block text-sm font-bold">Brand name<input autoFocus maxLength={100} value={value.name} onChange={event => update('name', event.target.value)} className={fieldClass} placeholder="e.g. Brother" /></label>
        <div>
          <label className="block text-sm font-bold">Brand logo</label>
          <label className="mt-1.5 inline-flex cursor-pointer items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-primary">
            {uploadingImage ? 'Uploading...' : 'Choose image from device'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingImage || saving} onChange={event => { void uploadImage(event.target.files?.[0]); event.target.value = ''; }} className="sr-only" />
          </label>
          <p className="mt-1 text-xs font-normal text-slate-400">Images upload to /uploads/brands/. JPG, PNG, GIF, or WebP, up to 5 MB.</p>
          {uploadError && <p role="alert" className="mt-2 text-sm font-medium text-rose-600">{uploadError}</p>}
          <label className="mt-3 block text-sm font-bold">Or enter an image URL<input type="text" maxLength={2048} value={value.logo_url} onChange={event => update('logo_url', event.target.value)} className={fieldClass} placeholder="https://... or /uploads/brands/..." /></label>
          {value.logo_url && <div className="mt-3"><img src={value.logo_url} alt="Brand logo preview" className="h-20 w-20 rounded-xl border border-slate-200 object-contain" /></div>}
        </div>
        <label className="block text-sm font-bold">Description<textarea maxLength={1000} rows={3} value={value.description} onChange={event => update('description', event.target.value)} className={fieldClass} placeholder="Describe this brand" /></label>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={value.is_active} onChange={event => update('is_active', event.target.checked)} /> Active</label>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={saving || uploadingImage} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Cancel</button><button type="button" onClick={onSave} disabled={saving || uploadingImage || !value.name.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create brand'}</button></div>
    </section>
  </div>;
}

function CategoryManagement({ items, onAdd, onEdit, onTogglePopular, updatingCategory, onDelete }: {
  items: CategoryRecord[];
  onAdd: () => void;
  onEdit: (item: CategoryRecord) => void;
  onTogglePopular: (id: string, popular: boolean) => void;
  updatingCategory: string | null;
  onDelete: (id: string) => void;
}) {
  return <div>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-2xl font-black">Manage Categories</h2><p className="mt-1 text-sm text-slate-500">Create, edit, and archive marketplace categories.</p></div>
      <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 self-start rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-white"><Plus size={15} /> Add category</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(item => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-0"><p className="truncate font-bold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.is_active === false ? 'Inactive' : 'Active'}{item.is_popular ? ' · Popular' : ''}</p></div>
        <div className="flex gap-1">
          <button disabled={Boolean(updatingCategory)} aria-label={`${item.is_popular ? 'Remove' : 'Mark'} ${item.name} ${item.is_popular ? 'from' : 'as'} popular`} aria-pressed={Boolean(item.is_popular)} title="Popular category" onClick={() => onTogglePopular(item.id, !item.is_popular)} className="rounded-lg p-2 text-amber-500 hover:bg-amber-50 disabled:opacity-50"><Star size={17} fill={item.is_popular ? 'currentColor' : 'none'} /></button>
          <button onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"><Pencil size={15} /></button>
          <button onClick={() => onDelete(item.id)} aria-label={`Archive ${item.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
        </div>
      </div>)}
    </div>
  </div>;
}

function CategoryEditor({ value, editing, saving, onChange, onClose, onSave }: {
  value: CategoryInput;
  editing: boolean;
  saving: boolean;
  onChange: (value: CategoryInput) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary';
  const update = <K extends keyof CategoryInput>(key: K, next: CategoryInput[K]) => onChange({ ...value, [key]: next });
  const uploadImage = async (file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'categories');
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.urls) || typeof result.urls[0] !== 'string') {
        throw new Error(result.message || 'Category image upload failed.');
      }
      update('image_url', result.urls[0]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Category image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };
  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="category-editor-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between"><div><h2 id="category-editor-title" className="text-xl font-black">{editing ? 'Edit category' : 'Add category'}</h2><p className="mt-1 text-sm text-slate-500">Set the category details and visibility.</p></div><button type="button" onClick={onClose} disabled={saving} aria-label="Close category form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">×</button></div>
      <div className="space-y-4">
        <label className="block text-sm font-bold">Category name<input autoFocus maxLength={100} value={value.name} onChange={event => update('name', event.target.value)} className={fieldClass} placeholder="e.g. Sewing machines" /></label>
        <label className="block text-sm font-bold">Icon code<input type="number" step="1" value={value.icon_code} onChange={event => update('icon_code', event.target.value)} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-slate-400">Integer icon code used by the category UI.</span></label>
        <label className="block text-sm font-bold">Description<textarea maxLength={1000} rows={3} value={value.description} onChange={event => update('description', event.target.value)} className={fieldClass} placeholder="Describe what belongs in this category" /></label>
        <div>
          <label className="block text-sm font-bold">Category image</label>
          <label className="mt-1.5 inline-flex cursor-pointer items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-primary">
            {uploadingImage ? 'Uploading...' : 'Choose image from device'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingImage || saving} onChange={event => { void uploadImage(event.target.files?.[0]); event.target.value = ''; }} className="sr-only" />
          </label>
          <p className="mt-1 text-xs font-normal text-slate-400">Images upload to /uploads/categories/. JPG, PNG, GIF, or WebP, up to 5 MB.</p>
          {uploadError && <p role="alert" className="mt-2 text-sm font-medium text-rose-600">{uploadError}</p>}
          <label className="mt-3 block text-sm font-bold">Or enter an image URL<input type="text" maxLength={2048} value={value.image_url} onChange={event => update('image_url', event.target.value)} className={fieldClass} placeholder="https://... or /uploads/categories/..." /></label>
          {value.image_url && <div className="mt-3"><img src={value.image_url} alt="Category preview" className="h-24 w-24 rounded-xl border border-slate-200 object-cover" /></div>}
        </div>
        <div className="flex flex-wrap gap-5 text-sm font-semibold text-slate-700">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={value.is_active} onChange={event => update('is_active', event.target.checked)} /> Active</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={value.is_popular} onChange={event => update('is_popular', event.target.checked)} /> Popular</label>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={saving || uploadingImage} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Cancel</button><button type="button" onClick={onSave} disabled={saving || uploadingImage || !value.name.trim() || !Number.isInteger(Number(value.icon_code))} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create category'}</button></div>
    </section>
  </div>;
}
function UserManagement({ profiles, onUpdate, onDelete }: any) { return <div><div className="mb-6"><h2 className="text-2xl font-black">User management</h2><p className="mt-1 text-sm text-slate-500">Manage regular users, sellers, and administrators.</p></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{profiles.map((profile: any) => <div key={profile.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-900">{profile.full_name || profile.username || 'Unnamed user'}</p><p className="text-xs text-slate-500">{profile.email || profile.username}</p></div><div className="flex items-center gap-2"><select value={profile.role} onChange={event => onUpdate(profile.id, event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold"><option value="regular">Regular</option><option value="seller">Seller</option><option value="admin">Admin</option></select><button onClick={() => onDelete(profile.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button></div></div>)}</div></div></div>; }
function ListingManagement({ listings, onUpdate, onDelete }: any) { return <div><div className="mb-6"><h2 className="text-2xl font-black">Manage listings</h2><p className="mt-1 text-sm text-slate-500">Change status, feature, or remove marketplace listings.</p></div><div className="space-y-3">{listings.map((listing: any) => <div key={listing.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-black text-slate-900">{listing.title || 'Untitled listing'}</p><p className="mt-1 text-xs font-semibold text-slate-500">{listing.brand || 'General'} · {listing.category || 'Other'} · PKR {Number(listing.price || 0).toLocaleString()}</p></div><div className="flex flex-wrap items-center gap-2"><select value={listing.status || 'pending'} onChange={event => onUpdate(listing.id, { status: event.target.value })} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold"><option value="active">Active</option><option value="pending">Pending</option><option value="rejected">Rejected</option><option value="sold">Sold</option></select><button onClick={() => onUpdate(listing.id, { is_featured: !listing.is_featured })} className={`rounded-lg px-3 py-2 text-xs font-black ${listing.is_featured ? 'bg-amber-100 text-amber-700' : 'border border-slate-200 text-slate-500'}`}>{listing.is_featured ? 'Featured' : 'Feature'}</button><button onClick={() => onDelete(listing.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button></div></div>)}</div></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center text-sm font-bold text-slate-400">{text}</div>; }
