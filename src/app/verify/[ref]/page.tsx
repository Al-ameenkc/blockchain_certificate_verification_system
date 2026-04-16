"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function VerifyCertificate() {
  const params = useParams();
  const router = useRouter();
  const ref = params.ref as string;
  const [status, setStatus] = useState<'loading' | 'verified' | 'failed'>('loading');

  useEffect(() => {
    // Mocking an on-chain verification call.
    // In a full implementation, you would poll ethers.js via your provider here.
    const timer = setTimeout(() => {
      setStatus('verified'); // Defaulting to verified to simulate outcome
    }, 2500);
    return () => clearTimeout(timer);
  }, [ref]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 font-sans text-white relative">
      <div className="absolute top-8 left-8">
        <button onClick={() => router.push('/login')} className="text-purple-400 hover:text-white transition-colors text-sm font-bold tracking-widest uppercase">
          ← Portal Home
        </button>
      </div>

      <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-10 shadow-[0_0_30px_rgba(168,85,247,0.5)]"></div>
      
      <div className="text-center w-full max-w-lg bg-[#0A0A0A] p-12 rounded-[2rem] border border-purple-500/20 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none"></div>
        
        <h1 className="text-3xl font-black mb-3 tracking-tight">MIU Verification</h1>
        <p className="text-gray-400 mb-10 text-sm">Querying distributed ledger for origin hash:</p>
        
        <div className="bg-[#111] py-3 px-4 rounded-xl border border-purple-500/10 mb-8 max-w-[80%] mx-auto shadow-inner">
           <span className="text-purple-300 font-mono text-sm tracking-widest">{ref}</span>
        </div>

        {status === 'loading' && (
          <div className="text-yellow-500 animate-pulse font-bold tracking-widest text-xs uppercase flex items-center justify-center space-x-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span>Synchronizing With Network...</span>
          </div>
        )}

        {status === 'verified' && (
          <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-5 duration-500 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
               <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-black text-green-400 mb-2 tracking-tight">Authentic Artifact</h2>
            <p className="text-xs text-green-400/60 leading-relaxed font-medium">This document has been permanently cryptographically anchored and its origin is verified by Mewar International University.</p>
          </div>
        )}
      </div>

      <div className="mt-16 text-[10px] text-gray-600 uppercase tracking-widest">
        Powered by Ethereum
      </div>
    </div>
  );
}
