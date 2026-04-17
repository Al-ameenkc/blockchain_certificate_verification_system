"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalType = 'success' | 'error' | 'info';

interface ModalContextType {
  showLoading: (state: boolean) => void;
  showAlert: (title: string, message: string, type: ModalType) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: ModalType }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showLoading = (state: boolean) => setIsLoading(state);

  const showAlert = (title: string, message: string, type: ModalType) => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

  return (
    <ModalContext.Provider value={{ showLoading, showAlert }}>
      {children}

      <AnimatePresence>
        {/* Loading Overlay */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020202]/80 backdrop-blur-md"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="relative w-24 h-24 text-cyan-400 animate-[spin_2s_linear_infinite]" strokeWidth={2} />
              </div>
              <p className="mt-8 text-cyan-400 font-black tracking-[0.3em] uppercase text-xs animate-pulse">
                processing tx...
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Alert Modal */}
        {alertConfig.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020202]/60 backdrop-blur-sm p-4"
            onClick={closeAlert}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full max-w-md bg-[#0A0A0A]/90 backdrop-blur-3xl rounded-[3rem] p-10 border-2 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden text-center",
                alertConfig.type === 'success' ? 'border-emerald-400/50 shadow-[0_0_80px_rgba(16,185,129,0.2)]' :
                alertConfig.type === 'error' ? 'border-red-500/50 shadow-[0_0_80px_rgba(239,68,68,0.2)]' :
                'border-cyan-400/50 shadow-[0_0_80px_rgba(34,211,238,0.2)]'
              )}
            >
              {/* Background Glow */}
              <div className={cn(
                "absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] -translate-y-10 translate-x-10 pointer-events-none",
                alertConfig.type === 'success' ? 'bg-emerald-500/20' :
                alertConfig.type === 'error' ? 'bg-red-500/20' :
                'bg-cyan-500/20'
              )} />

              <motion.div 
                initial={{ scale: 0, rotate: alertConfig.type === 'error' ? 180 : -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
                className={cn(
                  "w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border-2 shadow-xl",
                  alertConfig.type === 'success' ? 'bg-emerald-500/20 border-emerald-400/50' :
                  alertConfig.type === 'error' ? 'bg-red-500/20 border-red-500/50' :
                  'bg-cyan-500/20 border-cyan-400/50'
                )}
              >
                {alertConfig.type === 'success' && <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={3} />}
                {alertConfig.type === 'error' && <XCircle className="w-10 h-10 text-red-500" strokeWidth={3} />}
                {alertConfig.type === 'info' && <AlertCircle className="w-10 h-10 text-cyan-400" strokeWidth={3} />}
              </motion.div>

              <h2 className={cn(
                "text-3xl font-black mb-3 tracking-tighter lowercase",
                alertConfig.type === 'success' ? 'text-emerald-400' :
                alertConfig.type === 'error' ? 'text-red-500' :
                'text-cyan-400'
              )}>
                {alertConfig.title}.
              </h2>
              
              <p className="text-gray-400 font-bold tracking-wide mb-8 leading-relaxed lowercase">
                {alertConfig.message}
              </p>

              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeAlert}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-lg transition-all lowercase tracking-tight",
                  alertConfig.type === 'success' ? 'bg-emerald-500 text-black hover:bg-emerald-400' :
                  alertConfig.type === 'error' ? 'bg-red-500 text-white hover:bg-red-400' :
                  'bg-cyan-400 text-black hover:bg-cyan-300'
                )}
              >
                acknowledge.
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
