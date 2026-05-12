"use client";

import { ReactNode, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="relative flex min-h-screen flex-row bg-[#020202] font-sans text-gray-200 selection:bg-cyan-500/30">
      <div className="fixed top-0 right-0 w-[min(800px,100vw)] h-[min(800px,100vh)] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="fixed bottom-[-10%] left-[10%] w-[min(600px,90vw)] h-[min(600px,90vh)] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />

      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] max-w-[18rem] transition-transform duration-300 ease-out lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:flex-shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/5 bg-[#020202]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="dashboard-sidebar"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-cyan-400 transition-colors hover:bg-white/5"
          >
            {mobileOpen ? <X className="h-5 w-5" strokeWidth={2.5} /> : <Menu className="h-5 w-5" strokeWidth={2.5} />}
          </button>
          <span className="truncate text-sm font-black lowercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            miu verify.
          </span>
          <span className="w-11" aria-hidden />
        </header>

        <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
