import { NextResponse } from 'next/server';
import { fetchYouTubePlaylistVideos } from '@/lib/youtube';

export async function POST(req: Request) {
  try {
    const { playlistUrl } = await req.json();

    if (!playlistUrl) {
      return NextResponse.json(
        { success: false, error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    const result = await fetchYouTubePlaylistVideos(playlistUrl);

    if (!result.success || !result.videos) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch playlist' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        title: result.title || 'Untitled Playlist',
        videos: result.videos,
        totalDuration: result.totalDuration,
        playlistId: result.playlistId,
        thumbnail: result.thumbnail || '',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
