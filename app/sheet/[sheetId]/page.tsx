'use client';

import { useEffect, useState, useCallback, useRef, memo } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { FocusLayout } from '@/components/focus-layout';
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  ChevronLeft,
  PlayCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';
import Link from 'next/link';
import { page } from '@/lib/tokens';

interface Video {
  _id: string;
  videoId: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  completed: boolean;
  notes: string;
  position: number;
}

interface Playlist {
  _id: string;
  name: string;
  youtubeUrl: string;
  videos: Video[];
  totalDuration: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Inline notes editor with debounced autosave */
const InlineNotes = memo(function InlineNotes({
  videoId,
  initialNotes,
  onSave,
}: {
  videoId: string;
  initialNotes: string;
  onSave: (videoId: string, notes: string) => Promise<boolean>;
}) {
  const [text, setText] = useState(initialNotes);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevInitial = useRef(initialNotes);

  // Sync if parent data reloads with different notes
  useEffect(() => {
    if (prevInitial.current !== initialNotes) {
      prevInitial.current = initialNotes;
      setText(initialNotes);
    }
  }, [initialNotes]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setText(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      setStatus('idle');
      debounceRef.current = setTimeout(async () => {
        setStatus('saving');
        const ok = await onSave(videoId, val);
        setStatus(ok ? 'saved' : 'error');
        if (ok) {
          setTimeout(() => setStatus('idle'), 1500);
        }
      }, 600);
    },
    [videoId, onSave]
  );

  const handleRetry = useCallback(async () => {
    setStatus('saving');
    const ok = await onSave(videoId, text);
    setStatus(ok ? 'saved' : 'error');
    if (ok) {
      setTimeout(() => setStatus('idle'), 1500);
    }
  }, [videoId, text, onSave]);

  return (
    <div className="mt-2 w-full">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Add a note…"
        rows={1}
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
        onFocus={(e) => {
          // Auto-expand on focus
          e.target.rows = 3;
        }}
        onBlur={(e) => {
          // Collapse if empty
          if (!e.target.value.trim()) {
            e.target.rows = 1;
          }
        }}
      />
      <div className="h-5 mt-1">
        {status === 'saving' && (
          <span className="text-xs text-muted-foreground">Saving…</span>
        )}
        {status === 'saved' && (
          <span className="text-xs text-green-500">Saved</span>
        )}
        {status === 'error' && (
          <span className="text-xs text-destructive">
            Save failed{' '}
            <button
              type="button"
              onClick={handleRetry}
              className="underline hover:no-underline"
            >
              Retry
            </button>
          </span>
        )}
      </div>
    </div>
  );
});

/** Memoized video row */
const VideoRow = memo(function VideoRow({
  video,
  onToggleComplete,
  onSaveNotes,
}: {
  video: Video;
  onToggleComplete: (videoId: string) => void;
  onSaveNotes: (videoId: string, notes: string) => Promise<boolean>;
}) {
  return (
    <div
      className={`group flex flex-col p-4 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-muted/40 transition-all duration-200 ${
        video.completed ? 'opacity-60 bg-muted/20' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(video._id)}
          className={`mt-1 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 active:scale-95 ${
            video.completed
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground/30 hover:border-primary text-transparent hover:bg-primary/5'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-semibold text-base leading-snug hover:text-primary transition-colors line-clamp-2 w-fit group/link ${
                  video.completed
                    ? 'text-muted-foreground line-through decoration-border'
                    : 'text-foreground'
                }`}
              >
                {video.title}
                <ExternalLink className="inline-block w-3.5 h-3.5 ml-2 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-muted-foreground" />
              </a>
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 w-fit">
                {Math.floor(video.duration / 60)}:
                {(video.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Inline notes */}
          <InlineNotes
            videoId={video._id}
            initialNotes={video.notes || ''}
            onSave={onSaveNotes}
          />
        </div>
      </div>
    </div>
  );
});

export default function SheetDetailPage() {
  const params = useParams();
  const sheetId = params.sheetId as string;
  const { data: session } = useSession();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sheetId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        // Check localStorage first
        const stored = localStorage.getItem(`playlist_${sheetId}`);
        if (stored) {
          if (!cancelled) setPlaylist(JSON.parse(stored));
          if (!cancelled) setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/playlists/${sheetId}`);
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) setPlaylist(data);
        } else {
          if (!cancelled) setPlaylist(null);
        }
      } catch {
        if (!cancelled) setPlaylist(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sheetId]);

