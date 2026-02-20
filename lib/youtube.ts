import axios from 'axios';

interface Video {
  videoId: string;
  title: string;
  url: string;
  duration: number; // in seconds
  thumbnail: string;
  completed: boolean;
  notes: string;
  position: number;
}

interface PlaylistFetchResult {
  error: string;
  success: any;
  videos: Video[];
  playlistId: string;
  totalDuration: number;
  title?: string;
  thumbnail?: string;
}

function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get('list');
  } catch {
    return null;
  }
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  return h * 3600 + m * 60 + s;
}

export async function fetchYouTubePlaylistVideos(
  playlistUrl: string
): Promise<PlaylistFetchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('YouTube API key not configured, using fallback method');
    return fetchPlaylistFallback(playlistUrl);
  }

  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error('Invalid playlist URL');
  }

  try {
    // Fetch playlist details
    const plRes = await axios.get(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
    );

    if (!plRes.data.items?.length) {
      throw new Error('Playlist not found');
    }

    const playlist = plRes.data.items[0].snippet;
    const playlistTitle = playlist.title;
    const thumbnail =
      playlist.thumbnails?.medium?.url ||
      playlist.thumbnails?.default?.url ||
      '';

    // Fetch all playlist items (paginated)
    const videos: Array<{
      title: string;
      videoId: string;
      position: number;
    }> = [];
    let nextPageToken = '';

    do {
      const itemsRes = await axios.get(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&pageToken=${nextPageToken}&key=${apiKey}`
      );

      for (const item of itemsRes.data.items || []) {
        videos.push({
          title: item.snippet.title,
          videoId: item.snippet.resourceId.videoId,
          position: item.snippet.position,
        });
      }

      nextPageToken = itemsRes.data.nextPageToken || '';
    } while (nextPageToken);

    // Fetch durations in batches of 50
    const durations: Record<string, number> = {};
    for (let i = 0; i < videos.length; i += 50) {
      const batch = videos.slice(i, i + 50);
      const ids = batch.map((v) => v.videoId).join(',');
      const durRes = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${apiKey}`
      );

      for (const item of durRes.data.items || []) {
        durations[item.id] = parseDuration(item.contentDetails.duration);
      }
    }

    // Build final video list
    const finalVideos: Video[] = videos.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      duration: durations[v.videoId] || 0,
      thumbnail: `https://img.youtube.com/vi/${v.videoId}/default.jpg`,
      completed: false,
      notes: '',
      position: v.position,
    }));

    const totalDuration = finalVideos.reduce((sum, v) => sum + v.duration, 0);

    return {
      videos: finalVideos,
      playlistId,
      totalDuration,
      title: playlistTitle,
      thumbnail,
      success: true,
    } as PlaylistFetchResult;
  } catch (error) {
    console.error('Error fetching YouTube playlist:', error);
    throw error;
  }
}

async function fetchPlaylistFallback(playlistUrl: string): Promise<PlaylistFetchResult> {
  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error('Invalid playlist URL');
  }

  // Return empty/mock data for fallback
  return {
    videos: [],
    playlistId,
    totalDuration: 0,
    success: false,
    error: 'YouTube API key not configured',
  };
}

