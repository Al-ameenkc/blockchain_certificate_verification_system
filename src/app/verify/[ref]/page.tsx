"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerifyCertificate() {
  const params = useParams();
  const router = useRouter();
  const ref = params.ref as string;
  const [status, setStatus] = useState<'loading' | 'verified' | 'failed'>('loading');
  const [certData, setCertData] = useState<any>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        let rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
        let contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        
        if (typeof window !== 'undefined') {
            const lRpc = localStorage.getItem('rpc_url');
            const lAddr = localStorage.getItem('contract_address');
            if (lRpc) rpcUrl = lRpc;
            if (lAddr) contractAddress = lAddr;
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const abi = [
          "function verifyCertificate(string _ref) public view returns (tuple(string name, string matricNumber, string department, string classOfDegree, string date, bool isRegistered, address issuer))"
        ];
        
        const contract = new ethers.Contract(contractAddress, abi, provider);
        const data = await contract.verifyCertificate(ref);
        
        if (data && data.isRegistered) {
          setCertData({
            name: data.name,
            matricNumber: data.matricNumber,
            department: data.department,
            classOfDegree: data.classOfDegree,
            date: data.date,
            issuer: data.issuer
          });
          setStatus('verified');
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus('failed');
      }
    };
    
    fetchCertificate();
  }, [ref]);

  const containerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-4 font-sans text-white relative selection:bg-purple-500/30 overflow-hidden">
      {/* Background Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen" />

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 z-20"
      >
        <button 
          onClick={() => router.push('/login')} 
          className="text-purple-400 hover:text-white transition-colors text-sm font-bold tracking-widest uppercase flex items-center space-x-2 bg-purple-500/10 px-4 py-2 rounded-full hover:bg-purple-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Portal Home</span>
        </button>
      </motion.div>

      {status === 'loading' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute z-10 flex flex-col items-center justify-center -translate-y-10"
        >
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-8" />
        </motion.div>
      )}
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "text-center w-full max-w-lg bg-[#0A0A0A]/80 backdrop-blur-xl p-12 rounded-[2rem] border shadow-2xl relative overflow-hidden group transition-all duration-500 z-20",
          status === 'loading' ? 'border-purple-500/20 mt-32' : status === 'verified' ? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]' : 'border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        <motion.div variants={itemVariants}>
          <ShieldCheck className={cn(
            "w-12 h-12 mx-auto mb-6", 
            status === 'loading' ? 'text-purple-500/50' : status === 'verified' ? 'text-emerald-500/80' : 'text-red-500/80'
          )} strokeWidth={1.5} />
          <h1 className="text-3xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">MIU Verification</h1>
          <p className="text-gray-400 mb-8 text-sm font-medium">Querying distributed ledger for origin hash:</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white/5 py-3 px-4 rounded-xl border border-white/10 mb-8 max-w-[80%] mx-auto shadow-inner">
           <span className="text-purple-300 font-mono text-sm tracking-widest">{ref}</span>
        </motion.div>

        {status === 'loading' && (
          <motion.div variants={itemVariants} className="text-purple-400 animate-pulse font-bold tracking-widest text-xs uppercase flex items-center justify-center space-x-2">
            <span>Synchronizing With Network...</span>
          </motion.div>
        )}

        {status === 'verified' && certData && (
          <motion.div variants={itemVariants} className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] -translate-y-10 translate-x-10 pointer-events-none" />
            
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
               <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-emerald-400 mb-2 tracking-tight text-center">Authentic Artifact</h2>
            <p className="text-xs text-emerald-400/80 leading-relaxed font-medium text-center mb-8">This document has been permanently cryptographically anchored and its origin is verified by Mewar International University.</p>
            
            <div className="space-y-5 border-t border-emerald-500/20 pt-6">
              <div>
                <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-bold mb-1">Graduate Name</p>
                <p className="text-lg font-bold text-white">{certData.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-bold mb-1">Matric Number</p>
                  <p className="text-sm font-semibold text-white">{certData.matricNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-bold mb-1">Class of Degree</p>
                  <p className="text-sm font-semibold text-white">{certData.classOfDegree}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-bold mb-1">Department</p>
                  <p className="text-sm font-semibold text-white">{certData.department}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-bold mb-1">Date Issued</p>
                  <p className="text-sm font-semibold text-white">{certData.date}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-emerald-500/10">
                <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-bold mb-2">Anchoring Node</p>
                <div className="bg-black/50 p-3 rounded-xl border border-emerald-500/20">
                  <p className="text-xs text-emerald-400/70 font-mono break-all">{certData.issuer}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-[40px] -translate-y-10 translate-x-10 pointer-events-none" />
            
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
               <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-red-500 mb-2 tracking-tight">Invalid Artifact</h2>
            <p className="text-xs text-red-400/80 leading-relaxed font-medium">This certificate hash could not be found on the blockchain. It may be forged or not yet anchored.</p>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center space-x-2"
      >
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <span>Powered by Ethereum</span>
      </motion.div>
    </div>
  );
}
