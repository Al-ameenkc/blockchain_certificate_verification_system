"use client";
import { useEffect, useState } from 'react';
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
          "group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl border-2 bg-[#020202]/80 px-4 py-4 backdrop-blur-xl transition-all sm:px-6 sm:py-5",
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
            value ? "text-white text-lg sm:text-xl" : "text-gray-500 text-lg sm:text-xl translate-y-[-10px]"
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
    <main className="relative z-10 min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12">
      <header className="mb-10 mt-2 flex flex-col gap-6 sm:mb-14 sm:mt-4 lg:mb-20 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }} 
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="min-w-0"
          >
            <h1 className="mb-3 text-3xl font-black lowercase leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 sm:text-5xl lg:mb-4 lg:text-[3.5rem]">
              {view === 'selection' ? 'management console.' : view === 'issue' ? 'issue new cert.' : 'register legacy cert.'}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80 sm:text-xs">
              {view === 'selection' 
                ? '// select an operation to anchor data' 
                : '// complete fields below to commit to ledger'}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }} 
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.6 }}
            className="shrink-0 self-start rounded-full border-2 border-white/5 bg-[#0A0A0A]/80 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-6 sm:py-4 lg:self-auto"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,1)]"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 sm:text-xs">Node: Active</span>
            </div>
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
              className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-6 md:mt-10 md:grid-cols-2 md:gap-8"
            >
              <motion.button 
                whileHover={{ scale: 1.03, y: -10 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setView('issue')}
                className="group relative overflow-hidden rounded-[2rem] border-2 border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 text-left backdrop-blur-2xl transition-all hover:border-cyan-400/50 hover:shadow-[0_30px_60px_rgba(34,211,238,0.15)] sm:rounded-[3rem] sm:p-10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-cyan-400/0 to-cyan-400/10 group-hover:to-cyan-400/20 transition-all duration-700" />
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/10 bg-white/5 text-cyan-400 shadow-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:border-cyan-300 group-hover:bg-cyan-400 group-hover:text-black sm:mb-8 sm:h-20 sm:w-20 sm:rounded-[1.5rem]">
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <h3 className="mb-3 text-2xl font-black lowercase tracking-tighter text-white sm:mb-4 sm:text-4xl">issue.</h3>
                <p className="text-sm font-medium leading-relaxed text-gray-400 sm:text-lg">generate and cryptographically anchor a brand new digital certificate for current graduates onto the sepolia testnet.</p>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.03, y: -10 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setView('register')}
                className="group relative overflow-hidden rounded-[2rem] border-2 border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 text-left backdrop-blur-2xl transition-all hover:border-purple-500/50 hover:shadow-[0_30px_60px_rgba(168,85,247,0.15)] sm:rounded-[3rem] sm:p-10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 group-hover:to-purple-500/20 transition-all duration-700" />
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/10 bg-white/5 text-purple-400 shadow-2xl transition-all duration-500 group-hover:-rotate-12 group-hover:scale-110 group-hover:border-purple-400 group-hover:bg-purple-500 group-hover:text-white sm:mb-8 sm:h-20 sm:w-20 sm:rounded-[1.5rem]">
                  <ScrollText className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <h3 className="mb-3 text-2xl font-black lowercase tracking-tighter text-white sm:mb-4 sm:text-4xl">register.</h3>
                <p className="text-sm font-medium leading-relaxed text-gray-400 sm:text-lg">back-log and verify existing paper certificates issued in previous years to establish historical provenance.</p>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="mx-auto max-w-4xl"
            >
              <motion.button 
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('selection')}
                className="mb-6 flex items-center space-x-3 rounded-full bg-cyan-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:text-white sm:mb-8 sm:px-6 sm:py-3 sm:text-xs"
              >
                <ArrowLeft className="w-5 h-5" /> 
                <span className="tracking-[0.2em] uppercase">Back</span>
              </motion.button>

              <div className="relative overflow-hidden rounded-[2rem] border-2 border-white/5 bg-[#0A0A0A]/60 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl sm:rounded-[3rem] sm:p-10 lg:p-12">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />
                
                <form onSubmit={handleCommit} className="space-y-8 sm:space-y-10">
                  <div className="grid grid-cols-1 gap-8 gap-y-8 md:grid-cols-2 md:gap-x-10 md:gap-y-10">
                    
                    <div className="space-y-3 md:col-span-2 group">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 group-focus-within:text-cyan-400 transition-colors">Full Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. sulaiman muhammad goni"
                        className="w-full rounded-2xl border-2 border-white/10 bg-[#020202]/80 px-4 py-4 text-lg font-black lowercase tracking-tight text-white shadow-inner outline-none transition-all placeholder:text-gray-700 focus:border-cyan-400 focus:bg-white/5 sm:px-6 sm:py-5 sm:text-xl"
                        onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-3 group">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 group-focus-within:text-cyan-400 transition-colors">Matric Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. miustd2021232"
                        className="w-full rounded-2xl border-2 border-white/10 bg-[#020202]/80 px-4 py-4 text-lg font-black lowercase tracking-tight text-white shadow-inner outline-none transition-all placeholder:text-gray-700 focus:border-cyan-400 focus:bg-white/5 sm:px-6 sm:py-5 sm:text-xl"
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
                        className="w-full rounded-2xl border-2 border-white/10 bg-[#020202]/80 px-4 py-4 text-lg font-black tracking-tight text-white shadow-inner outline-none transition-all focus:border-cyan-400 focus:bg-white/5 sm:px-6 sm:py-5 sm:text-xl"
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
                      className="group relative flex w-full items-center justify-center space-x-3 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-5 text-lg font-black lowercase tracking-tight text-black shadow-[0_15px_30px_rgba(34,211,238,0.3)] transition-all hover:brightness-110 sm:py-6 sm:text-2xl"
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
  );
}