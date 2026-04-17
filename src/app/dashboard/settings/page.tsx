"use client";
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Save } from 'lucide-react';
import { useModal } from '@/context/ModalContext';

export default function NodeSettings() {
  const [rpcUrl, setRpcUrl] = useState("http://127.0.0.1:8545");
  const [contractAddress, setContractAddress] = useState("0x...");
  const { showLoading, showAlert } = useModal();

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedRpc = localStorage.getItem('rpc_url');
        const savedAddr = localStorage.getItem('contract_address');
        if (savedRpc) setRpcUrl(savedRpc);
        if (savedAddr) setContractAddress(savedAddr);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showLoading(true);
    
    // Simulate a tiny delay for the aesthetic
    setTimeout(() => {
      localStorage.setItem('rpc_url', rpcUrl);
      localStorage.setItem('contract_address', contractAddress);
      showLoading(false);
      showAlert("Configuration Saved", "Node configuration has been successfully updated.", "success");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-gray-200 flex font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      <Sidebar />

      {/* Cyber Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="fixed bottom-0 left-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />

      <main className="flex-1 p-12 overflow-y-auto relative z-10">
        <header className="flex justify-between items-start mb-16 mt-4">
          <motion.div 
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }} 
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <h1 className="text-[3.5rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 tracking-tighter leading-none mb-4 lowercase">
              node config.
            </h1>
            <p className="text-cyan-400/80 font-bold tracking-[0.2em] uppercase text-xs">
              // define ethereum routing endpoints
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }} 
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.6 }}
            className="bg-[#0A0A0A]/80 backdrop-blur-xl border-2 border-white/5 rounded-full px-6 py-4 flex items-center space-x-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,1)]"></span>
            </div>
            <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Node: Configured</span>
          </motion.div>
        </header>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="max-w-xl bg-[#0A0A0A]/60 backdrop-blur-3xl rounded-[3rem] border-2 border-white/5 p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />
          
          <div className="w-20 h-20 bg-white/5 border-2 border-white/10 rounded-[1.5rem] flex items-center justify-center text-cyan-400 mb-10 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <Settings2 className="w-10 h-10 animate-[spin_10s_linear_infinite]" strokeWidth={2.5} />
          </div>

          <form onSubmit={handleSave} className="space-y-10">
            <div className="space-y-3 group/input">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 group-focus-within/input:text-cyan-400 transition-colors">RPC URL Endpoint</label>
              <input 
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="w-full px-6 py-5 bg-[#020202]/80 border-2 border-white/10 rounded-2xl focus:border-cyan-400 focus:bg-white/5 outline-none text-white transition-all text-xl font-black tracking-tight placeholder-gray-700 shadow-inner lowercase"
                placeholder="e.g. http://127.0.0.1:8545"
              />
            </div>
            
            <div className="space-y-3 group/input">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 group-focus-within/input:text-cyan-400 transition-colors">Registry Contract Address</label>
              <input 
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="w-full px-6 py-5 bg-[#020202]/80 border-2 border-white/10 rounded-2xl focus:border-cyan-400 focus:bg-white/5 outline-none text-white transition-all text-xl font-black tracking-tight placeholder-gray-700 shadow-inner lowercase"
                placeholder="0x..."
              />
            </div>

            <div className="pt-6">
              <motion.button 
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="group relative w-full py-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded-2xl font-black text-2xl hover:brightness-110 transition-all flex items-center justify-center space-x-4 overflow-hidden shadow-[0_15px_30px_rgba(34,211,238,0.3)] lowercase tracking-tight"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                <Save className="w-8 h-8 text-black" strokeWidth={3} />
                <span>commit settings.</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
