'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, Menu, User, ChevronDown } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Surveys',
  '/dashboard/create': 'New survey',
  '/dashboard/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/dashboard/') && pathname !== '/dashboard/create') return 'Survey details';
  return 'Dashboard';
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { firebaseUser, user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
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
    } catch {
      setIsSigningOut(false);
    }
  };

  const displayName =
    user?.displayName ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    'Account';

  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#e5e5e5]">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:px-6 gap-4">

        {/* Left: hamburger (mobile) + page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#777777] hover:bg-gray-100 hover:text-[#3c3c3c] transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <h1 className="text-sm font-bold text-[#3c3c3c] font-outfit truncate">{pageTitle}</h1>
        </div>

        {/* Right: user menu */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] py-1.5 pl-1.5 pr-3 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer"
            >
              <div className="h-6 w-6 overflow-hidden rounded-full border border-[#e5e5e5] flex-shrink-0 bg-white">
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              </div>
              <span className="hidden text-xs font-bold text-[#3c3c3c] font-outfit sm:block max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#afafaf] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-[#e5e5e5] bg-white shadow-lg shadow-black/5 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-3 py-3 border-b border-[#e5e5e5]">
                    <p className="text-xs font-bold text-[#3c3c3c] font-outfit truncate">{displayName}</p>
                    <p className="text-[11px] text-[#afafaf] font-outfit mt-0.5 truncate">{firebaseUser?.email}</p>
                  </div>

                  {/* Links */}
                  <div className="p-1">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#3c3c3c] font-outfit hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#afafaf]" />
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#3c3c3c] font-outfit hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-[#afafaf]" />
                      Profile
                    </Link>
                  </div>

                  <div className="border-t border-[#e5e5e5] p-1">
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-500 font-outfit hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {isSigningOut ? 'Signing out…' : 'Sign out'}
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
