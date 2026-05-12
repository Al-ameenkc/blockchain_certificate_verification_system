"use client";
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScrollText, ArrowLeft, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModal } from '@/context/ModalContext';
import { supabase } from '@/utils/supabaseClient';

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

const REFERENCE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const REFERENCE_LENGTH = 10;
const REFERENCE_PREFIX = 'MIU-';

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
        whileTap={{ scale: 0.95 }}
        className={cn(
          "group relative w-full bg-[#020202]/80 backdrop-blur-xl border-2 rounded-2xl px-6 py-5 cursor-pointer transition-all flex justify-between items-center overflow-hidden",
          isOpen ? "border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]" : "border-white/10 hover:border-cyan-400/50 hover:bg-white/5"
        )}
        onClick={() => setOpen(!isOpen)}
      >
        <div className="relative z-10 flex flex-col">
          <motion.span 
            initial={false}
            animate={{ 
              y: value ? 0 : 12, 
              scale: value ? 1 : 1.15,
              opacity: value ? 0.6 : 0 
            }}
            className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black mb-1 origin-left"
          >
            {label}
          </motion.span>
          <span className={cn(
            "font-black tracking-tight transition-all duration-300",
            value ? "text-white text-xl" : "text-gray-500 text-xl translate-y-[-10px]"
          )}>
            {value ? value.toLowerCase() : `select ${label.toLowerCase()}`}
          </span>
        </div>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isOpen ? "bg-cyan-400/20 text-cyan-400" : "bg-white/5 text-gray-400 group-hover:bg-cyan-400/10 group-hover:text-cyan-400"
          )}
        >
          <ChevronDown className="w-5 h-5" strokeWidth={3} />
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute z-50 w-full mt-3 bg-[#0A0A0A]/95 backdrop-blur-2xl border-2 border-cyan-400/30 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
          >
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
              {options.map((opt) => (
                <div 
                  key={opt} 
                  className="group relative px-4 py-3 hover:bg-cyan-400/10 rounded-xl cursor-pointer text-gray-300 transition-colors flex items-center space-x-3 mb-1 last:mb-0"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    value === opt ? "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]" : "bg-white/10 group-hover:bg-cyan-400/50 group-hover:scale-150"
                  )} />
                  <span className={cn(
                    "transition-colors text-lg font-bold tracking-tight lowercase",
                    value === opt ? "text-cyan-100" : "group-hover:text-white"
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

  const { showLoading, showAlert } = useModal();

  useEffect(() => {
    if (view === 'issue') {
      const today = new Date().toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, date: today }));
    }
  }, [view]);

  const generateReference = () => {
    let value = '';
    for (let i = 0; i < REFERENCE_LENGTH; i += 1) {
      value += REFERENCE_CHARSET[Math.floor(Math.random() * REFERENCE_CHARSET.length)];
    }
    return `${REFERENCE_PREFIX}${value}`;
  };

  const generateUniqueReference = async () => {
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = generateReference();
      const { count, error } = await supabase
        .from('certificates')
        .select('reference_id', { count: 'exact', head: true })
        .eq('reference_id', candidate);

      if (error) {
        // If Supabase is temporarily unreachable, keep flow moving and re-validate before final submit.
        if (typeof error.message === 'string' && error.message.toLowerCase().includes('failed to fetch')) {
          return candidate;
        }
        throw new Error(error.message || 'Unable to validate unique reference number.');
      }

      if ((count ?? 0) === 0) {
        return candidate;
      }
    }

    throw new Error('Failed to generate a unique reference number. Please try again.');
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoading(true);

    try {
      const certRef = await generateUniqueReference();
      showLoading(false);
      showAlert(
        "Certificate Draft Ready",
        "Reference generated. Review the certificate and click Submit on the certificate page to write to blockchain.",
        "info"
      );
      router.push(`/certificate/${certRef}?name=${formData.studentName}&matric=${formData.matricNumber}&dept=${formData.department}&class=${formData.classOfDegree}&date=${formData.date}&viewType=${view}`);
      return;
    } catch (err) {
      showLoading(false);
      console.error("Reference generation failed:", err);
      showAlert("Reference Error", "Unable to generate a unique certificate reference right now. Please try again.", "error");
      return;
    }
  };


  return (
    <div className="min-h-screen bg-[#020202] text-gray-200 flex font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      <Sidebar />

      {/* Cyber Orbs */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="fixed bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />

      <main className="flex-1 p-12 overflow-y-auto relative z-10">
        
        <header className="flex justify-between items-start mb-20 mt-4">
          <motion.div 
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }} 
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <h1 className="text-[3.5rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 tracking-tighter leading-none mb-4 lowercase">
              {view === 'selection' ? 'management console.' : view === 'issue' ? 'issue new cert.' : 'register legacy cert.'}
            </h1>
            <p className="text-cyan-400/80 font-bold tracking-[0.2em] uppercase text-xs">
              {view === 'selection' 
                ? '// select an operation to anchor data' 
                : '// complete fields below to commit to ledger'}
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
            <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Node: Active</span>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {view === 'selection' ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-10"
            >
              <motion.button 
                whileHover={{ scale: 1.03, y: -10 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setView('issue')}
                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl border-2 border-white/10 p-10 rounded-[3rem] text-left transition-all hover:border-cyan-400/50 hover:shadow-[0_30px_60px_rgba(34,211,238,0.15)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-cyan-400/0 to-cyan-400/10 group-hover:to-cyan-400/20 transition-all duration-700" />
                <div className="w-20 h-20 bg-white/5 border-2 border-white/10 rounded-[1.5rem] flex items-center justify-center text-cyan-400 mb-8 group-hover:bg-cyan-400 group-hover:text-black group-hover:border-cyan-300 transition-all duration-500 shadow-2xl group-hover:rotate-12 group-hover:scale-110">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-4xl font-black text-white mb-4 tracking-tighter lowercase">issue.</h3>
                <p className="text-gray-400 text-lg leading-relaxed font-medium">generate and cryptographically anchor a brand new digital certificate for current graduates onto the sepolia testnet.</p>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.03, y: -10 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setView('register')}
                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl border-2 border-white/10 p-10 rounded-[3rem] text-left transition-all hover:border-purple-500/50 hover:shadow-[0_30px_60px_rgba(168,85,247,0.15)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 group-hover:to-purple-500/20 transition-all duration-700" />
                <div className="w-20 h-20 bg-white/5 border-2 border-white/10 rounded-[1.5rem] flex items-center justify-center text-purple-400 mb-8 group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-400 transition-all duration-500 shadow-2xl group-hover:-rotate-12 group-hover:scale-110">
                  <ScrollText className="w-10 h-10" />
                </div>
                <h3 className="text-4xl font-black text-white mb-4 tracking-tighter lowercase">register.</h3>
                <p className="text-gray-400 text-lg leading-relaxed font-medium">back-log and verify existing paper certificates issued in previous years to establish historical provenance.</p>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <motion.button 
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('selection')}
                className="mb-8 text-xs font-black text-cyan-400 hover:text-white transition-colors flex items-center space-x-3 bg-cyan-500/10 hover:bg-cyan-500/20 px-6 py-3 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" /> 
                <span className="tracking-[0.2em] uppercase">Back</span>
              </motion.button>

              <div className="bg-[#0A0A0A]/60 backdrop-blur-3xl rounded-[3rem] border-2 border-white/5 p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />
                
                <form onSubmit={handleCommit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                    
                    <div className="space-y-3 md:col-span-2 group">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 group-focus-within:text-cyan-400 transition-colors">Full Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. sulaiman muhammad goni"
                        className="w-full px-6 py-5 bg-[#020202]/80 border-2 border-white/10 rounded-2xl focus:border-cyan-400 focus:bg-white/5 outline-none text-white transition-all text-xl font-black tracking-tight placeholder-gray-700 shadow-inner lowercase"
                        onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-3 group">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 group-focus-within:text-cyan-400 transition-colors">Matric Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. miustd2021232"
                        className="w-full px-6 py-5 bg-[#020202]/80 border-2 border-white/10 rounded-2xl focus:border-cyan-400 focus:bg-white/5 outline-none text-white transition-all text-xl font-black tracking-tight placeholder-gray-700 shadow-inner lowercase"
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

                    <div className="space-y-3 group">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 group-focus-within:text-cyan-400 transition-colors">Date Issued</label>
                      <input 
                        type="date"
                        className="w-full px-6 py-5 bg-[#020202]/80 border-2 border-white/10 rounded-2xl focus:border-cyan-400 focus:bg-white/5 outline-none text-white transition-all text-xl font-black tracking-tight shadow-inner"
                        style={{ colorScheme: 'dark' }}
                        value={formData.date}
                        readOnly={view === 'issue'}
                        disabled={view === 'issue'}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-8">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="group relative w-full py-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded-2xl font-black text-2xl hover:brightness-110 transition-all flex items-center justify-center space-x-4 overflow-hidden shadow-[0_15px_30px_rgba(34,211,238,0.3)] lowercase tracking-tight"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                      <CheckCircle2 className="w-8 h-8 text-black" strokeWidth={3} />
                      <span>{view === 'issue' ? 'create certificate.' : 'prepare legacy certificate.'}</span>
                    </motion.button>
                    <p className="text-center text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-6">blockchain submit happens on certificate page</p>
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