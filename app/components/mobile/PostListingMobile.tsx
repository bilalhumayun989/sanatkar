'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Upload, Info, ChevronDown, X, Loader } from 'lucide-react';
import { createClient } from '@supabase/supabase-js'; // یا آپ کا اپنا supabase client import path

// Supabase Types
interface Category {
  id: string;
  name: string;
  icon_code?: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function PostListingMobile() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  
  const [condition, setCondition] = useState('Used');
  const [contactOption, setContactOption] = useState('Call');

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    brand: '-- No Brand --',
    price: '',
    year: '',
    hours: '',
    location: '',
    model: '',
    origin: '',
    stock_status: 'Select',
    phone_number: '',
    description: ''
  });

  // Image Upload States
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // File Input Refs
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  // Supabase Table se Dynamic Categories Fetch کرنا
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setCategories(data);
          setSelectedCategory(data[0].id); // Pehli category ko default select karna
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  // Image File Change Handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);

    try {
      // Preview Image
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setImagePreviews((prev: string[]) => {
          const newPreviews = [...prev];
          newPreviews[index] = preview;
          return newPreviews;
        });
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('listings')
        .upload(`listings/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('listings')
          .getPublicUrl(`listings/${fileName}`);

        const imageUrl = publicUrlData.publicUrl;

        setUploadedImages((prev) => {
          const newImages = [...prev];
          newImages[index] = imageUrl;
          return newImages;
        });
      }
    } catch (error: any) {
      setUploadError(`Image upload failed: ${error.message}`);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Remove Image
  const removeImage = (index: number) => {
    setUploadedImages((prev: string[]) => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
    setImagePreviews((prev: string[]) => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  // Form Input Change Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        setSubmitError('Title is required');
        setSubmitting(false);
        return;
      }

      if (!formData.price.trim()) {
        setSubmitError('Price is required');
        setSubmitting(false);
        return;
      }

      if (!formData.phone_number.trim()) {
        setSubmitError('Phone number is required');
        setSubmitting(false);
        return;
      }

      if (!selectedCategory) {
        setSubmitError('Category is required');
        setSubmitting(false);
        return;
      }

      // Get Current User
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setSubmitError('User not authenticated');
        setSubmitting(false);
        return;
      }

      // Prepare Listing Data
      const listingData = {
        title: formData.title,
        brand: formData.brand,
        price: parseFloat(formData.price),
        year: formData.year || null,
        hours: formData.hours || null,
        location: formData.location,
        model: formData.model || null,
        origin: formData.origin || null,
        stock_status: formData.stock_status,
        phone_number: formData.phone_number,
        contact_option: contactOption,
        condition: condition,
        category: selectedCategory,
        description: formData.description || null,
        image_urls: uploadedImages.filter((img) => img),
        seller_id: user.id,
        status: 'active',
        is_featured: false,
      };

      // Insert into Database
      const { data: insertedListing, error: insertError } = await supabase
        .from('listings')
        .insert([listingData])
        .select();

      if (insertError) throw insertError;

      setSubmitSuccess(true);
      // Reset Form
      setFormData({
        title: '',
        brand: '-- No Brand --',
        price: '',
        year: '',
        hours: '',
        location: '',
        model: '',
        origin: '',
        stock_status: 'Select',
        phone_number: '',
        description: ''
      });
      setUploadedImages([]);
      setImagePreviews([]);
      setCondition('Used');
      setContactOption('Call');

      // Redirect after success
      setTimeout(() => {
        window.location.href = '/my-listings';
      }, 1500);
    } catch (error: any) {
      setSubmitError(`Submission failed: ${error.message}`);
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#EAEFF9] text-slate-800 pb-10 overflow-x-hidden">
      {/* Top Header */}
      <div className="bg-[#13BDC4] text-white py-3.5 px-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 active:scale-95 transition-transform">
            <ChevronLeft className="w-6 h-6 text-white" />
          </Link>
          <div className="text-base font-bold">Post a Listing</div>
        </div>
     
      </div>

      <form className="p-4 space-y-4 max-w-lg mx-auto" onSubmit={handleSubmit}>
        {/* Error Messages */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-600 leading-snug font-medium">{submitError}</p>
          </div>
        )}

        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-600 leading-snug font-medium">{uploadError}</p>
          </div>
        )}

        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-green-600 leading-snug font-medium">Listing posted successfully! Redirecting...</p>
          </div>
        )}

        {/* Photos Section */}
        <div className="space-y-1.5">
          <h2 className="text-sm font-bold text-slate-800">Photos</h2>
          <p className="text-[11px] text-slate-400 font-medium">Add Photos (Optional)</p>
          
          {/* Preview Section */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative h-24 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Buttons */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {[0, 1, 2].map((item) => (
              <label
                key={item}
                className="flex flex-col items-center justify-center h-24 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-[#13BDC4] transition-colors shadow-2xs"
              >
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {uploading ? 'Uploading...' : 'Add'}
                </span>
                <input 
                  ref={(el) => { fileInputRefs.current[item] = el; }}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageChange(e, item)}
                  disabled={uploading}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            TITLE *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="320 GG Machine"
            className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
          />
        </div>

      {/* Brand */}
<div className="space-y-1">
  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
    BRAND
  </label>
  <input
    type="text"
    name="brand"
    value={formData.brand}
    onChange={handleInputChange}
    placeholder="e.g. Caterpillar, Komatsu, or Custom Brand"
    className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
  />
</div>

        {/* Dynamic Category Badges (Fetched from Supabase) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            CATEGORY *
          </label>
          
          {loadingCategories ? (
            /* Loading Skeletons */
            <div className="flex flex-wrap items-center gap-2 py-1">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-8 w-16 bg-slate-200 rounded-full animate-pulse shrink-0"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-xs text-slate-400 py-1">No categories available</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2 py-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-[#13BDC4] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price & Year */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              PRICE *
            </label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="USD"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              YEAR
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              placeholder="2020"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
        </div>

        {/* Hours & Location */}
        <div className="grid grid-cols-2 gap-3">
         
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              LOCATION
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
        </div>

        {/* Condition & Model */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              CONDITION
            </label>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {['New', 'Used'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCondition(item)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    condition === item
                      ? 'bg-[#13BDC4] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              MODEL
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="Model No"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
        </div>

        {/* Origin & Stock Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              ORIGIN
            </label>
            <input
              type="text"
              name="origin"
              value={formData.origin}
              onChange={handleInputChange}
              placeholder="Country"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              STOCK STATUS
            </label>
            <div className="relative">
              <select 
                name="stock_status"
                value={formData.stock_status}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 appearance-none shadow-2xs pr-10">
                <option>Select</option>
                <option>In Stock</option>
                <option>Out of Stock</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Phone Number & Contact Option */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              PHONE NUMBER *
            </label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="+1 234 567"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              CONTACT OPTION
            </label>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {['Call', 'WhatsApp'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setContactOption(opt)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                    contactOption === opt
                      ? 'bg-[#13BDC4] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            DESCRIPTION
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Describe your machine..."
            className="w-full p-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs resize-none"
          />
        </div>

        {/* Notice Card */}
        <div className="bg-[#EAF7F8] border border-[#13BDC4]/30 rounded-xl p-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#13BDC4] shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-snug font-medium">
            Your listing will appear in Recently Listed for all other users immediately after posting.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className={`w-full h-12 bg-[#13BDC4] text-white rounded-xl font-bold text-xs shadow-md active:scale-[0.98] transition-transform mt-2 flex items-center justify-center gap-2 ${
            submitting || uploading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {submitting || uploading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {uploading ? 'Uploading...' : 'Posting...'}
            </>
          ) : (
            'Post Listing'
          )}
        </button>
      </form>
    </div>
  );
}