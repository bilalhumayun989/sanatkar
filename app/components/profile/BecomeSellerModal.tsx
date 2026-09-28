'use client';

import { useState } from 'react';
import { createClient } from '@/lib/auth/supabase/client';
import { useAuth } from '@/lib/AuthContext';
import { X, Upload, Loader2, Store } from 'lucide-react';

interface BecomeSellerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BecomeSellerModal({ isOpen, onClose, onSuccess }: BecomeSellerModalProps) {
    const { user } = useAuth();
    const [shopName, setShopName] = useState('');
    const [shopDescription, setShopDescription] = useState('');
    const [cnic, setCnic] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        if (!shopName || !shopDescription || !cnic || !imageFile) {
            setError('All fields are required.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const supabase = createClient();
            
            // Upload Image
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('shop-images')
                .upload(filePath, imageFile, { upsert: true });

            if (uploadError) {
                // If bucket doesn't exist, we might need to create it (usually done via dashboard),
                // but assuming it exists or handled by admin. Let's just throw for now.
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('shop-images')
                .getPublicUrl(filePath);

            // Update Profile
            const updates = {
                shop_name: shopName,
                shop_description: shopDescription,
                shop_image_url: publicUrl,
                cnic: cnic,
                role: 'seller',
                seller_status: 'pending'
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (profileError) throw profileError;

            onSuccess();
        } catch (err: any) {
            console.error('Failed to submit seller request', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Store size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Become a Seller</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-semibold border border-rose-100">
                            {error}
                        </div>
                    )}
                    
                    <form id="seller-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Shop Name</label>
                            <input 
                                type="text" 
                                value={shopName} 
                                onChange={e => setShopName(e.target.value)}
                                placeholder="Enter your shop name"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Shop Description</label>
                            <textarea 
                                value={shopDescription} 
                                onChange={e => setShopDescription(e.target.value)}
                                placeholder="What do you sell?"
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">CNIC Number</label>
                            <input 
                                type="text" 
                                value={cnic} 
                                onChange={e => setCnic(e.target.value)}
                                placeholder="00000-0000000-0"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Shop Image</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-slate-50/50">
                                <Upload size={24} className="text-slate-400 mb-2" />
                                <span className="text-sm font-semibold text-slate-700 mb-1">
                                    {imageFile ? imageFile.name : 'Click to upload image'}
                                </span>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    style={{ position: 'relative', marginTop: '-3rem', height: '3rem' }}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="seller-form"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-70"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    );
}
