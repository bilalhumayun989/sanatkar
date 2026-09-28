'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase/client';
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  Home, 
  List, 
  MessageSquare, 
  User,
  MapPin,
  Tag,
  Calendar,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  image_urls: string[];
  status: string;
  created_at: string;
  year?: string;
  brand?: string;
  category?: string;
  description?: string;
  hours?: string;
  condition?: string;
  model?: string;
  origin?: string;
  phone_number?: string;
}

export default function MyListingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Edit State
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingAsSold, setIsMarkingAsSold] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchActiveListings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active listings:', error);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchActiveListings();
  }, [fetchActiveListings]);

  // Handle Edit Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!selectedListing) return;
    const { name, value } = e.target;
    setSelectedListing({
      ...selectedListing,
      [name]: name === 'price' ? Number(value) : value,
    });
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedListing) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('listing-images') // Apne Supabase Storage Bucket ka naam confirm kar lein
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      const newImageUrl = publicUrlData.publicUrl;

      // Append new image URL to image_urls array
      const updatedImageUrls = [...(selectedListing.image_urls || []), newImageUrl];

      setSelectedListing({
        ...selectedListing,
        image_urls: updatedImageUrls,
      });

      setMessage({ type: 'success', text: 'Image added! Don\'t forget to click Save Changes.' });
    } catch (err: unknown) {
      console.error('Image upload error:', err);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove Single Image from Modal
  const handleRemoveImage = (indexToRemove: number) => {
    if (!selectedListing) return;
    const updatedImages = selectedListing.image_urls.filter((_, idx) => idx !== indexToRemove);
    setSelectedListing({
      ...selectedListing,
      image_urls: updatedImages,
    });
  };

  // UPDATE (Update Listing details)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setIsUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('listings')
        .update({
          title: selectedListing.title,
          price: selectedListing.price,
          location: selectedListing.location,
          category: selectedListing.category,
          condition: selectedListing.condition,
          brand: selectedListing.brand,
          model: selectedListing.model,
          year: selectedListing.year,
          hours: selectedListing.hours,
          phone_number: selectedListing.phone_number,
          description: selectedListing.description,
          status: selectedListing.status,
          image_urls: selectedListing.image_urls,
        })
        .eq('id', selectedListing.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Listing updated successfully!' });
      
      // Update local state instantly
      setListings((prev) =>
        prev.map((item) => (item.id === selectedListing.id ? selectedListing : item))
      );

      setTimeout(() => {
        setSelectedListing(null);
        setMessage(null);
      }, 1000);
    } catch (err: unknown) {
      console.error('Update error:', err);
      const message = err instanceof Error ? err.message : 'Failed to update listing';
      setMessage({ type: 'error', text: message });
    } finally {
      setIsUpdating(false);
    }
  };

  // DELETE (Remove Listing)
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase.from('listings').delete().eq('id', id);

      if (error) throw error;

      setListings((prev) => prev.filter((item) => item.id !== id));
      setSelectedListing(null);
    } catch (err: unknown) {
      console.error('Delete error:', err);
      alert('Failed to delete listing');
    } finally {
      setIsDeleting(false);
    }
  };

  // MARK AS SOLD
  const handleMarkAsSold = async () => {
    if (!selectedListing) return;

    if (!confirm('Are you sure you want to mark this listing as sold?')) return;
    
    setIsMarkingAsSold(true);
    setMessage(null);

    try {
      // Update status to "sold" in database
      const { error } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', selectedListing.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Listing marked as sold!' });

      // Update local state - update the listing with sold status
      const updatedListing = { ...selectedListing, status: 'sold' };
      setSelectedListing(updatedListing);
      
      setListings((prev) =>
        prev.map((item) => (item.id === selectedListing.id ? updatedListing : item))
      );

      // Close modal after 1.5 seconds
      setTimeout(() => {
        setSelectedListing(null);
        setMessage(null);
      }, 1500);
    } catch (err: unknown) {
      console.error('Mark as sold error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark listing as sold';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsMarkingAsSold(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F6FBFC] text-slate-800 pb-24 relative">
      {/* Top Header */}
      <div className="bg-[#13BDC4] text-white py-3.5 px-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <button 
          onClick={() => router.back()} 
          className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-bold tracking-wide">My Ads</h1>
        <div className="w-5" />
      </div>

      {/* Navigation Sub-Header */}
      <div className="bg-[#13BDC4] text-white/80 text-xs font-semibold flex border-t border-white/10 sticky top-[52px] z-10 shadow-xs">
        <div className="flex-1 text-center py-2.5 border-b-2 border-white text-white font-bold">
          Active ({listings.length})
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-[#13BDC4]" />
            <p className="text-xs font-medium">Loading active ads...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center text-slate-400 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No ads found.</p>
            <p className="text-xs text-slate-400 max-w-xs">You don&apos;t have any active listings live at the moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedListing(item)}
                className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex gap-3 items-center cursor-pointer hover:border-[#13BDC4]/50 transition-colors"
              >
                {/* Image Box */}
                <div className="w-20 h-20 rounded-xl bg-slate-100 relative overflow-hidden flex-shrink-0">
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <Image
                      src={item.image_urls[0]}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Tag className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-full capitalize">
                      {item.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 truncate">{item.title}</h3>

                  <p className="text-xs font-extrabold text-[#13BDC4]">
                    Rs {item.price ? item.price.toLocaleString() : 'N/A'}
                  </p>

                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    {item.location || 'Location Not Specified'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRUD Edit/Delete Modal - FIX: Increased Z-Index to 100 & PB-20 for clear button view */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-white sticky top-0 z-10">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#13BDC4]" />
                Edit / Manage Listing
              </h2>
              <button 
                onClick={() => { setSelectedListing(null); setMessage(null); }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 pb-20">
              {message && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {message.type === 'success' && <Check className="w-4 h-4" />}
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-3 text-xs">
                {/* Images Upload / Preview Section */}
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Listing Images</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {selectedListing.image_urls?.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                        <Image src={url} alt="listing" fill sizes="64px" className="object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#13BDC4] flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-[#13BDC4] transition-colors">
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mb-0.5" />
                          <span className="text-[9px] font-medium">Add</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={selectedListing.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#13BDC4]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Price (Rs)</label>
                    <input
                      type="number"
                      name="price"
                      value={selectedListing.price}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#13BDC4]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={selectedListing.location || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#13BDC4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={selectedListing.category || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#13BDC4]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Status</label>
                    <select
                      name="status"
                      value={selectedListing.status || 'active'}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#13BDC4]"
                    >
                      <option value="active">Active</option>
                      <option value="sold">Sold</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={selectedListing.description || ''}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#13BDC4]"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 bg-[#13BDC4] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedListing.id)}
                    disabled={isDeleting}
                    className="bg-rose-50 text-rose-600 border border-rose-100 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Mark as Sold Button */}
                {selectedListing.status === 'active' && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleMarkAsSold}
                      disabled={isMarkingAsSold}
                      className="w-full bg-amber-50 text-amber-700 border-2 border-amber-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-amber-100"
                    >
                      {isMarkingAsSold ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Marking as Sold...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Mark as Sold
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-16 right-4 z-20">
        <Link
          href="/sell"
          className="bg-[#13BDC4] text-white px-4 py-3 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center gap-2 font-bold text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Ad</span>
        </Link>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 py-2 px-6 flex justify-between items-center z-20">
        <Link href="/" className="flex flex-col items-center text-slate-400 hover:text-[#13BDC4]">
          <Home className="w-5 h-5" />
        </Link>
        <Link href="/my-listings" className="flex flex-col items-center text-[#13BDC4]">
          <List className="w-5 h-5" />
        </Link>
        <Link 
          href="/sell" 
          className="w-10 h-10 rounded-full bg-[#13BDC4] text-white flex items-center justify-center -mt-5 shadow-md border-2 border-white active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </Link>
        <Link href="/messages" className="flex flex-col items-center text-slate-400 hover:text-[#13BDC4]">
          <MessageSquare className="w-5 h-5" />
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-slate-400 hover:text-[#13BDC4]">
          <User className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}