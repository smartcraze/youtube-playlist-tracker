import { connectDB } from '@/lib/mongodb';
import { Playlist, User } from '@/models';
import { auth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { completed, notes } = await req.json();

    const playlist = await Playlist.findOneAndUpdate(
      {
        userId: user._id,
        'videos._id': id,
      },
      {
        $set: {
          ...(completed !== undefined && { 'videos.$.completed': completed }),
          ...(notes !== undefined && { 'videos.$.notes': notes }),
        },
      },
      { new: true }
    );

    if (!playlist) {
      return NextResponse.json(
        { message: 'Video or playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
