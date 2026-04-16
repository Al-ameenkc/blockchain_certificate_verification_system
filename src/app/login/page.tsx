"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [authKey, setAuthKey] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for key validation will go here
    if (authKey) console.log("Authenticating...");
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Purple Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-[#0A0A0A] border border-purple-500/20 rounded-3xl p-10 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-800 shadow-[0_0_30_rgba(168,85,247,0.4)] mb-6">
              <span className="text-white text-xl font-bold">M</span>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Miu Admin Portal</h1>
            <p className="text-purple-400/50 mt-2 text-sm">Secure Blockchain Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            <div className="flex flex-col">
              {/* Increased margin-bottom on the label */}
              <label className="text-sm font-medium text-purple-200/70 ml-1 mb-5">
                Authentication Key
              </label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-4 bg-black/50 border border-purple-500/10 rounded-2xl focus:border-purple-500/50 focus:ring-0 outline-none transition-all text-white placeholder-gray-700 tracking-[0.4em]"
                placeholder="••••••••••••"
                onChange={(e) => setAuthKey(e.target.value)}
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-4 bg-white text-black hover:bg-purple-500 hover:text-white rounded-2xl font-bold transition-all duration-300 shadow-lg active:scale-95"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-12 pt-6 border-t border-purple-500/5 text-center">
            <p className="text-[11px] text-gray-600 tracking-wide font-medium">
              Mewar International University • Node Status: Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}