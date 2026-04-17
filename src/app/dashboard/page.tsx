"use client";
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScrollText, ArrowLeft, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type WorksetView = 'selection' | 'issue' | 'register';

const MIU_DEPARTMENTS = [
  "Accounting",
  "Business Administration",
  "Computer Science",
  "Cybersecurity",
  "Economics",
  "Information Technology",
  "Mass Communication",
  "Medical Laboratory Science",
  "Nursing Science",
  "Software Engineering"
];

const HONOURS_CLASSES = [
  "First Class Honours",
  "Second Class Honours (Upper Division)",
  "Second Class Honours (Lower Division)",
  "Third Class Honours",
  "Pass"
];

const FuturisticDropdown = ({ 
  label, 
  value, 
  options, 
  onChange, 
  isOpen, 
  setOpen 
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  isOpen: boolean;
  setOpen: (val: boolean) => void;
}) => {
  return (
    <div className="relative">
      <motion.div 
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative w-full bg-[#0A0A0A]/80 backdrop-blur-md border rounded-xl px-5 py-4 cursor-pointer transition-all flex justify-between items-center overflow-hidden",
          isOpen ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]" : "border-white/10 hover:border-purple-500/50"
        )}
        onClick={() => setOpen(!isOpen)}
      >
        <div className="relative z-10 flex flex-col">
          <motion.span 
            initial={false}
            animate={{ 
              y: value ? 0 : 10, 
              scale: value ? 1 : 1.1,
              opacity: value ? 0.6 : 0 
            }}
            className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-1 origin-left"
          >
            {label}
          </motion.span>
          <span className={cn(
            "font-semibold transition-all duration-300",
            value ? "text-white text-lg" : "text-gray-500 text-lg translate-y-[-10px]"
          )}>
            {value || `Select ${label}`}
          </span>
        </div>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }}
          className={cn(
            "relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            isOpen ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white"
          )}
        >
          <ChevronDown className="w-4 h-4" strokeWidth={3} />
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-[#0A0A0A]/95 backdrop-blur-xl border border-purple-500/30 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((opt) => (
                <div 
                  key={opt} 
                  className="group relative px-5 py-3 hover:bg-purple-600/20 cursor-pointer text-gray-300 transition-colors border-b border-white/5 last:border-0 flex items-center space-x-3"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    value === opt ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,1)]" : "bg-white/10 group-hover:bg-purple-400/50"
                  )} />
                  <span className={cn(
                    "transition-colors text-base font-medium",
                    value === opt ? "text-white" : "group-hover:text-white"
                  )}>{opt}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Dashboard() {
  const [view, setView] = useState<WorksetView>('selection');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentName: '',
    matricNumber: '',
    department: '',
    classOfDegree: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    const certRef = `MIU-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Request account access if needed
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        
        // Ensure network is Sepolia Testnet (chainId: 0xaa36a7)
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError: any) {
          console.error("Failed to switch to Sepolia Testnet", switchError);
          alert("Please switch your MetaMask network to the Sepolia Testnet.");
          return;
        }

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        const contractAddress = localStorage.getItem('contract_address') || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        
        const abi = [
          "function issueCertificate(string _ref, string _name, string _matricNumber, string _department, string _classOfDegree, string _date) public"
        ];
        const contract = new ethers.Contract(contractAddress, abi, signer);
        
        try {
          const tx = await contract.issueCertificate(
            certRef, formData.studentName, formData.matricNumber, formData.department, formData.classOfDegree, formData.date
          );
          await tx.wait();
        } catch(contractErr: any) {
          console.error("Contract write rejected or failed.", contractErr);
          if (contractErr.code === 'ACTION_REJECTED') {
            alert("Transaction was cancelled by the user.");
          } else {
            alert("Transaction Failed. Ensure you are connected to the Sepolia testnet and have enough ETH to pay for gas.");
          }
          return;
        }
      } else {
        alert("MetaMask (or a compatible Web3 wallet) is required to issue certificates on the Ethereum network! Please install it.");
        return;
      }
    } catch(err: any) {
      console.error("Ethereum Wallet Connection Failed:", err);
      if (err.code === 4001) {
        alert("Wallet connection was cancelled by the user.");
      } else {
        alert("Ethereum Wallet Connection Failed. Please unlock MetaMask and try again.");
      }
      return;
    }
    
    router.push(`/certificate/${certRef}?name=${formData.studentName}&matric=${formData.matricNumber}&dept=${formData.department}&class=${formData.classOfDegree}&date=${formData.date}&viewType=${view}`);
  };


  return (
    <div className="min-h-screen bg-[#020202] text-gray-200 flex font-sans selection:bg-purple-500/30">
      <Sidebar />

      <main className="flex-1 p-12 overflow-y-auto relative">
        {/* Subtle background glow */}
        <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen" />
        
        <header className="flex justify-between items-start mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
              {view === 'selection' ? 'Management Console' : view === 'issue' ? 'Issue New Certificate' : 'Register Legacy Certificate'}
            </h1>
            <p className="text-purple-400/60 font-medium tracking-wide">
              {view === 'selection' 
                ? 'Select an operation to begin anchoring data' 
                : 'Complete the fields below to commit to the Ethereum Ledger'}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-3 flex items-center space-x-3 shadow-lg"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Node: Active</span>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {view === 'selection' ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10"
            >
              <motion.button 
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('issue')}
                className="group relative bg-[#0A0A0A]/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] text-left transition-all hover:border-purple-500/50 hover:bg-[#111]/80 hover:shadow-[0_20px_40px_rgba(168,85,247,0.1)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-purple-600/5 group-hover:to-purple-600/20 transition-all duration-500" />
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 transition-all duration-300 shadow-xl">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Issue Certificate</h3>
                <p className="text-gray-400 leading-relaxed font-medium">Generate and cryptographically anchor a brand new digital certificate for current graduates onto the Sepolia testnet.</p>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('register')}
                className="group relative bg-[#0A0A0A]/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] text-left transition-all hover:border-blue-500/50 hover:bg-[#111]/80 hover:shadow-[0_20px_40px_rgba(59,130,246,0.1)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-blue-600/0 to-blue-600/5 group-hover:to-blue-600/20 transition-all duration-500" />
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300 shadow-xl">
                  <ScrollText className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Register Certificate</h3>
                <p className="text-gray-400 leading-relaxed font-medium">Back-log and verify existing paper certificates issued in previous years to establish historical provenance.</p>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl"
            >
              <button 
                onClick={() => setView('selection')}
                className="mb-8 text-xs font-bold text-purple-400 hover:text-white transition-colors flex items-center space-x-2 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" /> 
                <span className="tracking-widest uppercase">Back to Selection</span>
              </button>

              <div className="bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />
                
                <form onSubmit={handleCommit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    
                    <div className="space-y-2 md:col-span-2 group">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-purple-400 transition-colors">Full Name of Graduate</label>
                      <input 
                        type="text"
                        placeholder="E.g. Sulaiman Muhammad Goni"
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:bg-white/10 outline-none text-white transition-all text-lg font-medium placeholder-gray-600 shadow-inner"
                        onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2 group">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-purple-400 transition-colors">Matriculation Number</label>
                      <input 
                        type="text"
                        placeholder="E.g. MIUSTD2021232"
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:bg-white/10 outline-none text-white transition-all text-lg font-medium placeholder-gray-600 shadow-inner"
                        onChange={(e) => setFormData({...formData, matricNumber: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <FuturisticDropdown 
                        label="Class of Degree"
                        value={formData.classOfDegree}
                        options={HONOURS_CLASSES}
                        onChange={(val) => setFormData({...formData, classOfDegree: val})}
                        isOpen={isClassDropdownOpen}
                        setOpen={setIsClassDropdownOpen}
                      />
                    </div>

                    <div className="space-y-2">
                      <FuturisticDropdown 
                        label="Department"
                        value={formData.department}
                        options={MIU_DEPARTMENTS}
                        onChange={(val) => setFormData({...formData, department: val})}
                        isOpen={isDeptDropdownOpen}
                        setOpen={setIsDeptDropdownOpen}
                      />
                    </div>

                    <div className="space-y-2 group">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-purple-400 transition-colors">Date of Issuance</label>
                      <input 
                        type="date"
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:bg-white/10 outline-none text-white transition-all text-lg font-medium shadow-inner"
                        style={{ colorScheme: 'dark' }}
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-8">
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="group relative w-full py-5 bg-white text-black rounded-xl font-black text-lg hover:bg-gray-200 transition-all flex items-center justify-center space-x-3 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <CheckCircle2 className="w-6 h-6 text-purple-600" />
                      <span>{view === 'issue' ? 'Issue to Blockchain' : 'Anchor to Blockchain'}</span>
                    </motion.button>
                    <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest mt-4">Transaction will be signed via MetaMask</p>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}