'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { PlayCircle, Clock, Trash2, ArrowRight, ExternalLink, MoreVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Video {
  completed: boolean;
}

interface Playlist {
  _id: string;
  name: string;
  youtubeUrl: string;
  totalDuration: number;
  videos: Video[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LandingPlaylistGridProps {
  initialPlaylists?: any[]; 
}

export function LandingPlaylistGrid({ initialPlaylists = [] }: LandingPlaylistGridProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isGuest = status === 'unauthenticated';

  const { data: apiPlaylists, isLoading: apiLoading, mutate } = useSWR(
     isAuthenticated ? '/api/playlists' : null,
     fetcher,
     {
         fallbackData: initialPlaylists,
         revalidateOnMount: false,
         revalidateOnFocus: true
     }
  );

  const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  // Load from LocalStorage for Guests
  useEffect(() => {
    if (isGuest) {
      setLocalLoading(true);
      try {
        const stored = localStorage.getItem('playlists');
        if (stored) {
          setLocalPlaylists(JSON.parse(stored));
        } else {
            setLocalPlaylists([]);
        }
      } catch (e) {
        console.error("Local storage error", e);
      } finally {
        setLocalLoading(false);
      }
    }
  }, [isGuest]);

  // Listen for storage changes
  useEffect(() => {
      const handleStorageChange = () => {
          const stored = localStorage.getItem('playlists');
          if (stored) {
              setLocalPlaylists(JSON.parse(stored));
          }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('local-playlist-update', handleStorageChange);
      
      return () => {
          window.removeEventListener('storage', handleStorageChange);
          window.removeEventListener('local-playlist-update', handleStorageChange);
      };
  }, []);

  const removeLocalPlaylist = (id: string) => {
      const updated = localPlaylists.filter((p: any) => p._id !== id);
      setLocalPlaylists(updated);
      localStorage.setItem('playlists', JSON.stringify(updated));
      localStorage.removeItem(`playlist_${id}`);
      window.dispatchEvent(new Event('local-playlist-update'));
  };
  
  const removeApiPlaylist = async (id: string) => {
      try {
          // Optimistic UI update
          mutate(
              (current: any) => current?.filter((p: any) => p._id !== id), 
              false
          );
          
          await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
          mutate(); // Revalidate
      } catch (e) {
          console.error("Failed to delete playlist", e);
      }
  };

  const playlists = isAuthenticated ? apiPlaylists : localPlaylists;
  const isLoading = isAuthenticated ? apiLoading : (isGuest ? localLoading : false);
  
  if (status === 'loading' || isLoading) {
      return (
          <div className="w-full max-w-4xl mx-auto pt-8 px-4 space-y-4">
              {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 w-full rounded-md bg-muted/50 animate-pulse" />
              ))}
          </div>
      );
  }

  if (!playlists || playlists.length === 0) {
      return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto pt-10 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 px-1">
            <PlayCircle className="w-4 h-4" />
            Your Library ({playlists.length})
        </h2>
        
        <div className="flex flex-col gap-3">
            {playlists.map((playlist: Playlist) => {
                const totalVideos = playlist.videos?.length || 0;
                const completedVideos = playlist.videos?.filter(v => v.completed).length || 0;
                const progress = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
                
                const hours = Math.floor(playlist.totalDuration / 3600);
                const minutes = Math.floor((playlist.totalDuration % 3600) / 60);

                return (
                <div 
                    key={playlist._id} 
                    className="group relative flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm transition-all duration-200"
                >
                   {/* Left Link Wrapper - Entire Row is NOT clickable to allow separate actions, 
                       but we make the visual appearance cohesive */}
                   <div className="flex items-center gap-4 overflow-hidden flex-1 min-w-0 pr-4">
                       
                       {/* Explicit Icon link to internal details */}
                       <Link 
                            href={`/playlist/${playlist._id}`} 
                            className="shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                           <ArrowRight className="w-5 h-5" />
                       </Link>
                       
                       <div className="flex flex-col justify-center gap-0.5 min-w-0">
                           {/* Main Title links to YouTube (User Request: "on click on text should take to youtube") */}
                           <a 
                                href={playlist.youtubeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-semibold text-base truncate flex items-center gap-2 hover:text-primary transition-colors w-fit group/title"
                                title="Open on YouTube"
                           >
                                {playlist.name}
                                <ExternalLink className="h-3 w-3 opacity-0 -translate-x-1 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all text-muted-foreground" />
                           </a>
                           
                           {/* Description / Metadata */}
                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{totalVideos} videos</span>
                                {playlist.totalDuration > 0 && (
                                    <>
                                        <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                                        <span>{hours}h {minutes}m</span>
                                    </>
                                )}
                           </div>
                       </div>
                   </div>

                   {/* Right Section: Progress + Actions */}
                   <div className="flex items-center gap-4 shrink-0">
                        {/* Progress */}
                        <div className="hidden sm:flex flex-col w-[120px] md:w-[160px] gap-1.5 items-end">
                            <span className="text-xs text-muted-foreground font-mono">
                                {completedVideos}/{totalVideos}
                            </span>
                            <Progress value={progress} className="h-1.5 w-full bg-secondary" />
                        </div>
                        
                        {/* Mobile Progress (Compact) */}
                        <div className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full border-2 border-muted relative">
                             <span className="text-[10px] font-bold">{Math.round(progress)}%</span>
                        </div>

                        {/* Dropdown Options */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/playlist/${playlist._id}`} className="flex items-center cursor-pointer">
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        <span>Open in App</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                     <a href={playlist.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        <span>Open on YouTube</span>
                                     </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => isAuthenticated ? removeApiPlaylist(playlist._id) : removeLocalPlaylist(playlist._id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Remove Playlist</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                   </div>
                </div>
            )})}
        </div>
    </div>
  );
}
