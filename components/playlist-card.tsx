'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';
import { MoreVertical, ExternalLink, PlayCircle, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  description?: string;
  youtubeUrl: string;
  youtubePlaylistId: string;
  videos: Video[];
  totalDuration: number;
}

interface PlaylistCardProps {
  playlist: Playlist;
  onToggleComplete?: (videoId: string, completed: boolean) => void;
  onUpdateNotes?: (videoId: string, notes: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onEditPlaylist?: (playlist: Playlist) => void;
}

export function PlaylistCard({
  playlist,
  onDeletePlaylist,
  onEditPlaylist,
}: PlaylistCardProps) {
  const completedCount = playlist.videos.filter((v) => v.completed).length;
  const completionPercentage = 
    playlist.videos.length > 0 ? (completedCount / playlist.videos.length) * 100 : 0;

  const totalDurationHours = Math.floor(playlist.totalDuration / 3600);
  const totalDurationMinutes = Math.floor((playlist.totalDuration % 3600) / 60);

  return (
    <Card className="group relative overflow-hidden text-card-foreground shadow-sm hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm dark:bg-card/20">
      <Link href={`/playlist/${playlist._id}`} className="block w-full h-full p-6">
        <div className="flex items-start gap-5">
          <div className="shrink-0 relative">
            <CircularProgress 
              value={completionPercentage} 
              size={64} 
              strokeWidth={6} 
              className={completionPercentage === 100 ? "text-green-500" : "text-primary"}
            />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight truncate pr-6 group-hover:text-primary transition-colors">
                {playlist.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {playlist.description || "No description"}
              </p>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-full text-secondary-foreground font-medium">
                <PlayCircle className="w-3.5 h-3.5" />
                {playlist.videos.length} videos
              </span>
              <span>•</span>
              <span className="font-medium">{totalDurationHours}h {totalDurationMinutes}m</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80 rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a 
                href={playlist.youtubeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in YouTube
              </a>
            </DropdownMenuItem>
            {onEditPlaylist && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPlaylist(playlist);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePlaylist(playlist._id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
