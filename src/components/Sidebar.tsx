"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Home', href: '/dashboard', icon: '✦' },
    { name: 'Certificate Records', href: '/dashboard/record', icon: '📋' },
    { name: 'Issued Certificates', href: '/dashboard/issued', icon: '🎓' },
    { name: 'Registered Certificates', href: '/dashboard/registered', icon: '📜' },
    { name: 'Node Settings', href: '/dashboard/settings', icon: '⚙' },
  ];

  return (
    <aside className="w-64 bg-[#080808] border-r border-purple-500/5 flex flex-col p-8">
      <div className="mb-12">
        <h2 className="text-lg font-bold text-white tracking-tight">Miu Verify</h2>
        <div className="h-1 w-8 bg-purple-600 rounded-full mt-1"></div>
      </div>

      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                  : 'text-gray-500 hover:text-purple-300'
                }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-purple-500/5">
        <Link
          href="/login"
          className="text-xs font-bold text-gray-600 hover:text-red-400 transition-colors uppercase tracking-widest"
        >
          Terminate Session
        </Link>
      </div>
    </aside>
  );
}