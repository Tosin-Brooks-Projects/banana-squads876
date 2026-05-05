'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, Bell, Menu, User, ChevronDown, Sparkles, PartyPopper } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { firebaseUser, user } = useAuthContext();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const displayName = user?.displayName || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Friend';
  
  // Pixel-art is way more fun!
  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b-2 border-duo-gray">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 md:px-8">
        {/* Left: Mobile Menu & Clean Logo */}
        <div className="flex items-center gap-2 sm:gap-6">
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white border-2 border-duo-gray shadow-[0_4px_0_#e5e5e5] text-duo-graphite transition-all active:translate-y-[2px] active:shadow-none lg:hidden"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          
          <Link href="/dashboard" className="group">
             <span className="font-fredoka text-xl sm:text-3xl font-bold tracking-tight text-duo-black">
                Unboring<span className="text-duo-green">.</span>
             </span>
          </Link>
        </div>

        {/* Right: Tactile Actions & Profile */}
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-duo-yellow shadow-[0_4px_0_#ffc700] text-duo-yellow transition-all active:translate-y-[2px] active:shadow-none sm:flex"
          >
            <Sparkles className="h-6 w-6" fill="currentColor" fillOpacity={0.2} />
          </motion.button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-3 rounded-2xl border-2 border-duo-gray p-1.5 sm:pr-4 transition-all hover:bg-duo-gray/10 active:translate-y-[2px]"
            >
              <div className="h-9 w-9 overflow-hidden rounded-xl border-2 border-duo-gray flex-shrink-0">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover bg-white"
                />
              </div>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-[11px] font-black text-duo-black leading-none uppercase">{displayName}</span>
                <span className="text-[9px] font-black text-duo-green mt-1 uppercase tracking-wider">Superstar</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-duo-silver transition-transform duration-300 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-4 w-60 origin-top-right overflow-hidden rounded-[2rem] border-2 border-duo-gray bg-white shadow-2xl"
                >
                  <div className="bg-duo-gray/20 p-5 text-center border-b-2 border-duo-gray">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-duo-graphite">Hey Superstar!</p>
                     <p className="text-sm font-black text-duo-black mt-1 uppercase">{displayName} ✨</p>
                  </div>

                  <div className="p-3 space-y-2">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-wider text-duo-graphite hover:bg-duo-gray/30 transition-all"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-wider text-duo-graphite hover:bg-duo-gray/30 transition-all"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>

                    <div className="my-2 h-[2px] bg-duo-gray mx-2" />

                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-wider text-red-500 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      {isSigningOut ? 'Bye bye...' : 'Log Out'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
