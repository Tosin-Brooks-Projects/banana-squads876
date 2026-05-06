'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'My Quests', href: '/dashboard', icon: LayoutDashboard, color: 'green' },
  { name: 'New Quest', href: '/dashboard/create', icon: PlusCircle, color: 'blue' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'graphite' },
  { name: 'Upgrade', href: '/pricing', icon: CreditCard, color: 'yellow' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { firebaseUser, user } = useAuthContext();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const displayName = user?.displayName || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Friend';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-duo-black/30 backdrop-blur-[2px] z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 p-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          lg:static lg:translate-x-0 lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col bg-white border-4 border-gray-100 rounded-[32px] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.02)] overflow-hidden relative">
          {/* Fun Logo Area */}
          <div className="p-8 pb-6 border-b-4 border-gray-50 bg-gray-50/30">
            <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 group">
              <span className="font-black text-2xl tracking-tighter text-gray-900 group-hover:text-orange-500 transition-colors">
                Unboring<span className="text-orange-500">!</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-4">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="block group"
                >
                  <div
                    className={`
                      flex items-center gap-4 px-5 py-4 rounded-2xl border-4 transition-all active:translate-y-1 active:shadow-none
                      ${active 
                        ? 'bg-orange-500 border-orange-600 text-white shadow-[0_4px_0_0_#c2410c]' 
                        : 'bg-transparent border-transparent text-gray-500 hover:bg-orange-50 hover:border-orange-100 hover:text-orange-600'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'stroke-[3]' : 'stroke-2'}`} />
                    <span className="font-black uppercase text-[11px] tracking-widest">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Upgrade Card (Tactile Style) */}
          <div className="px-4 pb-6">
             <div className="bg-gray-900 rounded-[28px] p-6 border-4 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                <div className="absolute bottom-[-15%] right-[-10%] w-28 h-28 opacity-30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 pointer-events-none">
                  <img src="/orange-kea-mascot.png" alt="" className="w-full h-full object-contain" />
                </div>
                
                <p className="text-white font-black text-xs uppercase tracking-widest mb-1 relative z-10">Elite Quest</p>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-tighter mb-4 relative z-10">Unlock all realms ✨</p>
                
                <Link href="/pricing" onClick={onClose}>
                  <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-xl uppercase border-b-4 border-orange-700 transition-all active:translate-y-1 active:border-b-0 relative z-10">
                     Go Premium
                  </button>
                </Link>
             </div>
          </div>

          {/* User Profile Footer */}
          <div className="p-5 border-t-4 border-gray-50 flex items-center gap-3 bg-gray-50/20 hover:bg-gray-50 transition-colors">
             <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-gray-100 bg-white shadow-sm shrink-0">
                <img 
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-gray-900 leading-none uppercase truncate tracking-tight">{displayName}</span>
                <div className="flex items-center gap-1 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Level 1 Creator</span>
                </div>
             </div>
             <button 
               onClick={() => signOut()}
               className="ml-auto p-2 text-gray-300 hover:text-red-500 transition-colors"
               title="Sign Out"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </aside>
    </>
  );
}
