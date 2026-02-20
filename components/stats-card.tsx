'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CircularProgress } from '@/components/ui/circular-progress';
import { PlayCircle, Clock, CheckCircle2, ListMusic } from 'lucide-react';

interface PlaylistStatsProps {
  totalPlaylists: number;
  totalVideos: number;
  completedVideos: number;
  totalDuration: number; // in seconds
  completionPercentage: number;
}

export function PlaylistStats({
  totalPlaylists,
  totalVideos,
  completedVideos,
  totalDuration,
  completionPercentage,
}: PlaylistStatsProps) {
  const totalDurationHours = Math.floor(totalDuration / 3600);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Lists</CardTitle>
          <ListMusic className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPlaylists}</div>
          <p className="text-xs text-muted-foreground">
            Active playlists being tracked
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-4">
             <div className="text-2xl font-bold">{completedVideos}/{totalVideos}</div>
           </div>
           <p className="text-xs text-muted-foreground">
             Videos completed across all lists
           </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDurationHours}h</div>
          <p className="text-xs text-muted-foreground">
            Total content duration available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion</CardTitle>
          <PlayCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center gap-4">
           <div className="text-2xl font-bold">{completionPercentage}%</div>
           <CircularProgress value={completionPercentage} size={40} strokeWidth={4} />
        </CardContent>
      </Card>
    </div>
  );
}

interface CompletionProgressProps {
  completed: number;
  total: number;
}

export function CompletionProgress({ completed, total }: CompletionProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Overall Completion</span>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
