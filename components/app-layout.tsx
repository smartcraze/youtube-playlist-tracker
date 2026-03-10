'use client';

import { Header } from '@/components/header';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

/** Default layout with topbar – used for non-focus pages like /sheet */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
