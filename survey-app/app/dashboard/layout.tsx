'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseUser, loading, needsOnboarding } = useAuthContext();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.push('/login');
      } else if (needsOnboarding) {
        router.push('/onboarding');
      }
    }
  }, [firebaseUser, loading, needsOnboarding, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
          <p className="text-neutral-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
          <p className="text-neutral-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-white overflow-hidden flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 min-w-0 overflow-y-auto py-6 md:py-8 bg-[#f5f5f5]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-[1400px] mx-auto w-full px-4 md:px-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
