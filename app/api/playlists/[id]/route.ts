import { connectDB } from '@/lib/mongodb';
import { Playlist, User } from '@/models';
import { auth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
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

    const playlist = await Playlist.findOne({ _id: id, userId: user._id });
    if (!playlist) {
      return NextResponse.json({ message: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const playlist = await Playlist.findOneAndDelete({
      _id: id,
      userId: user._id,
    });

    if (!playlist) {
      return NextResponse.json({ message: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { name, description, youtubeUrl } = await req.json();

    const playlist = await Playlist.findOneAndUpdate(
      { _id: id, userId: user._id },
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(youtubeUrl && { youtubeUrl }),
      },
      { new: true }
    );

    if (!playlist) {
      return NextResponse.json({ message: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
