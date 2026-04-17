"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically push the user to the login page as soon as the component mounts
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none -z-10 mix-blend-screen" />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-20 h-20 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(34,211,238,0.5)]"
      />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="text-center"
      >
        <h1 className="text-3xl font-black tracking-tighter lowercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">miu verify.</h1>
        <p className="text-gray-500 font-black text-[10px] mt-3 uppercase tracking-[0.3em] animate-pulse">Routing to secure access</p>
      </motion.div>
    </div>
  );
}