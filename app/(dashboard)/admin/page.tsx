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
  const [categoryName, setCategoryName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);

  const supabase = createClient();

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    const [profilesResult, listingsResult, categoriesResult, brandsResult, sellersResult, badgesResult] = await Promise.all([
      supabase.from('profiles').select('id, username, full_name, email, phone, role, seller_status, created_at, total_listings_posted').order('created_at', { ascending: false }),
      supabase.from('listings').select('id, title, brand, category, price, status, is_featured, location, seller_id, created_at').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('profiles').select('id, username, full_name, email, phone, cnic, shop_name, shop_description, shop_address, city, shop_image_url, seller_status, created_at').eq('role', 'regular').eq('seller_status', 'pending').order('created_at'),
      supabase.from('profiles').select('id, username, full_name, email, phone, shop_name, verification_proof_url, verification_requested_at, verification_status').eq('role', 'seller').eq('verification_status', 'pending').order('verification_requested_at'),
    ]);
    setProfiles(profilesResult.data || []);
    setListings(listingsResult.data || []);
    setCategories(categoriesResult.data || []);
    setBrands(brandsResult.data || []);
    let sellerRequestData = sellersResult.data || [];
    if (sellersResult.error) {
      const fallbackSellers = await supabase
        .from('profiles')
        .select('id, username, full_name, email, phone, cnic, shop_name, shop_description, shop_image_url, seller_status, created_at')
        .eq('seller_status', 'pending')
        .order('created_at');
      sellerRequestData = (fallbackSellers.data || []).map(seller => ({
        ...seller,
        shop_address: null,
        city: null,
      }));
      if (fallbackSellers.error) {
        const minimalSellers = await supabase
          .from('profiles')
          .select('id, username, full_name, email, seller_status, created_at')
          .eq('seller_status', 'pending')
          .order('created_at');
        sellerRequestData = (minimalSellers.data || []).map(seller => ({
          ...seller,
          phone: null,
          cnic: null,
          shop_name: null,
          shop_description: null,
          shop_address: null,
          city: null,
          shop_image_url: null,
        }));
      }
    }
    setSellerRequests(sellerRequestData);
    setBadgeRequests(badgesResult.data || []);
    setLoading(false);
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
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) { notify(error.message); return; }
    notify(success);
    await loadData();
  };

  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const togglePopular = async (id: string, popular: boolean) => {
    if (updatingCategory) return;
    setUpdatingCategory(id);
    try {
      const { data, error } = await supabase.from('categories').update({ is_popular: popular }).eq('id', id).select('id').single();
      if (error || !data) { notify(error?.message || 'Could not update category'); return; }
      setCategories(items => items.map(item => item.id === id ? { ...item, is_popular: popular } : item));
      notify(popular ? 'Category marked popular' : 'Category removed from popular');
    } finally { setUpdatingCategory(null); }
  };

  const deleteRecord = async (table: 'categories' | 'brands' | 'listings' | 'profiles', id: string) => {
    if (!window.confirm('Delete this item?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { notify(error.message); return; }
    notify('Deleted successfully');
    await loadData();
  };

  const saveTaxonomy = async (table: 'categories' | 'brands') => {
    const isCategory = table === 'categories';
    const name = (isCategory ? categoryName : brandName).trim();
    const editId = isCategory ? editingCategory : editingBrand;
    if (!name) return;
    const result = editId
      ? await supabase.from(table).update({ name }).eq('id', editId)
      : await supabase.from(table).insert({ name });
    if (result.error) { notify(result.error.message); return; }
    if (isCategory) { setCategoryName(''); setEditingCategory(null); } else { setBrandName(''); setEditingBrand(null); }
    notify(`${isCategory ? 'Category' : 'Brand'} saved`);
    await loadData();
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
          {section === 'categories' && <Taxonomy onTogglePopular={togglePopular} updatingCategory={updatingCategory} title="Categories" items={categories} value={categoryName} setValue={setCategoryName} editingId={editingCategory} setEditingId={setEditingCategory} onSave={() => saveTaxonomy('categories')} onDelete={(id: string) => deleteRecord('categories', id)} />}
          {section === 'brands' && <Taxonomy title="Brands" items={brands} value={brandName} setValue={setBrandName} editingId={editingBrand} setEditingId={setEditingBrand} onSave={() => saveTaxonomy('brands')} onDelete={(id: string) => deleteRecord('brands', id)} />}
          {section === 'users' && <UserManagement profiles={filteredProfiles} onUpdate={(id: string, role: 'regular' | 'seller' | 'admin') => updateProfile(id, { role }, 'User role updated')} onDelete={(id: string) => deleteRecord('profiles', id)} />}
          {section === 'listings' && <ListingManagement listings={filteredListings} onUpdate={async (id: string, updates: Record<string, unknown>) => { const { error } = await supabase.from('listings').update(updates).eq('id', id); if (error) notify(error.message); else { notify('Listing updated'); await loadData(); } }} onDelete={(id: string) => deleteRecord('listings', id)} />}
        </div>
      </main>
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
function Taxonomy({ title, items, value, setValue, editingId, setEditingId, onSave, onDelete, onTogglePopular, updatingCategory }: any) { return <div><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black">Manage {title}</h2><p className="mt-1 text-sm text-slate-500">Create, edit, and delete marketplace {title.toLowerCase()}.</p></div><div className="flex gap-2"><input value={value} onChange={event => setValue(event.target.value)} placeholder={`${title.slice(0, -1)} name`} className="w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" /><button onClick={onSave} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-white"><Plus size={15} /> {editingId ? 'Save' : 'Add'}</button></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item: any) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="font-bold text-slate-800">{item.name}</span><div className="flex gap-1">{onTogglePopular && <button disabled={Boolean(updatingCategory)} aria-label={`${item.is_popular ? "Remove" : "Mark"} ${item.name} ${item.is_popular ? "from" : "as"} popular`} aria-pressed={Boolean(item.is_popular)} title="Popular category" onClick={() => onTogglePopular(item.id, !item.is_popular)} className="rounded-lg p-2 text-amber-500 hover:bg-amber-50 disabled:opacity-50"><Star size={17} fill={item.is_popular ? "currentColor" : "none"} /></button>}<button onClick={() => { setEditingId(item.id); setValue(item.name); }} className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"><Pencil size={15} /></button><button onClick={() => onDelete(item.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></div></div>)}</div></div>; }
function UserManagement({ profiles, onUpdate, onDelete }: any) { return <div><div className="mb-6"><h2 className="text-2xl font-black">User management</h2><p className="mt-1 text-sm text-slate-500">Manage regular users, sellers, and administrators.</p></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{profiles.map((profile: any) => <div key={profile.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-900">{profile.full_name || profile.username || 'Unnamed user'}</p><p className="text-xs text-slate-500">{profile.email || profile.username}</p></div><div className="flex items-center gap-2"><select value={profile.role} onChange={event => onUpdate(profile.id, event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold"><option value="regular">Regular</option><option value="seller">Seller</option><option value="admin">Admin</option></select><button onClick={() => onDelete(profile.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button></div></div>)}</div></div></div>; }
function ListingManagement({ listings, onUpdate, onDelete }: any) { return <div><div className="mb-6"><h2 className="text-2xl font-black">Manage listings</h2><p className="mt-1 text-sm text-slate-500">Change status, feature, or remove marketplace listings.</p></div><div className="space-y-3">{listings.map((listing: any) => <div key={listing.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-black text-slate-900">{listing.title || 'Untitled listing'}</p><p className="mt-1 text-xs font-semibold text-slate-500">{listing.brand || 'General'} · {listing.category || 'Other'} · PKR {Number(listing.price || 0).toLocaleString()}</p></div><div className="flex flex-wrap items-center gap-2"><select value={listing.status || 'pending'} onChange={event => onUpdate(listing.id, { status: event.target.value })} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold"><option value="active">Active</option><option value="pending">Pending</option><option value="rejected">Rejected</option><option value="sold">Sold</option></select><button onClick={() => onUpdate(listing.id, { is_featured: !listing.is_featured })} className={`rounded-lg px-3 py-2 text-xs font-black ${listing.is_featured ? 'bg-amber-100 text-amber-700' : 'border border-slate-200 text-slate-500'}`}>{listing.is_featured ? 'Featured' : 'Feature'}</button><button onClick={() => onDelete(listing.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button></div></div>)}</div></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center text-sm font-bold text-slate-400">{text}</div>; }
