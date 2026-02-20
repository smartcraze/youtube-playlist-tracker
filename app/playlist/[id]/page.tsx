'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { useSavePrompt } from '@/lib/use-save-prompt';
import { Loader2, ExternalLink, MessageSquare, CheckCircle2, ChevronLeft, PlayCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CircularProgress } from '@/components/ui/circular-progress';
import Link from 'next/link';

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

export default function PlaylistPage() {
  const params = useParams();
  const playlistId = params.id as string;
  const { data: session } = useSession();
  const { isAuthenticated, showPrompt, SavePromptDialog } = useSavePrompt();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const loadPlaylist = async () => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(`playlist_${playlistId}`);
      if (stored) {
        setPlaylist(JSON.parse(stored));
        return;
      }

      const response = await fetch(`/api/playlists/${playlistId}`);
      if (response.ok) {
        const data = await response.json();
        setPlaylist(data);
      } else {
         setPlaylist(null);
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
      setPlaylist(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVideoComplete = (videoId: string) => {
    if (!playlist) return;

    const updated = {
      ...playlist,
      videos: playlist.videos.map((v) =>
        v._id === videoId ? { ...v, completed: !v.completed } : v
      ),
    };
    setPlaylist(updated);
    localStorage.setItem(`playlist_${playlistId}`, JSON.stringify(updated));

    if (session?.user?.email) {
      saveVideoUpdate(videoId, !playlist.videos.find((v) => v._id === videoId)?.completed);
    } else {
      // For guest, we just save to local storage (already done above)
    }
  };

  const saveVideoUpdate = async (videoId: string, completed: boolean) => {
    try {
      await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
    } catch (error) {
      console.error('Error saving video update:', error);
    }
  };

  const openNotesDialog = (videoId: string) => {
    const video = playlist?.videos.find((v) => v._id === videoId);
    if (video) {
      setEditingNotes(videoId);
      setNotesText(video.notes || '');
      setShowNotesDialog(true);
    }
  };

  const saveNotes = () => {
    if (!playlist || !editingNotes) return;

    const updated = {
      ...playlist,
      videos: playlist.videos.map((v) =>
        v._id === editingNotes ? { ...v, notes: notesText } : v
      ),
    };
    setPlaylist(updated);
    localStorage.setItem(`playlist_${playlistId}`, JSON.stringify(updated));

    if (session?.user?.email) {
      saveVideoNotes(editingNotes, notesText);
    } 
    // Guest notes saved locally

    setShowNotesDialog(false);
  };

  const saveVideoNotes = async (videoId: string, notes: string) => {
    try {
      await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1">
            <p className="text-muted-foreground mb-4">Playlist not found</p>
            <Link href="/">
                <Button>Go Home</Button>
            </Link>
        </div>
      </div>
    );
  }

  const completedCount = playlist.videos.filter((v) => v.completed).length;
  // Prevent division by zero if empty playlist
  const totalVideos = playlist.videos.length;
  const completionPercentage = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
  const remainingVideos = totalVideos - completedCount;
  
  // Calculate remaining time
  const remainingSeconds = playlist.videos
    .filter(v => !v.completed)
    .reduce((acc, v) => acc + v.duration, 0);
  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="bg-muted/30 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-8">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Library
              </Link>
              
              <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                  <div className="space-y-4 flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{playlist.name}</h1>
                       <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                              <PlayCircle className="w-4 h-4" />
                              {playlist.videos.length} videos
                          </span>
                          <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {Math.floor(playlist.totalDuration / 3600)}h {Math.floor((playlist.totalDuration % 3600) / 60)}m
                          </span>
                       </div>
                       <a 
                          href={playlist.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                        >
                        Open on YouTube <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                  </div>

                  {/* Stats Card */}
                  <div className="w-full md:w-auto bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-6 shrink-0">
                      <div className="relative">
                           <CircularProgress 
                                value={completionPercentage} 
                                size={80} 
                                strokeWidth={8} 
                                color={completionPercentage === 100 ? "text-accent" : "text-primary"}
                            />
                      </div>
                      <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Progress</div>
                          <div className="text-2xl font-bold">{completionPercentage}%</div>
                          <div className="text-xs text-muted-foreground">
                              {remainingVideos} videos left ({remainingHours}h {remainingMinutes}m)
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-3">
          {playlist.videos.map((video, index) => (
            <div 
                key={video._id} 
                className={`group flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all ${video.completed ? 'opacity-70' : ''}`}
            >
                <div className="mt-1 shrink-0">
                  <button
                    onClick={() => toggleVideoComplete(video._id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      video.completed
                        ? 'bg-accent border-accent text-accent-foreground'
                        : 'border-muted-foreground/30 hover:border-primary text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-medium text-base hover:text-primary transition-colors line-clamp-2 ${
                          video.completed ? 'text-muted-foreground line-through decoration-border' : 'text-foreground'
                        }`}
                      >
                        {video.title}
                      </a>
                      <span className="text-xs font-mono text-muted-foreground shrink-0 border border-border px-1.5 py-0.5 rounded">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </span>
                  </div>
                  
                  {/* Notes Preview */}
                    {video.notes && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border border-border/50 mt-2 line-clamp-2">
                            {video.notes}
                        </div>
                    )}
                    
                   <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => openNotesDialog(video._id)}
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {video.notes ? 'Edit Notes' : 'Add Note'}
                        </Button>
                   </div>
                </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle>Video Notes</DialogTitle>
            <DialogDescription className="text-muted-foreground">Add personal notes, timestamps, or key takeaways.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Write your notes here..."
            className="resize-none min-h-[150px] bg-background border-input focus-visible:ring-primary"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNotesDialog(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button onClick={saveNotes} className="bg-primary text-primary-foreground">Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {!isAuthenticated && <SavePromptDialog />}
    </div>
  );
}
