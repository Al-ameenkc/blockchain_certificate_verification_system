"use client";
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

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

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex font-sans">
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
            <p className="text-purple-400/40 text-sm mt-1">{subtitle}</p>
          </div>
          
          <div className="bg-[#0A0A0A] border border-purple-500/10 rounded-2xl px-5 py-3 flex items-center space-x-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Node: Active</span>
          </div>
        </header>

        <div className="max-w-4xl bg-[#0A0A0A] rounded-3xl border border-purple-500/10 p-8 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input 
                type="text" 
                placeholder="Search names, matriculation numbers, or actions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-purple-500/20 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-500/60 transition-all placeholder-gray-600"
              />
            </div>
            
            <div className="flex gap-4">
              {showTypeFilter && (
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-[#111] border border-purple-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/60 appearance-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Saved">Final / Saved</option>
                  <option value="Draft">Drafts</option>
                </select>
              )}
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-[#111] border border-purple-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/60 appearance-none cursor-pointer"
              >
                <option value="Newest">Newest First</option>
                <option value="Oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-4xl space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center text-gray-600 py-12 bg-[#0A0A0A] rounded-3xl border border-purple-500/5 shadow-2xl">
              No matching records found.
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div 
                key={activity.id} 
                onClick={() => activity.url && router.push(activity.url)}
                className={`flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-[#0A0A0A] rounded-2xl border border-purple-500/10 hover:border-purple-500/40 transition-all shadow-xl shadow-purple-900/5 hover:-translate-y-1 ${activity.url ? 'cursor-pointer hover:bg-[#111]' : ''}`}
              >
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                    <h3 className="text-base font-bold text-gray-100">{activity.action}</h3>
                  </div>
                  <p className="text-sm text-gray-400 pl-5">{activity.details}</p>
                </div>
                <div className="mt-4 md:mt-0 text-xs text-purple-400/80 font-mono bg-[#111] px-4 py-2 rounded-xl border border-purple-500/20 flex items-center space-x-2">
                  <span>⏰</span>
                  <span>{new Date(activity.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
