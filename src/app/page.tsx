"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically push the user to the login page as soon as the component mounts
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
      {/* Decorative MIU Logo Placeholder */}
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-wide">MIU VERIFY</h1>
        <p className="text-slate-400 text-sm mt-2">Redirecting to secure login...</p>
      </div>

      <div className="mt-8 text-[10px] text-slate-500 uppercase tracking-widest opacity-50">
        Mewar International University • Blockchain Gateway
      </div>
    </div>
  );
}