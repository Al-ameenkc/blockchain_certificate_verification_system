"use client";
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';

export default function NodeSettings() {
  const [rpcUrl, setRpcUrl] = useState("http://127.0.0.1:8545");
  const [contractAddress, setContractAddress] = useState("0x...");

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
    localStorage.setItem('rpc_url', rpcUrl);
    localStorage.setItem('contract_address', contractAddress);
    alert('Node Configuration Saved!');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex font-sans">
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-start mb-16">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Node Settings</h1>
            <p className="text-purple-400/40 text-sm mt-1">Configure your Ethereum RPC Node and Contract Addresses</p>
          </div>
          <div className="bg-[#0A0A0A] border border-purple-500/10 rounded-2xl px-5 py-3 flex items-center space-x-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Node: Configured</span>
          </div>
        </header>
        
        <div className="max-w-xl bg-[#0A0A0A] rounded-3xl border border-purple-500/10 p-10 shadow-[0_0_40px_rgba(168,85,247,0.05)]">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-purple-400/60 ml-1">RPC URL</label>
              <input 
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="w-full px-0 py-3 bg-transparent border-b border-purple-500/10 focus:border-purple-500 outline-none text-white transition-all text-lg placeholder-gray-800"
                placeholder="e.g. http://127.0.0.1:8545 for local hardhat"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-purple-400/60 ml-1">Registry Contract Address</label>
              <input 
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="w-full px-0 py-3 bg-transparent border-b border-purple-500/10 focus:border-purple-500 outline-none text-white transition-all text-lg placeholder-gray-800"
                placeholder="0x..."
              />
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-xl shadow-purple-900/20"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
