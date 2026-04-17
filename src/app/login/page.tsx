"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [authKey, setAuthKey] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authKey) console.log("Authenticating...");
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Intense Background Glows */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-[#0A0A0A]/80 backdrop-blur-3xl border-2 border-white/5 rounded-[3rem] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />
          
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-cyan-400/10 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)] mb-6"
            >
              <ShieldAlert className="w-10 h-10 text-cyan-400" strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 tracking-tighter lowercase">
              admin portal.
            </h1>
            <p className="text-cyan-400/80 mt-3 font-black tracking-[0.2em] uppercase text-[10px]">
              secure blockchain access
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            <div className="flex flex-col group/input">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 mb-4 group-focus-within/input:text-cyan-400 transition-colors">
                Authentication Key
              </label>
              <input 
                type="password" 
                required
                className="w-full px-6 py-5 bg-[#020202]/80 border-2 border-white/10 rounded-2xl focus:border-cyan-400 focus:bg-white/5 outline-none transition-all text-white placeholder-gray-700 tracking-[0.4em] shadow-inner text-xl font-black"
                placeholder="••••••••••••"
                onChange={(e) => setAuthKey(e.target.value)}
              />
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="group relative w-full py-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded-2xl font-black text-xl hover:brightness-110 transition-all flex items-center justify-center space-x-3 overflow-hidden shadow-[0_15px_30px_rgba(34,211,238,0.3)] lowercase tracking-tight"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              <span>access dashboard.</span>
              <ArrowRight className="w-6 h-6 text-black group-hover:translate-x-1 transition-transform" strokeWidth={3} />
            </motion.button>
          </form>

          <div className="mt-12 pt-8 border-t-2 border-white/5 text-center">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
              <span>Node Online</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}