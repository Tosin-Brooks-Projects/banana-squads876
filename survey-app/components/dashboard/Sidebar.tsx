'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  LogOut,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import { getUserSurveys } from '@/lib/firebase/firestore';
import { Survey } from '@/lib/types';
import { getAdventureImage } from '@/lib/utils/helpers';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const secondaryNav = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { firebaseUser, user } = useAuthContext();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const [recentSurveys, setRecentSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    getUserSurveys(firebaseUser.uid).then((surveys) =>
      setRecentSurveys(surveys.slice(0, 4))
    );
  }, [firebaseUser]);

  const displayName =
    user?.displayName ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    'Account';

  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[240px] flex flex-col
          bg-white border-r border-[#e5e5e5]
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          lg:static lg:translate-x-0 lg:z-0 lg:h-full
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── Logo ── */}
        <div className="flex items-center px-5 h-14 border-b border-[#e5e5e5] flex-shrink-0">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="group flex items-center gap-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
          >
            <span className="font-fredoka text-[21px] font-bold tracking-tight text-[#3c3c3c] group-hover:text-orange-500 transition-colors duration-150">
              Unboring
            </span>
            <span className="font-fredoka text-[21px] font-bold text-orange-500">.</span>
          </Link>
        </div>

        {/* ── Primary nav ── */}
        <div className="px-3 pt-5 pb-2">
          {/* Surveys nav link */}
          {(() => {
            const active = isActive('/dashboard');
            return (
              <Link
                href="/dashboard"
                onClick={onClose}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-outfit font-bold transition-all duration-150 mb-3
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1
                  ${active
                    ? 'bg-orange-500 text-white shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none'
                    : 'text-[#777777] hover:bg-[#f5f5f5] hover:text-[#3c3c3c]'
                  }
                `}
              >
                <LayoutDashboard
                  className={`w-[17px] h-[17px] flex-shrink-0 ${active ? 'text-white' : 'text-[#afafaf] group-hover:text-[#777777]'}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                Surveys
              </Link>
            );
          })()}

          {/* New survey — standalone CTA */}
          <Link
            href="/dashboard/create"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-[#e5e5e5] text-[13px] font-bold text-[#afafaf] font-outfit hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
          >
            <PlusCircle className="w-4 h-4" strokeWidth={2} />
            New survey
          </Link>
        </div>

        {/* ── Recent surveys ── */}
        {recentSurveys.length > 0 && (
          <div className="px-3 pt-4 pb-2">
            <p className="px-2 mb-2 text-[10px] font-bold text-[#afafaf] uppercase tracking-widest font-outfit">
              Recent
            </p>
            <div className="space-y-0.5">
              {recentSurveys.map((survey) => {
                const isCurrentSurvey = pathname === `/dashboard/${survey.id}`;
                return (
                  <Link
                    key={survey.id}
                    href={`/dashboard/${survey.id}`}
                    onClick={onClose}
                    className={`
                      group flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1
                      ${isCurrentSurvey ? 'bg-orange-50' : 'hover:bg-[#f5f5f5]'}
                    `}
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={getAdventureImage(survey.adventureType)}
                        alt=""
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    <span className={`flex-1 min-w-0 text-[12.5px] font-outfit font-semibold truncate ${isCurrentSurvey ? 'text-orange-600' : 'text-[#555] group-hover:text-[#3c3c3c]'}`}>
                      {survey.title || 'Untitled'}
                    </span>
                    <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                      survey.status === 'published' ? 'bg-green-400' :
                      survey.status === 'closed'    ? 'bg-red-300' :
                                                      'bg-[#e5e5e5]'
                    }`} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Spacer — pushes secondary + footer to bottom ── */}
        <div className="flex-1" />

        {/* ── Secondary nav ── */}
        <div className="px-3 pb-3">
          <p className="px-2 mb-2 text-[10px] font-bold text-[#afafaf] uppercase tracking-widest font-outfit">
            More
          </p>
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-outfit font-bold transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1
                    ${active
                      ? 'bg-orange-500 text-white shadow-[0_3px_0_#c2410c]'
                      : 'text-[#777777] hover:bg-[#f5f5f5] hover:text-[#3c3c3c]'
                    }
                  `}
                >
                  <Icon
                    className={`w-[17px] h-[17px] flex-shrink-0 ${active ? 'text-white' : 'text-[#afafaf] group-hover:text-[#777777]'}`}
                    strokeWidth={2}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Footer: upgrade + user ── */}
        <div className="border-t border-[#e5e5e5] p-3 space-y-2 flex-shrink-0">
          {/* Upgrade card */}
          <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-3">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#3c3c3c] font-outfit leading-tight">Free plan</p>
                <p className="text-[10.5px] text-[#afafaf] font-outfit leading-tight">Unlock all features</p>
              </div>
            </div>
            <Link
              href="/pricing"
              onClick={onClose}
              className="flex items-center justify-center w-full py-2 rounded-xl bg-orange-500 text-white text-[12px] font-bold font-outfit shadow-[0_3px_0_#c2410c] hover:bg-orange-600 transition-colors active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
            >
              Upgrade plan
            </Link>
          </div>

          {/* User row */}
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#e5e5e5] flex-shrink-0 bg-[#f5f5f5]">
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-bold text-[#3c3c3c] font-outfit truncate leading-tight">{displayName}</p>
              <p className="text-[10.5px] text-[#afafaf] font-outfit truncate leading-tight mt-0.5">{firebaseUser?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              className="flex-shrink-0 p-1.5 rounded-xl text-[#e5e5e5] hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
