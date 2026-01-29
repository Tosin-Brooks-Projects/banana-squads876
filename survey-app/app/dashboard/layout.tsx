'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-neutral-50 overflow-x-hidden">
      <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 min-w-0 p-4 lg:p-6 lg:ml-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
