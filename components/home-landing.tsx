'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Library } from 'lucide-react';

/** Minimal landing page shown to unauthenticated users */
export function HomeLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Library className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Playlist Tracker</h1>
          <p className="text-muted-foreground">
            Track your YouTube playlists, take notes, and finish your courses without distractions.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => signIn('google', { callbackUrl: '/sheet' })}
          className="w-full max-w-xs mx-auto"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
