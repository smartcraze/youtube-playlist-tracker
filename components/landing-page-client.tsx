'use client';

import { useSession } from 'next-auth/react';
import { Header } from '@/components/header';
import { AddPlaylistForm } from '@/components/add-playlist-form';
import { LandingPlaylistGrid } from '@/components/landing-playlist-grid';
import { useSavePrompt } from '@/lib/use-save-prompt';

interface LandingPageClientProps {
  initialPlaylists?: any[];
}

export function LandingPageClient({ initialPlaylists = [] }: LandingPageClientProps) {
  const { SavePromptDialog } = useSavePrompt();

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground relative overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col items-center p-4 pt-16 md:pt-24 space-y-16">
        
        {/* Helper Badge */}
        <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Distraction-free learning
        </div>

        {/* Hero Section */}
        <div className="w-full max-w-4xl text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent pb-2">
            Master YouTube <span className="text-primary">Playlists</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Track your progress, take notes, and finish your courses without getting distracted.
          </p>

          <div className="w-full max-w-xl mx-auto pt-8">
            <div className="p-1.5 bg-card border border-border rounded-xl shadow-lg ring ring-primary/5 hover:ring-primary/10 transition-all duration-300">
                <AddPlaylistForm variant="inline" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
                Paste any YouTube playlist URL to get started instantly. No account required.
            </p>
          </div>
        </div>

        {/* Playlist Grid Section */}
        <div className="w-full pb-20">
             <LandingPlaylistGrid initialPlaylists={initialPlaylists} />
        </div>

      </main>
      
      <SavePromptDialog />
    </div>
  );
}
