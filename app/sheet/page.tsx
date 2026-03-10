'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, ArrowRight } from 'lucide-react';
import { page } from '@/lib/tokens';
import Link from 'next/link';

interface Video {
  completed: boolean;
}

interface Playlist {
  _id: string;
  name: string;
  youtubeUrl: string;
  totalDuration: number;
  videos: Video[];
  createdAt?: string;
  updatedAt?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function isValidYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(url.trim());
}

const SheetRow = memo(function SheetRow({ playlist }: { playlist: Playlist }) {
  const totalVideos = playlist.videos?.length || 0;
  const completedVideos = playlist.videos?.filter((v) => v.completed).length || 0;
  const hours = Math.floor((playlist.totalDuration || 0) / 3600);
  const minutes = Math.floor(((playlist.totalDuration || 0) % 3600) / 60);

  return (
    <Link
      href={`/sheet/${playlist._id}`}
      className="group flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-all duration-200"
    >
      <div className="flex items-center gap-4 overflow-hidden flex-1 min-w-0">
        <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-base truncate text-foreground">
            {playlist.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {totalVideos} videos
            {playlist.totalDuration > 0 && ` · ${hours}h ${minutes}m`}
            {totalVideos > 0 && ` · ${completedVideos}/${totalVideos} done`}
          </span>
        </div>
      </div>
    </Link>
  );
});

export default function SheetListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  const isGuest = status === 'unauthenticated';

  const [showNewSheet, setShowNewSheet] = useState(false);
  const [url, setUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // SWR fetch for authenticated users
  const {
    data: apiPlaylists,
    isLoading: apiLoading,
    mutate,
  } = useSWR<Playlist[]>(isAuthenticated ? '/api/playlists' : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  // Local storage for guests
  const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setLocalLoading(true);
      try {
        const stored = localStorage.getItem('playlists');
        setLocalPlaylists(stored ? JSON.parse(stored) : []);
      } catch {
        setLocalPlaylists([]);
      } finally {
        setLocalLoading(false);
      }
    }
  }, [isGuest]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('playlists');
      if (stored) setLocalPlaylists(JSON.parse(stored));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-playlist-update', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-playlist-update', handleStorageChange);
    };
  }, []);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!isValidYouTubeUrl(url)) {
        setError('Please enter a valid YouTube URL.');
        return;
      }

      setIsCreating(true);
      try {
        // Fetch playlist data
        const res = await fetch('/api/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistUrl: url }),
        });

        if (!res.ok) {
          const ct = res.headers.get('content-type');
          if (ct && ct.includes('application/json')) {
            const d = await res.json();
            throw new Error(d.error || d.message || 'Failed to fetch playlist');
          }
          throw new Error(`Server error: ${res.status}`);
        }

        const responseData = await res.json();
        if (!responseData.success) {
          throw new Error(responseData.error || 'Failed to fetch playlist');
        }

        const playlistData = {
          name: responseData.data.title,
          youtubeUrl: url,
          totalDuration: responseData.data.totalDuration,
          videos: responseData.data.videos,
        };

        if (isAuthenticated) {
          const saveRes = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(playlistData),
          });

          if (!saveRes.ok) {
            const d = await saveRes.json();
            throw new Error(
              d.message || (saveRes.status === 409 ? 'Playlist already exists' : 'Failed to save')
            );
          }

          const saved = await saveRes.json();
          mutate(); // refresh list
          setShowNewSheet(false);
          setUrl('');
          router.push(`/sheet/${saved._id}`);
        } else {
          // Guest - save locally
          const generatedId = Math.random().toString(36).substr(2, 9);
          const existing = localStorage.getItem('playlists');
          const playlists = existing ? JSON.parse(existing) : [];

          if (playlists.some((p: Playlist) => p.youtubeUrl === url)) {
            throw new Error('This playlist is already in your library.');
          }

          const newPlaylist = {
            ...playlistData,
            _id: generatedId,
            createdAt: new Date().toISOString(),
            videos: playlistData.videos.map((v: any, i: number) => ({
              ...v,
              _id: `v_${generatedId}_${i}`,
              completed: false,
              notes: '',
            })),
          };

          const updated = [newPlaylist, ...playlists];
          localStorage.setItem('playlists', JSON.stringify(updated));
          localStorage.setItem(`playlist_${generatedId}`, JSON.stringify(newPlaylist));
          window.dispatchEvent(new Event('local-playlist-update'));

          setShowNewSheet(false);
          setUrl('');
          router.push(`/sheet/${generatedId}`);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsCreating(false);
      }
    },
    [url, isAuthenticated, mutate, router]
  );

  const playlists = isAuthenticated ? apiPlaylists : localPlaylists;
  const isLoading =
    status === 'loading' || (isAuthenticated ? apiLoading : isGuest ? localLoading : false);

  return (
    <AppLayout>
      <div className={page.container}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={page.title}>Sheets</h1>
          <Button onClick={() => setShowNewSheet(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New sheet
          </Button>
        </div>

        {/* Sheet list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] w-full rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : !playlists || playlists.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No sheets yet</p>
            <p className="text-sm">
              Click &quot;New sheet&quot; to add a YouTube playlist.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {playlists.map((p: Playlist) => (
              <SheetRow key={p._id} playlist={p} />
            ))}
          </div>
        )}
      </div>

      {/* New Sheet Modal */}
      <Dialog open={showNewSheet} onOpenChange={setShowNewSheet}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle>New sheet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Paste YouTube playlist or video URL…"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                required
              />
              {error && (
                <p className="text-sm text-destructive mt-2 bg-destructive/10 p-2 rounded">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowNewSheet(false);
                  setError('');
                  setUrl('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
