'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { MessageSquare, ExternalLink } from 'lucide-react';

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

interface VideoItemProps {
  video: Video;
  onToggleComplete: (videoId: string, completed: boolean) => void;
  onUpdateNotes: (videoId: string, notes: string) => void;
}

export function VideoItem({ video, onToggleComplete, onUpdateNotes }: VideoItemProps) {
  const [notes, setNotes] = useState(video.notes || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveNotes = () => {
    onUpdateNotes(video._id, notes);
    setIsOpen(false);
  };

  const durationInMinutes = video.duration;
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border border-border transition-colors ${
        video.completed ? 'bg-accent/10 border-accent/30' : 'hover:bg-accent/5'
      }`}
    >
      <Checkbox
        checked={video.completed}
        onCheckedChange={(checked) => onToggleComplete(video._id, checked as boolean)}
        className="mt-1"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3
              className={`text-sm font-medium transition-all ${
                video.completed ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}
            >
              {video.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {durationText}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Add notes"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Video Notes</DialogTitle>
                  <DialogDescription>
                    {video.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Textarea
                    placeholder="Add your notes about this video..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-50"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNotes}>
                    Save Notes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent/10"
              title="Watch on YouTube"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {video.notes && !isOpen && (
          <p className="text-xs text-muted-foreground mt-2 p-2 bg-accent/5 rounded border border-accent/20">
            {video.notes.substring(0, 100)}
            {video.notes.length > 100 ? '...' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
