'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Youtube } from 'lucide-react';

interface AddPlaylistFormProps {
  onPlaylistAdded?: () => void;
  variant?: 'default' | 'inline';
}

export function AddPlaylistForm({ onPlaylistAdded, variant = 'default' }: AddPlaylistFormProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { data: session } = useSession();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Fetch playlist data from YouTube via our API
      // Corrected endpoint and body parameter
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl: url }),
      });

      if (!res.ok) {
        // Handle 404 or 500 HTML responses gracefully
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await res.json();
            throw new Error(errorData.error || errorData.message || 'Failed to fetch playlist');
        } else {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      }

      const responseData = await res.json();
      
      if (!responseData.success) {
          throw new Error(responseData.error || 'Failed to fetch playlist');
      }

      const playlistData = {
          name: responseData.data.title,
          youtubeUrl: url,
          totalDuration: responseData.data.totalDuration,
          videos: responseData.data.videos
      };

      const generatedId = Math.random().toString(36).substr(2, 9);

      if (session?.user?.email) {
        // 2a. Save to database for authenticated users
        const saveRes = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(playlistData),
        });

        if (!saveRes.ok) {
            const errorData = await saveRes.json();
            if (saveRes.status === 409) {
                 throw new Error(errorData.message || "Playlist already exists");
            }
            throw new Error(errorData.message || 'Failed to save playlist');
        }
        
        const savedPlaylist = await saveRes.json();
        router.push(`/playlist/${savedPlaylist._id}`);
      } else {
        // 2b. Save to localStorage for guests
        const existing = localStorage.getItem('playlists');
        const playlists = existing ? JSON.parse(existing) : [];
        
        const isDuplicate = playlists.some((p: any) => p.youtubeUrl === playlistData.youtubeUrl);
        if (isDuplicate) {
            throw new Error("This playlist is already in your library.");
        }

        const newPlaylist = {
          ...playlistData,
          _id: generatedId, 
          createdAt: new Date().toISOString(),
          videos: playlistData.videos.map((v: any, index: number) => ({
             ...v,
             _id: `v_${generatedId}_${index}`, 
             completed: false,
             notes: ''
          }))
        };

        const updatedPlaylists = [newPlaylist, ...playlists];
        localStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
        localStorage.setItem(`playlist_${newPlaylist._id}`, JSON.stringify(newPlaylist));
        
        window.dispatchEvent(new Event('local-playlist-update'));
        
        router.push(`/playlist/${newPlaylist._id}`);
      }

      setUrl('');
      if (onPlaylistAdded) onPlaylistAdded();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isInline = variant === 'inline';

  return (
    <form onSubmit={handleSubmit} className={isInline ? "w-full space-y-2" : "space-y-4"}>
      <div className={isInline ? "flex flex-col sm:flex-row w-full items-center gap-2" : "space-y-4"}>
        <div className="relative flex-1 w-full">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Paste YouTube Playlist URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={isInline ? "pl-9 h-10 bg-background border-input text-sm w-full rounded-md" : "pl-9 w-full rounded-md"}
              required
            />
        </div>
        <Button 
            type="submit" 
            disabled={isLoading} 
            size={isInline ? "default" : "default"}
            className={isInline ? "h-10 w-full sm:w-auto px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-md" : "w-full rounded-md"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            isInline ? "Start Learning" : "Add Playlist"
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive mt-2 text-center bg-destructive/10 p-2 rounded animate-in fade-in slide-in-from-top-1">{error}</p>}
    </form>
  );
}
