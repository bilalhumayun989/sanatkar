'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/lib/AuthContext';
import { fetchJson } from '@/lib/utils/fetchJson';
import { 
    ShieldCheck, 
    Lock, 
    Truck, 
    ChevronLeft, 
    CreditCard, 
    MapPin, 
    Phone, 
    User, 
    CheckCircle2, 
    Loader2,
    ArrowRight,
    Minus,
    Plus
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const params: any = useParams();
    const productId = params.id;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [quantity, setQuantity] = useState(1);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: ''
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { response: res, data } = await fetchJson(`/api/cars/${productId}`);
                if (!res.ok) throw new Error('Failed to fetch product');
                setProduct(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (productId) fetchProduct();
    }, [productId]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?redirect=/checkout/${productId}`);
        }
    }, [user, authLoading, router, productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !product) return;
        if (user.id === product.sellerId) {
            alert('You cannot buy your own product.');
            return;
        }

        setSubmitting(true);
        try {
            const { response: res, data } = await fetchJson('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyerId: user.id,
                    productId: product.id,
                    sellerId: product.sellerId,
                    quantity: quantity,
                    totalPrice: product.price * quantity,
                    shippingAddress: formData
                })
            });
            if (data.success) {
                setOrderSuccess(true);
                setOrderId(data.orderId ?? '');
            } else {
                alert(data.message || 'Failed to place order');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (orderSuccess) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <Navbar forceSolid />
                <div className="flex-grow flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 text-green-500 animate-bounce">
                        <CheckCircle2 size={60} />
                    </div>
                    <h1 className="text-4xl font-black text-secondary mb-4 tracking-tight">Order Placed <span className="text-primary italic">Successfully!</span></h1>
                    <p className="text-gray-500 text-lg mb-2 font-medium">Thank you for your purchase. Your order ID is <span className="text-secondary font-black">#{orderId.substring(orderId.length - 8).toUpperCase()}</span></p>
                    <p className="text-gray-400 mb-10">The seller will contact you shortly to coordinate the dispatch of your item.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <Link href="/buyer" className="btn-primary w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-2">
                             Continue Shopping <ArrowRight size={18} />
                        </Link>
                        <button onClick={() => window.print()} className="w-full border-2 border-secondary/10 text-secondary py-5 rounded-[1.5rem] font-black hover:bg-gray-50 transition-all">
                            Print Invoice
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
            <Navbar forceSolid />
            
            <main className="flex-grow pt-24 md:pt-32 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-10">
                        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:text-primary transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-secondary tracking-tight">Secure <span className="text-primary italic">Checkout</span></h1>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Lock size={12} className="text-green-500" /> End-to-end Encrypted Transaction
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* Shipping Form */}
                        <div className="flex-1 space-y-8">
                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-8 md:p-10">
                                <h2 className="text-xl font-black text-secondary mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-xl"><MapPin size={20} /></div>
                                    Shipping Information
                                </h2>
                                
                                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input 
                                                    required
                                                    type="text" 
                                                    placeholder="John Doe"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                                    className="w-full bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-[1.2rem] py-4 pl-12 pr-4 outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input 
                                                    required
                                                    type="tel" 
                                                    placeholder="+92 300 1234567"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                    className="w-full bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-[1.2rem] py-4 pl-12 pr-4 outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Complete Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                                            <textarea 
                                                required
                                                rows={3}
                                                placeholder="Street address, apartment, suite, unit, etc."
                                                value={formData.address}
                                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                                className="w-full bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-[1.2rem] py-4 pl-12 pr-4 outline-none transition-all font-medium resize-none"
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                                        <select 
                                            required
                                            value={formData.city}
                                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                                            className="w-full bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-[1.2rem] py-4 px-6 outline-none transition-all font-bold text-secondary appearance-none cursor-pointer shadow-sm"
                                        >
                                            <option value="">Select your city</option>
                                            <option value="Karachi">Karachi</option>
                                            <option value="Lahore">Lahore</option>
                                            <option value="Islamabad">Islamabad</option>
                                            <option value="Faisalabad">Faisalabad</option>
                                            <option value="Sialkot">Sialkot</option>
                                            <option value="Peshawar">Peshawar</option>
                                            <option value="Quetta">Quetta</option>
                                            <option value="Multan">Multan</option>
                                            <option value="Gujranwala">Gujranwala</option>
                                        </select>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-secondary text-white rounded-[2rem] p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-primary">
                                        <Truck size={32} />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-lg !text-white font-black tracking-tight mb-1">Cash on Delivery Available</h3>
                                        <p className="text-sm text-gray-400 font-medium">Pay securely at your doorstep when the item arrives. All shipments are insured.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <aside className="w-full lg:w-[400px]">
                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-8 sticky top-32">
                                <h2 className="text-xl font-black text-secondary mb-8">Order Summary</h2>
                                
                                {product && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                                            <div className="w-20 h-20 relative rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                                                <Image src={product.images?.[0] || 'https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg'} fill sizes="80px" alt={product.model} className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{product.make}</p>
                                                <p className="text-sm font-black text-secondary leading-tight">{product.model}</p>
                                                <p className="text-xs text-primary font-bold mt-1 tracking-tight">PKR {product.price.toLocaleString()} / unit</p>
                                            </div>
                                        </div>

                                        {/* Quantity Selector */}
                                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                                            <span className="text-xs font-black text-secondary uppercase tracking-wider">Quantity</span>
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    type="button"
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-secondary hover:text-primary transition-colors hover:border-primary/20"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="font-black text-secondary w-4 text-center">{quantity}</span>
                                                <button 
                                                    type="button"
                                                    onClick={() => setQuantity(quantity + 1)}
                                                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-secondary hover:text-primary transition-colors hover:border-primary/20"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-gray-400">Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                                                <span className="text-secondary font-bold">PKR {(product.price * quantity).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-gray-400">Shipping Fee</span>
                                                <span className="text-green-500 font-black uppercase text-[10px] tracking-widest">Calculated at Step 2</span>
                                            </div>
                                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <span className="text-lg font-black text-secondary uppercase tracking-tight">Total</span>
                                                <span className="text-2xl font-black text-primary tracking-tighter">PKR {(product.price * quantity).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <button 
                                            form="checkout-form"
                                            disabled={submitting}
                                            className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-primary-dark transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group uppercase"
                                        >
                                            {submitting ? (
                                                <>Processing <Loader2 size={20} className="animate-spin" /></>
                                            ) : (
                                                <>Complete Purchase <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </button>

                                        <div className="pt-8 flex flex-col items-center gap-4 opacity-50">
                                            <div className="flex items-center gap-4">
                                                <CreditCard size={20} className="text-gray-400" />
                                                <ShieldCheck size={20} className="text-gray-400" />
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secured by SanatKaar</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
