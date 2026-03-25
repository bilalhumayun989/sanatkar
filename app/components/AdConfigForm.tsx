'use client';

import { useState, useEffect } from 'react';
import { Loader2, Megaphone, Save, CheckCircle2 } from 'lucide-react';

interface AdConfig {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    imageUrl: string;
    badgeText: string;
    isActive: boolean;
}

export default function AdConfigForm() {
    const [adConfig, setAdConfig] = useState<AdConfig>({
        title: '',
        description: '',
        buttonText: '',
        buttonLink: '',
        imageUrl: '',
        badgeText: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        setLoading(true);
        fetch('/api/ad')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.ad) {
                    setAdConfig(data.ad);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const res = await fetch('/api/admin/ad', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adConfig)
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Configuration updated successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.message || 'Failed to update configuration');
            }
        } catch (e: any) {
            setMessage('An error occurred during save.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-gray-400">Loading Configuration...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-sm font-medium relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[100px] -z-10 border-l border-b border-primary/10 opacity-50"></div>

            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                <div className="p-3 bg-primary text-white rounded-xl shadow-md"><Megaphone className="w-5 h-5" /></div>
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Ad Content Setup</h2>
                    <p className="text-gray-500 text-xs font-semibold">Customize your brand appearance in the buyer feed</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Headline</label>
                        <input
                            type="text"
                            value={adConfig.title}
                            onChange={(e) => setAdConfig({ ...adConfig, title: e.target.value })}
                            placeholder="Find Genuine Industrial Parts"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-gray-900 placeholder:text-gray-300 shadow-inner"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Media URL (Portrait Image)</label>
                        <input
                            type="text"
                            value={adConfig.imageUrl}
                            onChange={(e) => setAdConfig({ ...adConfig, imageUrl: e.target.value })}
                            placeholder="https://example.com/part-banner.jpg"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-gray-900 placeholder:text-gray-300 shadow-inner"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Promotional Message</label>
                        <textarea
                            value={adConfig.description}
                            onChange={(e) => setAdConfig({ ...adConfig, description: e.target.value })}
                            placeholder="Tell your industrial story here. Focus on quality, speed, and authentic parts..."
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-gray-900 placeholder:text-gray-300 shadow-inner resize-none min-h-[120px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Action Button Text</label>
                        <input
                            type="text"
                            value={adConfig.buttonText}
                            onChange={(e) => setAdConfig({ ...adConfig, buttonText: e.target.value })}
                            placeholder="Inquire Now"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-gray-900 placeholder:text-gray-300 shadow-inner"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Link (or Route)</label>
                        <input
                            type="text"
                            value={adConfig.buttonLink}
                            onChange={(e) => setAdConfig({ ...adConfig, buttonLink: e.target.value })}
                            placeholder="https://SANATkar.com"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-gray-900 placeholder:text-gray-300 shadow-inner"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Promo Badge</label>
                        <input
                            type="text"
                            value={adConfig.badgeText}
                            onChange={(e) => setAdConfig({ ...adConfig, badgeText: e.target.value })}
                            placeholder="Verified Dealer"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-gray-900 placeholder:text-gray-300 shadow-inner"
                        />
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center gap-4 cursor-pointer group/toggle select-none">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={adConfig.isActive}
                                    onChange={(e) => setAdConfig({ ...adConfig, isActive: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                            </div>
                            <div>
                                <span className="font-black text-secondary text-xs uppercase tracking-wider block">Live Status</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{adConfig.isActive ? 'Visible in Feed' : 'Hidden'}</span>
                            </div>
                        </label>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-slide-in ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        <CheckCircle2 className="w-5 h-5" /> {message}
                    </div>
                )}

                <div className="pt-8 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-10 py-4.5 rounded-2xl font-black text-sm text-white bg-secondary hover:bg-slate-800 shadow-xl shadow-secondary/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                        Confirm Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
