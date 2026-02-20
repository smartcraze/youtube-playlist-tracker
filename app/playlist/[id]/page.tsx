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
                  {/* Playlist Info */}
                  <div className="space-y-6 flex-1 max-w-2xl">
                    <div className="space-y-4">
                      {/* Title & Stats */}
                      <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        {playlist.name}
                      </h1>
                       
                       <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                          <span className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-full border border-border/50">
                              <PlayCircle className="w-4 h-4 text-primary" />
                              {playlist.videos.length} videos
                          </span>
                          <span className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-full border border-border/50">
                              <Clock className="w-4 h-4 text-primary" />
                              {Math.floor(playlist.totalDuration / 3600)}h {Math.floor((playlist.totalDuration % 3600) / 60)}m
                          </span>
                       </div>
                    </div>
                    
                    {/* Primary Actions */}
                    <div className="flex gap-3">
                       <a 
                          href={playlist.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-sm active:scale-95"
                        >
                        <ExternalLink className="h-4 w-4" />
                        Open on YouTube
                      </a>
                    </div>
                  </div>

                  {/* Stats Card */}
                  <div className="w-full md:w-auto bg-card border border-border rounded-xl p-8 shadow-sm flex items-center gap-8 shrink-0 hover:shadow-md transition-shadow">
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
        <div className="flex flex-col gap-3">
          {playlist.videos.map((video, index) => (
            <div 
                key={video._id} 
                className={`group flex items-start sm:items-center gap-4 p-4 rounded-xl border border-border/40 bg-card hover:border-primary/50 hover:bg-muted/40 hover:shadow transition-all duration-200 ${video.completed ? 'opacity-60 bg-muted/20' : ''}`}
            >
                <div className="mt-1 shrink-0">
                  <button
                    onClick={() => toggleVideoComplete(video._id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 active:scale-95 ${
                      video.completed
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30 hover:border-primary text-transparent hover:bg-primary/5'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Left: Content */}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-semibold text-base md:text-lg leading-snug hover:text-primary transition-colors line-clamp-2 w-fit group/link ${
                          video.completed ? 'text-muted-foreground line-through decoration-border' : 'text-foreground'
                        }`}
                      >
                        {video.title}
                        <ExternalLink className="inline-block w-3.5 h-3.5 ml-2 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-muted-foreground" />
                      </a>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/80 font-mono">
                         <span className="bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                         </span>
                         {/* We can add viewed status or other metadata here */}
                      </div>

                       {/* Notes Preview - Click to Edit */}
                       {video.notes && (
                            <div 
                                onClick={() => openNotesDialog(video._id)}
                                className="mt-2 text-sm text-foreground/80 bg-muted/30 p-2.5 rounded-md border-l-2 border-primary/40 cursor-pointer hover:bg-muted/50 hover:border-primary transition-all italic truncate max-w-xl group/note"
                            >
                                <span className="mr-2 not-italic text-primary/70">Note:</span>
                                {video.notes}
                            </div>
                        )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                       <Button
                            variant="ghost"
                            size="sm"
                            className={`h-9 border gap-2 transition-all ${video.notes 
                                ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
                                : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                            }`}
                            onClick={() => openNotesDialog(video._id)}
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="hidden sm:inline">{video.notes ? 'Edit Note' : 'Add Note'}</span>
                        </Button>
                  </div>

                </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Video Notes</DialogTitle>
            <DialogDescription className="text-muted-foreground">Capture your thoughts for this video.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Type your notes here..."
            className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNotesDialog(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button onClick={saveNotes} className="bg-primary text-primary-foreground">Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {!isAuthenticated && <SavePromptDialog />}
    </div>
  );
}
