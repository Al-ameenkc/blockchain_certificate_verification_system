"use client";
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';

type WorksetView = 'selection' | 'issue' | 'register';

// List of common MIU Departments
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
      <div 
        className="group relative w-full bg-[#0A0A0A] border border-purple-500/20 hover:border-purple-400 rounded-xl px-4 py-3 cursor-pointer transition-all flex justify-between items-center overflow-hidden"
        onClick={() => setOpen(!isOpen)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-500/5 to-purple-600/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-purple-400/60 font-bold mb-0.5">{label}</span>
          <span className={value ? 'text-white font-medium text-lg' : 'text-gray-600 font-medium text-lg'}>
            {value || `Select ${label}`}
          </span>
        </div>
        <div className="relative z-10">
          <div className={`w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-purple-500/20' : ''}`}>
            <span className="text-purple-400 text-xs">▼</span>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#050505] backdrop-blur-3xl border border-purple-500/30 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.15)] animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <div 
                key={opt} 
                className="group relative px-5 py-3 hover:bg-purple-600/20 cursor-pointer text-gray-300 transition-colors border-b border-purple-500/10 last:border-0 flex items-center space-x-3"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30 group-hover:bg-purple-400 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.8)] transition-all"></div>
                <span className="group-hover:text-white transition-colors text-lg">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
    
    // Redirect to the certificate view
    router.push(`/certificate/${certRef}?name=${formData.studentName}&matric=${formData.matricNumber}&dept=${formData.department}&class=${formData.classOfDegree}&date=${formData.date}&viewType=${view}`);
  };


  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex font-sans">
      <Sidebar />

      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-start mb-16">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {view === 'selection' ? 'Management Console' : view === 'issue' ? 'Issue New Certificate' : 'Register Legacy Certificate'}
            </h1>
            <p className="text-purple-400/40 text-sm mt-1">
              {view === 'selection' 
                ? 'Select an operation to begin anchoring data' 
                : 'Complete the fields below to commit to the Ethereum Ledger'}
            </p>
          </div>
          
          <div className="bg-[#0A0A0A] border border-purple-500/10 rounded-2xl px-5 py-3 flex items-center space-x-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Node: Active</span>
          </div>
        </header>

        {view === 'selection' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-10">
            <button 
              onClick={() => setView('issue')}
              className="group relative bg-[#0A0A0A] border border-purple-500/10 p-10 rounded-3xl text-left transition-all hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]"
            >
              <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <span className="text-2xl">✦</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Issue Certificate</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Generate and anchor a brand new digital certificate for current graduates.</p>
            </button>

            <button 
              onClick={() => setView('register')}
              className="group relative bg-[#0A0A0A] border border-purple-500/10 p-10 rounded-3xl text-left transition-all hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]"
            >
              <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <span className="text-2xl">📜</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Register Certificate</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Back-log and verify existing paper certificates issued in previous years.</p>
            </button>
          </div>
        ) : (
          <div className="max-w-3xl">
            <button 
              onClick={() => setView('selection')}
              className="mb-8 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-2"
            >
              <span>←</span> <span>Back to Selection</span>
            </button>

            <div className="bg-[#0A0A0A] rounded-3xl border border-purple-500/10 p-10 shadow-2xl">
              <form onSubmit={handleCommit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-sm font-medium text-purple-200/60 ml-1">Full Name of Graduate</label>
                    <input 
                      type="text"
                      placeholder="E.g. Sulaiman Muhammad Goni"
                      className="w-full px-0 py-3 bg-transparent border-b border-purple-500/10 focus:border-purple-500 outline-none text-white transition-all text-lg placeholder-gray-800"
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-purple-200/60 ml-1">Matriculation Number</label>
                    <input 
                      type="text"
                      placeholder="E.g. MIUSTD2021232"
                      className="w-full px-0 py-3 bg-transparent border-b border-purple-500/10 focus:border-purple-500 outline-none text-white transition-all text-lg placeholder-gray-800"
                      onChange={(e) => setFormData({...formData, matricNumber: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <FuturisticDropdown 
                      label="Class of Degree"
                      value={formData.classOfDegree}
                      options={HONOURS_CLASSES}
                      onChange={(val) => setFormData({...formData, classOfDegree: val})}
                      isOpen={isClassDropdownOpen}
                      setOpen={setIsClassDropdownOpen}
                    />
                  </div>

                  <div className="space-y-3">
                    <FuturisticDropdown 
                      label="Department"
                      value={formData.department}
                      options={MIU_DEPARTMENTS}
                      onChange={(val) => setFormData({...formData, department: val})}
                      isOpen={isDeptDropdownOpen}
                      setOpen={setIsDeptDropdownOpen}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-purple-200/60 ml-1">Date of Issuance</label>
                    <input 
                      type="date"
                      className="w-full px-0 py-3 bg-transparent border-b border-purple-500/10 focus:border-purple-500 outline-none text-white transition-all text-lg"
                      style={{ colorScheme: 'dark' }}
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-purple-900/20 flex items-center justify-center space-x-3"
                  >
                    <span>{view === 'issue' ? '✦' : '📜'}</span>
                    <span>Create Certificate</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}