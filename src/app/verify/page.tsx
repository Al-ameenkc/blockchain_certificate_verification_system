"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ShieldCheck } from "lucide-react";

export default function VerifyByReferencePage() {
  const router = useRouter();
  const [reference, setReference] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedReference = reference.trim();
    if (!trimmedReference) return;
    router.push(`/verify/${encodeURIComponent(trimmedReference)}`);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-[420px] h-[420px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] bg-purple-700/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="w-full max-w-2xl bg-[#0A0A0A]/85 backdrop-blur-3xl border-2 border-white/10 rounded-[2rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
      >
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl border-2 border-cyan-400/40 bg-cyan-400/10 flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter lowercase text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            verify certificate.
          </h1>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] font-bold text-cyan-400/80">
            check authenticity using reference number
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
              Certificate Reference Number
            </label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. MIU-Ab3kP1xQ9z"
              className="w-full px-6 py-5 bg-[#020202]/80 border-2 border-white/10 rounded-2xl focus:border-cyan-400 focus:bg-white/5 outline-none transition-all text-white placeholder-gray-700 text-lg font-black tracking-tight"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded-2xl font-black text-xl hover:brightness-110 transition-all flex items-center justify-center space-x-3 lowercase tracking-tight"
          >
            <Search className="w-5 h-5" strokeWidth={3} />
            <span>verify now.</span>
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