  const toggleVideoComplete = useCallback(
    (videoId: string) => {
      setPlaylist((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          videos: prev.videos.map((v) =>
            v._id === videoId ? { ...v, completed: !v.completed } : v
          ),
        };
        localStorage.setItem(`playlist_${sheetId}`, JSON.stringify(updated));

        // Persist to API if authenticated
        if (session?.user?.email) {
          const video = prev.videos.find((v) => v._id === videoId);
          if (video) {
            fetch(`/api/videos/${videoId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: !video.completed }),
            }).catch(console.error);
          }
        }

        return updated;
      });
    },
    [sheetId, session]
  );

  const saveNotes = useCallback(
    async (videoId: string, notes: string): Promise<boolean> => {
      try {
        setPlaylist((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            videos: prev.videos.map((v) =>
              v._id === videoId ? { ...v, notes } : v
            ),
          };
          localStorage.setItem(`playlist_${sheetId}`, JSON.stringify(updated));
          return updated;
        });

        if (session?.user?.email) {
          const res = await fetch(`/api/videos/${videoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
          return res.ok;
        }
        return true;
      } catch {
        return false;
      }
    },
    [sheetId, session]
  );

  if (isLoading) {
    return (
      <FocusLayout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading sheet…</p>
        </div>
      </FocusLayout>
    );
  }

  if (!playlist) {
    return (
      <FocusLayout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-4">Sheet not found</p>
          <Link href="/sheet">
            <Button>Back to sheets</Button>
          </Link>
        </div>
      </FocusLayout>
    );
  }

  const completedCount = playlist.videos.filter((v) => v.completed).length;
  const totalVideos = playlist.videos.length;
  const completionPercentage =
    totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
  const remainingVideos = totalVideos - completedCount;
  const remainingSeconds = playlist.videos
    .filter((v) => !v.completed)
    .reduce((acc, v) => acc + v.duration, 0);
  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);

  return (
    <FocusLayout>
      {/* Header area */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link
            href="/sheet"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to sheets
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            {/* Info */}
            <div className="space-y-4 flex-1 max-w-2xl">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight text-foreground">
                {playlist.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-full border border-border/50">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  {totalVideos} videos
                </span>
                <span className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-full border border-border/50">
                  <Clock className="w-4 h-4 text-primary" />
                  {Math.floor(playlist.totalDuration / 3600)}h{' '}
                  {Math.floor((playlist.totalDuration % 3600) / 60)}m
                </span>
              </div>
              <a
                href={playlist.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all active:scale-95"
              >
                <ExternalLink className="h-4 w-4" />
                Open on YouTube
              </a>
            </div>

            {/* Stats */}
            <div className="w-full md:w-auto bg-card border border-border rounded-lg p-6 flex items-center gap-6 shrink-0">
              <CircularProgress
                value={completionPercentage}
                size={72}
                strokeWidth={7}
                color={
                  completionPercentage === 100 ? 'text-accent' : 'text-primary'
                }
              />
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="text-2xl font-bold">{completionPercentage}%</div>
                <div className="text-xs text-muted-foreground">
                  {remainingVideos} left ({remainingHours}h {remainingMinutes}m)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video list */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-3">
          {playlist.videos.map((video) => (
            <VideoRow
              key={video._id}
              video={video}
              onToggleComplete={toggleVideoComplete}
              onSaveNotes={saveNotes}
            />
          ))}
        </div>
      </div>
    </FocusLayout>
  );
}
