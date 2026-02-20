import { connectDB } from '@/lib/mongodb';
import { Playlist, User } from '@/models';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json([]); // Return empty for guest, client handles local
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json([]);
    }

    // Lean query for faster execution
    const playlists = await Playlist.find({ userId: user._id })
      .select('name totalDuration videos')
      .lean();

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, youtubeUrl, videos, totalDuration } = await req.json();

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check for duplicate playlist by URL for this user
    const existing = await Playlist.findOne({ userId: user._id, youtubeUrl });
    if (existing) {
       return NextResponse.json(
          { message: 'Playlist already exists in your library.' }, 
          { status: 409 }
       );
    }

    const newPlaylist = await Playlist.create({
      userId: user._id,
      name,
      youtubeUrl,
      videos,
      totalDuration,
    });

    return NextResponse.json(newPlaylist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
