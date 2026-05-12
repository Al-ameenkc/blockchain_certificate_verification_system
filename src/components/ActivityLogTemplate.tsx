"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search, Clock, ListFilter, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Activity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  url?: string;
}

function resolveActivityTarget(activity: Activity): string | null {
  if (activity.url) {
    try {
      if (activity.url.startsWith("http")) {
        const u = new URL(activity.url);
        return `${u.pathname}${u.search}`;
      }
      return activity.url;
    } catch {
      return activity.url;
    }
  }
  const refMatch = activity.details.match(/ref\s+(MIU-[A-Za-z0-9]+)/i);
  if (refMatch) {
    return `/certificate/${encodeURIComponent(refMatch[1])}`;
  }
  return null;
}

interface ActivityLogTemplateProps {
  title: string;
  subtitle: string;
  baseFilter: (a: Activity) => boolean;
  showTypeFilter?: boolean;
}

export default function ActivityLogTemplate({ title, subtitle, baseFilter, showTypeFilter = true }: ActivityLogTemplateProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");
  const router = useRouter();

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('activities').select('*');
        if (data && data.length > 0 && !error) {
          setActivities(data);
          setIsLoading(false);
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
      setIsLoading(false);
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
    <main className="relative z-10 min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12">
        <header className="mb-10 mt-2 flex flex-col gap-6 sm:mb-12 sm:mt-4 lg:mb-16 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }} 
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="min-w-0"
          >
            <h1 className="mb-3 text-3xl font-black lowercase leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 sm:text-5xl lg:mb-4 lg:text-[3.5rem]">
              {title.toLowerCase()}.
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80 sm:text-xs">
              {"// "}{subtitle}
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative mb-6 max-w-5xl overflow-hidden rounded-2xl border-2 border-white/5 bg-[#0A0A0A]/60 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-3xl group sm:mb-10 sm:rounded-[2.5rem] sm:p-8"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:justify-between md:gap-6">
            <div className="relative min-w-0 flex-1 group/search">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-colors group-focus-within/search:text-cyan-400 sm:left-6 sm:h-6 sm:w-6" />
              <input 
                type="text" 
                placeholder="search ledgers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border-2 border-white/10 bg-[#020202]/80 py-4 pl-12 pr-4 text-base font-black lowercase tracking-tight text-white shadow-inner outline-none transition-all placeholder:text-gray-600 focus:border-cyan-400 focus:bg-white/5 sm:rounded-3xl sm:py-5 sm:pl-16 sm:pr-6 sm:text-lg"
              />
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              {showTypeFilter && (
                <div className="relative min-w-0 flex-1 group/filter sm:min-w-[10rem] sm:flex-initial">
                  <ListFilter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-colors group-focus-within/filter:text-cyan-400 sm:left-5" />
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-2xl border-2 border-white/10 bg-[#020202]/80 py-4 pl-11 pr-4 text-base font-black lowercase tracking-tight text-white shadow-inner outline-none transition-all hover:bg-white/5 focus:border-cyan-400 sm:rounded-3xl sm:py-5 sm:pl-12 sm:pr-6 sm:text-lg"
                  >
                    <option value="All">all types</option>
                    <option value="Saved">anchored</option>
                    <option value="Draft">drafts</option>
                  </select>
                </div>
              )}
              <div className="relative min-w-0 flex-1 group/sort sm:min-w-[9rem] sm:flex-initial">
                <Clock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-colors group-focus-within/sort:text-cyan-400 sm:left-5" />
                <select 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-2xl border-2 border-white/10 bg-[#020202]/80 py-4 pl-11 pr-4 text-base font-black lowercase tracking-tight text-white shadow-inner outline-none transition-all hover:bg-white/5 focus:border-cyan-400 sm:rounded-3xl sm:py-5 sm:pl-12 sm:pr-6 sm:text-lg"
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
          className="max-w-5xl space-y-4 sm:space-y-5"
        >
          <AnimatePresence>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 sm:py-20 bg-[#0A0A0A]/40 backdrop-blur-md rounded-[2rem] border-2 border-white/5 border-dashed sm:rounded-[3rem]"
              >
                <div className="flex flex-col items-center gap-4 text-cyan-400 uppercase tracking-[0.2em] text-xs">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span>loading records from database...</span>
                </div>
              </motion.div>
            ) : filteredActivities.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[2rem] border-2 border-dashed border-white/5 bg-[#0A0A0A]/40 py-16 text-center text-xs font-black uppercase tracking-[0.3em] text-gray-500 backdrop-blur-md sm:rounded-[3rem] sm:py-20"
              >
                no matching records located in ledger
              </motion.div>
            ) : (
              filteredActivities.map((activity) => {
                const target = resolveActivityTarget(activity);
                return (
                <motion.div 
                  key={activity.id}
                  variants={itemVariants}
                  layout
                  onClick={() => target && router.push(target)}
                  className={cn(
                    "group relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border-2 bg-[#0A0A0A]/80 p-5 backdrop-blur-xl transition-all duration-300 sm:rounded-[2rem] sm:p-8 md:flex-row md:items-center",
                    target ? 'cursor-pointer hover:border-cyan-400 hover:shadow-[0_20px_40px_rgba(34,211,238,0.1)] border-white/10' : 'border-white/5'
                  )}
                >
                  {target && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                  )}
                  
                  <div className="relative z-10 min-w-0 flex-1 pr-0 md:pr-8">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="h-3 w-3 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]" />
                      <h3 className="text-lg font-black lowercase tracking-tight text-white sm:text-xl">{activity.action}</h3>
                    </div>
                    <p className="pl-0 text-sm font-medium leading-relaxed text-gray-400 sm:pl-7 sm:text-base">{activity.details}</p>
                  </div>

                  <div className="relative z-10 flex w-full shrink-0 flex-wrap items-center gap-4 md:mt-0 md:w-auto md:justify-end">
                    <div className="flex flex-col items-start rounded-xl border-2 border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 shadow-inner sm:items-end sm:px-5 sm:py-3">
                      <span className="mb-1 text-gray-500">TIMESTAMP</span>
                      <span className="break-all text-left sm:text-right">{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                    {target && (
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border-2 border-white/10 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-black transition-colors duration-300">
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </main>
  );
}
