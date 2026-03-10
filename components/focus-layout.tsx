'use client';

import { ReactNode } from 'react';

interface FocusLayoutProps {
  children: ReactNode;
}

/** Distraction-free layout – no topbar. Used for /sheet/[sheetId] */
export function FocusLayout({ children }: FocusLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
