"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, LayoutList, Award, ScrollText, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Certificate Records', href: '/dashboard/record', icon: LayoutList },
    { name: 'Issued Certificates', href: '/dashboard/issued', icon: Award },
    { name: 'Registered Certificates', href: '/dashboard/registered', icon: ScrollText },
    { name: 'Node Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-[#050505]/80 backdrop-blur-3xl border-r border-white/5 flex flex-col p-6 z-50">
      <div className="mb-10 px-4 pt-2">
        <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 tracking-tighter">
          Miu Verify
        </h2>
        <div className="h-1 w-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mt-2"></div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all text-sm font-semibold overflow-hidden",
                isActive ? "text-white" : "text-gray-400 hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 shadow-[inset_0_0_20px_rgba(168,85,247,0.15)] rounded-xl border border-white/10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn("relative z-10 w-5 h-5 transition-transform duration-300", isActive ? "scale-110 text-purple-400" : "group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="relative z-10 tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5 mt-auto">
        <Link
          href="/login"
          className="group flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Terminate Session</span>
        </Link>
      </div>
    </aside>
  );
}