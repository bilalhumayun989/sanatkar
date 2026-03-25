'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MiniAdminRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/admin/login');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );
}
