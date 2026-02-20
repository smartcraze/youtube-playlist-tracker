import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    image: String,
    googleId: String,
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
  },
  { timestamps: true }
);

const videoSchema = new mongoose.Schema(
  {
    videoId: String,
    title: String,
    url: String,
    duration: Number, // in minutes
    thumbnail: String,
    completed: {
      type: Boolean,
      default: false,
    },
    notes: String,
    position: Number, // order in playlist
  },
  { timestamps: true }
);

const playlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: String,
    description: String,
    youtubePlaylistId: String,
    youtubeUrl: String,
    videos: [videoSchema],
    totalDuration: Number, // in minutes
    notes: String,
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);
export const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);
