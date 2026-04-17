"use client";
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search, Clock, ListFilter, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Activity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  url?: string;
}

interface ActivityLogTemplateProps {
  title: string;
  subtitle: string;
  baseFilter: (a: Activity) => boolean;
  showTypeFilter?: boolean;
}

export default function ActivityLogTemplate({ title, subtitle, baseFilter, showTypeFilter = true }: ActivityLogTemplateProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");
  const router = useRouter();

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const { data, error } = await supabase.from('activities').select('*');
        if (data && data.length > 0 && !error) {
          setActivities(data);
          return;
        }
      } catch (e) {
        console.error("Supabase fetch failed", e);
      }
      
      // Fallback
      const loaded = localStorage.getItem('activities');
      if (loaded) {
        setActivities(JSON.parse(loaded));
      }
    };
    fetchLog();
  }, []);

  const filteredActivities = activities
    .filter(baseFilter)
    .filter(a => {
      const matchSearch = a.details.toLowerCase().includes(searchQuery.toLowerCase()) || a.action.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      
      if (showTypeFilter && typeFilter !== "All") {
        const isDraft = a.action.includes('(Draft)');
        if (typeFilter === 'Draft' && !isDraft) return false;
        if (typeFilter === 'Saved' && isDraft) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return sortOrder === "Newest" ? tB - tA : tA - tB;
    });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.5 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-gray-200 flex font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      <Sidebar />

      {/* Cyber Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="fixed bottom-0 left-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />

      <main className="flex-1 p-12 overflow-y-auto relative z-10">
        <header className="flex justify-between items-start mb-16 mt-4">
          <motion.div 
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }} 
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <h1 className="text-[3.5rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 tracking-tighter leading-none mb-4 lowercase">
              {title.toLowerCase()}.
            </h1>
            <p className="text-cyan-400/80 font-bold tracking-[0.2em] uppercase text-xs">
              // {subtitle}
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="max-w-5xl bg-[#0A0A0A]/60 backdrop-blur-3xl rounded-[2.5rem] border-2 border-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] mb-10 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="relative flex-1 group/search">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within/search:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                placeholder="search ledgers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#020202]/80 border-2 border-white/10 text-white rounded-3xl py-5 pl-16 pr-6 focus:outline-none focus:border-cyan-400 focus:bg-white/5 transition-all placeholder-gray-600 font-black tracking-tight text-lg lowercase shadow-inner"
              />
            </div>
            
            <div className="flex gap-4">
              {showTypeFilter && (
                <div className="relative group/filter">
                  <ListFilter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/filter:text-cyan-400 transition-colors pointer-events-none" />
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-[#020202]/80 border-2 border-white/10 text-white font-black tracking-tight rounded-3xl pl-12 pr-6 py-5 focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer hover:bg-white/5 transition-all shadow-inner lowercase"
                  >
                    <option value="All">all types</option>
                    <option value="Saved">anchored</option>
                    <option value="Draft">drafts</option>
                  </select>
                </div>
              )}
              <div className="relative group/sort">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/sort:text-cyan-400 transition-colors pointer-events-none" />
                <select 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-[#020202]/80 border-2 border-white/10 text-white font-black tracking-tight rounded-3xl pl-12 pr-6 py-5 focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer hover:bg-white/5 transition-all shadow-inner lowercase"
                >
                  <option value="Newest">newest</option>
                  <option value="Oldest">oldest</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-5xl space-y-5"
        >
          <AnimatePresence>
            {filteredActivities.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center text-gray-500 py-20 bg-[#0A0A0A]/40 backdrop-blur-md rounded-[3rem] border-2 border-white/5 border-dashed font-black uppercase tracking-[0.3em] text-xs"
              >
                no matching records located in ledger
              </motion.div>
            ) : (
              filteredActivities.map((activity) => (
                <motion.div 
                  key={activity.id}
                  variants={itemVariants}
                  layout
                  onClick={() => activity.url && router.push(activity.url)}
                  className={cn(
                    "group flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden",
                    activity.url ? 'cursor-pointer hover:border-cyan-400 hover:shadow-[0_20px_40px_rgba(34,211,238,0.1)] border-white/10' : 'border-white/5'
                  )}
                >
                  {activity.url && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                  )}
                  
                  <div className="relative z-10 flex-1 pr-8">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]" />
                      <h3 className="text-xl font-black text-white tracking-tight lowercase">{activity.action}</h3>
                    </div>
                    <p className="text-base text-gray-400 font-medium pl-7 leading-relaxed">{activity.details}</p>
                  </div>

                  <div className="mt-6 md:mt-0 flex items-center space-x-6 relative z-10">
                    <div className="text-[10px] text-cyan-400 font-black tracking-[0.2em] uppercase bg-cyan-500/10 px-5 py-3 rounded-xl border-2 border-cyan-500/20 shadow-inner flex flex-col items-end">
                      <span className="text-gray-500 mb-1">TIMESTAMP</span>
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                    {activity.url && (
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border-2 border-white/10 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-black transition-colors duration-300">
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
