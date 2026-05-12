"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, LayoutList, Award, ScrollText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Records', href: '/dashboard/record', icon: LayoutList },
    { name: 'Issued', href: '/dashboard/issued', icon: Award },
    { name: 'Registered', href: '/dashboard/registered', icon: ScrollText },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <aside className="w-72 bg-[#020202]/60 backdrop-blur-3xl border-r border-white/5 flex flex-col p-6 z-50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="mb-12 px-4 pt-4"
      >
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 tracking-tighter lowercase">
          miu verify.
        </h2>
        <div className="h-1.5 w-12 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full mt-2 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
      </motion.div>

      <nav className="flex-1 space-y-3">
        {menuItems.map((item, i) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all text-base font-bold overflow-hidden lowercase tracking-wide",
                  isActive ? "text-white" : "text-gray-500 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)] rounded-2xl border border-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                <Icon className={cn("relative z-10 w-5 h-5 transition-transform duration-300", isActive ? "scale-125 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "group-hover:scale-110")} strokeWidth={2.5} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5 mt-auto">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex items-center justify-center space-x-3 px-4 py-4 rounded-2xl text-xs font-black text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-[0.2em]"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}