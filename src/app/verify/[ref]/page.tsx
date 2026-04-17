"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion, Variants } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerifyCertificate() {
  const params = useParams();
  const router = useRouter();
  const ref = params.ref as string;
  const [status, setStatus] = useState<'loading' | 'verified' | 'failed'>('loading');
  const [certData, setCertData] = useState<any>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      let isVerifiedOnChain = false;
      let certDetails = null;

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
          certDetails = {
            name: data.name,
            matricNumber: data.matricNumber,
            department: data.department,
            classOfDegree: data.classOfDegree,
            date: data.date,
            issuer: data.issuer
          };
          isVerifiedOnChain = true;
        }
      } catch (err) {
        console.warn("Blockchain verification failed or contract not found. Falling back to Supabase database...");
      }

      // Supabase Fallback
      if (!isVerifiedOnChain) {
        try {
          const { supabase } = await import('@/utils/supabaseClient');
          const { data, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('reference_id', ref)
            .single();

          if (data && !error) {
            certDetails = {
              name: data.student_name,
              matricNumber: data.matric_number,
              department: data.department,
              classOfDegree: data.class_of_degree,
              date: data.date_issued,
              issuer: "Supabase Database Registry (Fallback)"
            };
            isVerifiedOnChain = true;
          }
        } catch (dbErr) {
          console.error("Supabase fallback failed:", dbErr);
        }
      }

      if (isVerifiedOnChain && certDetails) {
        setCertData(certDetails);
        setStatus('verified');
      } else {
        setStatus('failed');
      }
    };
    
    fetchCertificate();
  }, [ref]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring",
        bounce: 0.4,
        duration: 0.8,
        when: "beforeChildren",
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-4 font-sans text-white relative selection:bg-cyan-500/30 overflow-hidden">
      {/* Intense Background Glows */}
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />

      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="absolute top-8 left-8 z-20"
      >
        <button 
          onClick={() => router.push('/login')} 
          className="text-cyan-400 hover:text-white transition-colors text-xs font-black tracking-[0.2em] uppercase flex items-center space-x-3 bg-cyan-500/10 px-6 py-3 rounded-full hover:bg-cyan-500/20"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>portal home</span>
        </button>
      </motion.div>

      {status === 'loading' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
          transition={{ type: "spring", bounce: 0.6 }}
          className="absolute z-10 flex flex-col items-center justify-center -translate-y-16"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="relative w-20 h-20 text-cyan-400 animate-[spin_2s_linear_infinite]" strokeWidth={2.5} />
          </div>
        </motion.div>
      )}
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "text-center w-full max-w-xl bg-[#0A0A0A]/80 backdrop-blur-3xl p-14 rounded-[3rem] border-2 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group transition-all duration-700 z-20",
          status === 'loading' ? 'border-cyan-500/30 mt-40' : status === 'verified' ? 'border-emerald-400/50 shadow-[0_0_80px_rgba(16,185,129,0.2)]' : 'border-red-500/50 shadow-[0_0_80px_rgba(239,68,68,0.2)]'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        
        <motion.div variants={itemVariants}>
          <ShieldCheck className={cn(
            "w-16 h-16 mx-auto mb-6 transition-colors duration-500", 
            status === 'loading' ? 'text-cyan-400/50' : status === 'verified' ? 'text-emerald-400' : 'text-red-500'
          )} strokeWidth={1.5} />
          <h1 className="text-4xl font-black mb-3 tracking-tighter lowercase text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            verification.
          </h1>
          <p className="text-gray-400 mb-8 text-sm font-black uppercase tracking-[0.2em]">querying blockchain ledger...</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-black/60 py-4 px-6 rounded-2xl border-2 border-white/5 mb-10 max-w-[85%] mx-auto shadow-inner relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />
           <span className="text-cyan-400 font-mono text-lg font-black tracking-widest uppercase">{ref}</span>
        </motion.div>

        {status === 'loading' && (
          <motion.div variants={itemVariants} className="text-cyan-400 animate-pulse font-black tracking-[0.2em] text-xs uppercase flex items-center justify-center space-x-3">
            <Zap className="w-5 h-5" />
            <span>syncing with network</span>
          </motion.div>
        )}

        {status === 'verified' && certData && (
          <motion.div variants={itemVariants} className="bg-emerald-500/10 border-2 border-emerald-500/30 p-8 rounded-[2rem] text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-[50px] -translate-y-10 translate-x-10 pointer-events-none" />
            
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6, delay: 0.3 }}
              className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border-2 border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
               <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={3} />
            </motion.div>
            
            <h2 className="text-3xl font-black text-emerald-400 mb-3 tracking-tighter text-center lowercase">authentic.</h2>
            <p className="text-xs text-emerald-400/80 leading-relaxed font-bold tracking-wide text-center mb-10 uppercase">
              cryptographically anchored by mewar international university
            </p>
            
            <div className="space-y-6 border-t-2 border-emerald-500/20 pt-8">
              <div>
                <p className="text-[10px] text-emerald-400/50 uppercase tracking-[0.2em] font-black mb-1">Graduate Name</p>
                <p className="text-2xl font-black text-white lowercase tracking-tight">{certData.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-emerald-400/50 uppercase tracking-[0.2em] font-black mb-1">Matric Number</p>
                  <p className="text-base font-bold text-emerald-50 uppercase">{certData.matricNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400/50 uppercase tracking-[0.2em] font-black mb-1">Class of Degree</p>
                  <p className="text-base font-bold text-emerald-50 lowercase">{certData.classOfDegree}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-emerald-400/50 uppercase tracking-[0.2em] font-black mb-1">Department</p>
                  <p className="text-base font-bold text-emerald-50 lowercase">{certData.department}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400/50 uppercase tracking-[0.2em] font-black mb-1">Date Issued</p>
                  <p className="text-base font-bold text-emerald-50">{certData.date}</p>
                </div>
              </div>
              <div className="pt-6 border-t-2 border-emerald-500/10">
                <p className="text-[10px] text-emerald-400/50 uppercase tracking-[0.2em] font-black mb-3">Anchoring Node</p>
                <div className="bg-[#020202] p-4 rounded-2xl border-2 border-emerald-500/30">
                  <p className="text-[10px] text-emerald-400 font-mono break-all font-black">{certData.issuer}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div variants={itemVariants} className="bg-red-500/10 border-2 border-red-500/30 p-8 rounded-[2rem] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/20 rounded-full blur-[50px] -translate-y-10 translate-x-10 pointer-events-none" />
            
            <motion.div 
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6, delay: 0.3 }}
              className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            >
               <XCircle className="w-10 h-10 text-red-500" strokeWidth={3} />
            </motion.div>
            
            <h2 className="text-3xl font-black text-red-500 mb-3 tracking-tighter lowercase">invalid.</h2>
            <p className="text-xs text-red-400/80 leading-relaxed font-bold tracking-wide uppercase">
              this hash could not be found on the blockchain. it may be forged.
            </p>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, type: "spring" }}
        className="mt-16 text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black flex items-center space-x-3 bg-white/5 px-6 py-3 rounded-full border border-white/5"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] animate-pulse" />
        <span>powered by ethereum</span>
      </motion.div>
    </div>
  );
}
