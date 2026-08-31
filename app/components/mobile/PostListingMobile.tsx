'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Upload, Info, ChevronDown } from 'lucide-react';
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

// Supabase Instance Initialize (اپنی Env Variables سے Replace کریں)
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

  return (
    <div className="w-full min-h-screen bg-[#F6FBFC] text-slate-800 pb-10 overflow-x-hidden">
      {/* Top Header */}
      <div className="bg-[#13BDC4] text-white py-3.5 px-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 active:scale-95 transition-transform">
            <ChevronLeft className="w-6 h-6 text-white" />
          </Link>
          <div className="text-base font-bold">Post a Listing</div>
        </div>
     
      </div>

      <form className="p-4 space-y-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
        {/* Photos Section */}
        <div className="space-y-1.5">
          <h2 className="text-sm font-bold text-slate-800">Photos</h2>
          <p className="text-[11px] text-slate-400 font-medium">Add Photos</p>
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {[1, 2, 3].map((item) => (
              <label
                key={item}
                className="flex flex-col items-center justify-center h-24 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-[#13BDC4] transition-colors shadow-2xs"
              >
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  ADD
                </span>
                <input type="file" accept="image/*" className="hidden" />
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
            placeholder="320 GG Machine"
            className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
          />
        </div>

        {/* Brand */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            BRAND
          </label>
          <div className="relative">
            <select className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 appearance-none shadow-2xs pr-10">
              <option>-- No Brand --</option>
              <option>Caterpillar</option>
              <option>Komatsu</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
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
              placeholder="2020"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
        </div>

        {/* Hours & Location */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              HOURS
            </label>
            <input
              type="text"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              LOCATION
            </label>
            <input
              type="text"
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
              placeholder="Country"
              className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 shadow-2xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              STOCK STATUS
            </label>
            <div className="relative">
              <select className="w-full h-11 px-4 bg-white rounded-xl text-xs font-medium text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 appearance-none shadow-2xs pr-10">
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
          className="w-full h-12 bg-[#13BDC4] text-white rounded-xl font-bold text-xs shadow-md active:scale-[0.98] transition-transform mt-2"
        >
          Post Listing
        </button>
      </form>
    </div>
  );
}