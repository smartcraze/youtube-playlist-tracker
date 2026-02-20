import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User, Playlist } from '@/models';
import { LandingPageClient } from '@/components/landing-page-client';

async function getPlaylists(email: string) {
  try {
    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return [];
    
    const playlists = await Playlist.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();
      
    // Serialize for Next.js (mongoose usually returns objects with methods or non-serializable _id if not lean + transformed)
    return JSON.parse(JSON.stringify(playlists));
  } catch (e) {
    console.error("Failed to fetch playlists:", e);
    return [];
  }
}

export default async function LandingPage() {
  const session = await auth();
  let initialPlaylists: any[] = [];

  if (session?.user?.email) {
    initialPlaylists = await getPlaylists(session.user.email);
  }

  return (
    <LandingPageClient initialPlaylists={initialPlaylists} />
  );
}
