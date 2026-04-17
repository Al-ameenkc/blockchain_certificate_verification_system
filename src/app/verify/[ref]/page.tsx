"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

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

        {status === 'verified' && certData && (
          <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-5 duration-500 text-left">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
               <span className="text-3xl text-green-400">✓</span>
            </div>
            <h2 className="text-2xl font-black text-green-400 mb-2 tracking-tight text-center">Authentic Artifact</h2>
            <p className="text-xs text-green-400/60 leading-relaxed font-medium text-center mb-6">This document has been permanently cryptographically anchored and its origin is verified by Mewar International University.</p>
            
            <div className="space-y-4 border-t border-green-500/20 pt-6">
              <div>
                <p className="text-[10px] text-green-400/50 uppercase tracking-widest font-bold">Graduate Name</p>
                <p className="text-lg font-semibold text-green-100">{certData.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-green-400/50 uppercase tracking-widest font-bold">Matric Number</p>
                  <p className="text-base text-green-100">{certData.matricNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-green-400/50 uppercase tracking-widest font-bold">Class of Degree</p>
                  <p className="text-base text-green-100">{certData.classOfDegree}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-green-400/50 uppercase tracking-widest font-bold">Department</p>
                  <p className="text-base text-green-100">{certData.department}</p>
                </div>
                <div>
                  <p className="text-[10px] text-green-400/50 uppercase tracking-widest font-bold">Date Issued</p>
                  <p className="text-base text-green-100">{certData.date}</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] text-green-400/50 uppercase tracking-widest font-bold">Anchoring Node</p>
                <p className="text-xs text-green-400/70 font-mono break-all bg-green-900/20 p-2 rounded-lg border border-green-500/20 mt-1">{certData.issuer}</p>
              </div>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-5 duration-500 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
               <span className="text-3xl text-red-500">✗</span>
            </div>
            <h2 className="text-2xl font-black text-red-500 mb-2 tracking-tight">Invalid Artifact</h2>
            <p className="text-xs text-red-400/60 leading-relaxed font-medium">This certificate hash could not be found on the blockchain. It may be forged or not yet anchored.</p>
          </div>
        )}
      </div>

      <div className="mt-16 text-[10px] text-gray-600 uppercase tracking-widest">
        Powered by Ethereum
      </div>
    </div>
  );
}
