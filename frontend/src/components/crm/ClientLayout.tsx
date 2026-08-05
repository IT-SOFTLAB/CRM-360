"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CRMProvider, useCRM } from '@/context/CRMContext';
import ShellLayout from './ShellLayout';
import heroMascot from "@/assets/hero-mascot.jpeg";
function AuthGuard({ children }: { children: React.ReactNode }) {
  const crm = useCRM();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until the silent token-refresh check is complete before making routing decisions
    if (!crm.authReady) return;

    if (!crm.user && pathname !== '/login') {
      router.push('/login');
    } else if (crm.user && (pathname === '/login' || pathname === '/')) {
      router.push('/dashboard');
    }
  }, [crm.user, crm.authReady, pathname, router]);

  // Show a loading spinner while auth is initialising (token refresh in progress)
  // This prevents the flash redirect to /login on page reload
  if (!crm.authReady) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center overflow-hidden relative">
        {/* Soft glow behind hero */}
        <div className="absolute w-96 h-96 bg-primary/15 rounded-full blur-3xl"></div>

        {/* City skyline silhouette, bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-1 opacity-10 pointer-events-none">
          <div className="w-8 h-16 bg-primary"></div>
          <div className="w-6 h-24 bg-primary"></div>
          <div className="w-10 h-14 bg-primary"></div>
          <div className="w-7 h-20 bg-primary"></div>
          <div className="w-9 h-12 bg-primary"></div>
          <div className="w-6 h-24 bg-primary"></div>
          <div className="w-8 h-16 bg-primary"></div>
        </div>

        <div className="relative flex flex-col items-center gap-6">
          {/* Flying hero with bob + motion streaks */}
          <div className="relative w-80 h-40 overflow-hidden">
            {/* Flying Hero */}
            <div className="absolute inset-0 flex items-center justify-center animate-heroFly">
              {/* Motion Lines */}
              <div className="absolute -left-12 flex flex-col gap-2 opacity-60">
                <span className="w-12 h-1 bg-blue-300 rounded-full animate-pulse"></span>
                <span className="w-8 h-1 bg-blue-400 rounded-full animate-pulse delay-75"></span>
                <span className="w-5 h-1 bg-blue-500 rounded-full animate-pulse delay-150"></span>
              </div>

              {/* Glow */}
              <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>

              {/* Hero */}
              <img
                src={heroMascot.src}
                alt="Loading"
                className="w-36 h-36 object-contain drop-shadow-2xl animate-heroTilt"
              />

              {/* Sparkles */}
              <div className="absolute top-4 right-6 text-yellow-300 text-xl animate-ping">
                ✦
              </div>
            </div>
          </div>

          {/* Brand text */}
          <div className="text-center space-y-1.5">
            <p className="text-base font-bold text-primary tracking-wide">CRM 360</p>
            <p className="text-xs text-txt-secondary font-medium tracking-widest uppercase">
              Restoring your session
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_0ms]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_150ms]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_300ms]"></span>
          </div>
        </div>
      </div>
    );
  }

  // Auth is ready but user is not logged in — show brief spinner while navigating to login
  if (!crm.user && pathname !== '/login') {
    return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center overflow-hidden relative">
  {/* Soft glow behind hero */}
  <div className="absolute w-96 h-96 bg-primary/15 rounded-full blur-3xl"></div>

  {/* City skyline silhouette, bottom */}
  <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-1 opacity-10 pointer-events-none">
    <div className="w-8 h-16 bg-primary"></div>
    <div className="w-6 h-24 bg-primary"></div>
    <div className="w-10 h-14 bg-primary"></div>
    <div className="w-7 h-20 bg-primary"></div>
    <div className="w-9 h-12 bg-primary"></div>
    <div className="w-6 h-24 bg-primary"></div>
    <div className="w-8 h-16 bg-primary"></div>
  </div>

  <div className="relative flex flex-col items-center gap-6">
    {/* Flying hero with bob + motion streaks */}
  <div className="relative w-80 h-40 overflow-hidden">
  {/* Flying Hero */}
  <div className="absolute inset-0 flex items-center justify-center animate-heroFly">

    {/* Motion Lines */}
    <div className="absolute -left-12 flex flex-col gap-2 opacity-60">
      <span className="w-12 h-1 bg-blue-300 rounded-full animate-pulse"></span>
      <span className="w-8 h-1 bg-blue-400 rounded-full animate-pulse delay-75"></span>
      <span className="w-5 h-1 bg-blue-500 rounded-full animate-pulse delay-150"></span>
    </div>

    {/* Glow */}
    <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>

    {/* Hero */}
    <img
     src={heroMascot.src}
      alt="Loading"
      className="w-36 h-36 object-contain drop-shadow-2xl animate-heroTilt"
    />

    <div className="absolute top-4 right-6 text-yellow-300 text-xl animate-ping">
      ✦
    </div>
  </div>
</div>

    {/* Brand text */}
    <div className="text-center space-y-1.5">
      <p className="text-base font-bold text-primary tracking-wide">CRM 360</p>
      <p className="text-xs text-txt-secondary font-medium tracking-widest uppercase">
        Powering up your dashboard
      </p>
    </div>

    {/* Progress dots */}
    <div className="flex gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_0ms]"></span>
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_150ms]"></span>
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_300ms]"></span>
    </div>
  </div>
</div>
    );
  }

  return <ShellLayout>{children}</ShellLayout>;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <AuthGuard>{children}</AuthGuard>
    </CRMProvider>
  );
}
