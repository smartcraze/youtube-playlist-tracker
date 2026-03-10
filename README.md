# YouTube Playlist Tracker

A minimal, clean DSA-sheet-style app to track your YouTube playlists with progress tracking, notes, and stats. Built with Next.js, Shadcn UI, and MongoDB.

**Design Inspiration:** Striver's DSA Sheet + Notion's minimal aesthetic + Linear's clean UI

## Features

- **Public access** - Everyone can view and interact, sign in only to save
- **Instant local feedback** - All UI updates happen immediately
- **Add YouTube playlists** via URL with auto-fetched video details
- **Checklist tracking** with completion marks per video
- **Personal notes** for each video
- **Progress stats** - completion percentage, pending count, total hours remaining
- **Multi-playlist support** with full DB persistence for signed-in users
- **Google authentication** for secure personal tracking
- **Dark/Light theme** with CSS variables
- **Clean minimalist UI** with shadcn components

### How Sign-In Works

- **No sign-in needed to:** View playlists, toggle videos, add notes, see stats
- **Sign-in required to:** Save changes, create playlists, sync across devices
- **Smart prompts:** Only asks for login when you try to save something
- **Local changes:** Visible immediately, only persisted if you sign in

👉 **[Read detailed guide →](./PUBLIC_ACCESS.md)**

## 🛠️ Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **UI Components:** shadcn/ui with Radix UI
- **Styling:** Tailwind CSS with CSS variables
- **Database:** MongoDB + Mongoose
- **Authentication:** NextAuth v5 (Google OAuth)
- **Package Manager:** Bun
- **Forms:** React Hook Form + Zod validation

## 📋 Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **MongoDB** (local or cloud - MongoDB Atlas recommended)
- **Google OAuth credentials** (from Google Cloud Console)

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/youtube-playlist

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# YouTube API (optional, for enhanced video details)
YOUTUBE_API_KEY=your-youtube-api-key
```

#### Setting up MongoDB:

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Then set MONGODB_URI=mongodb://localhost:27017/youtube-playlist
```

**Option B: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/youtube-playlist`

#### Setting up Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

#### Generate NextAuth Secret:

```bash
# Using openssl
openssl rand -base64 32

# Or use this online tool
# https://generate-secret.vercel.app/32
```

### 3. Run Development Server

```bash
# Using Bun
bun dev

# Or using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage Guide

### Getting Started

1. **Sign In** with your Google account
2. **Add a Playlist** - Click "Add Playlist" and paste a YouTube playlist URL
3. **Track Progress** - Check off videos as you complete them
4. **Add Notes** - Click the note icon to add personal notes for each video
5. **Monitor Stats** - View overall progress, pending videos, and time remaining

### Features Walkthrough

**Stats Dashboard:**
- Total playlists and videos
- Completion percentage
- Hours remaining to watch
- Overall progress bar

**Playlist Card:**
- Playlist name and description
- Progress bar with completion %
- Total duration and video count
- Expandable video list

**Video Checklist:**
- Quick toggle for completion
- Add/edit notes per video
- Direct YouTube link
- Duration display

**Theme Toggle:**
- Dark mode (default)
- Light mode
- Automatically persists preference

## 🎨 Design System

The app uses **shadcn/ui components** with **CSS variables** for consistent theming:

- **Green accent** (`oklch(0.77 0.097 161.36)`) for completed items
- **Dark foundation** (`oklch(0.145 0 0)` dark mode)
- **Clean cards and borders** with smooth transitions
- **Responsive grid layouts** for all screen sizes

## 📁 Project Structure

```
youtube-playlist/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/       # NextAuth handler
│   │   ├── playlists/                # Playlist CRUD routes
│   │   └── videos/[id]/              # Video update routes
│   ├── auth/
│   │   └── signin/                   # Google login page
│   ├── sheet/
│   │   ├── page.tsx                  # Sheet list page
│   │   └── [sheetId]/
│   │       └── page.tsx              # Sheet detail (focus mode)
│   ├── playlist/
│   │   └── [id]/
│   │       └── page.tsx              # Legacy redirect → /sheet/[id]
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home (auth gate → /sheet)
│   └── globals.css                   # Global styles + theme
├── components/
│   ├── ui/                           # shadcn components
│   ├── header.tsx                    # Navigation header
│   ├── app-layout.tsx                # Layout with topbar
│   ├── focus-layout.tsx              # Distraction-free layout
│   ├── home-landing.tsx              # Minimal landing for guests
│   ├── landing-page-client.tsx       # Legacy landing page
│   ├── landing-playlist-grid.tsx     # Playlist grid/list
│   ├── add-playlist-form.tsx         # Add playlist form
│   ├── theme-provider.tsx            # Theme system
│   └── auth-provider.tsx             # NextAuth context
├── lib/
│   ├── mongodb.ts                    # DB connection
│   ├── auth.ts                       # NextAuth config
│   ├── youtube.ts                    # YouTube fetcher
│   ├── tokens.ts                     # Design tokens
│   └── utils.ts                      # Utilities
├── models/
│   └── index.ts                      # Mongoose schemas
└── package.json
```

## 🔌 API Routes

### Playlists
- `GET /api/playlists` - Get all user playlists
- `POST /api/playlists` - Create new playlist
- `PATCH /api/playlists/[id]` - Update playlist
- `DELETE /api/playlists/[id]` - Delete playlist

### Videos
- `PATCH /api/videos/[id]` - Update video (completion, notes)

All routes require authentication via NextAuth.

## 🗺️ Page Routes

| Route | Description |
|-------|-------------|
| `/` | Home – redirects authenticated users to `/sheet`, shows sign-in landing for guests |
| `/sheet` | Sheet list – lists all sheets, "New sheet" modal to create from YouTube URL |
| `/sheet/:sheetId` | Sheet detail – distraction-free focus mode, inline notes, no topbar |
| `/playlist/:id` | Legacy redirect → `/sheet/:id` |

### Layouts
- **AppLayout** – includes the header/topbar, used on `/sheet`
- **FocusLayout** – no topbar, distraction-free, used on `/sheet/:sheetId`

## 🗄️ Database Schema

### User
- `email` (unique)
- `name`, `image`, `googleId`
- `theme` (light/dark)
- `timestamps`

### Playlist
- `userId` (reference)
- `name`, `description`
- `youtubePlaylistId`, `youtubeUrl`
- `videos` (array of video objects)
- `totalDuration`
- `timestamps`

### Video (subdocument in Playlist)
- `videoId`, `title`, `url`
- `duration` (minutes)
- `thumbnail`
- `completed`, `notes`, `position`

## 🚀 Deployment

### Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Connect to Vercel at https://vercel.com
# Set environment variables in Vercel dashboard
# Auto-deploy on push
```

### Deploy to Other Servers

```bash
# Production build
bun run build

# Start server
bun run start
```

## 📦 Build & Optimization

```bash
# Development
bun dev

# Production build
bun run build

# Start production server
bun run start

# Lint code
bun run lint
```

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Check MONGODB_URI format
- Ensure IP is whitelisted (if using Atlas)
- Verify credentials are correct

**Google OAuth Not Working:**
- Check Client ID and Secret in `.env.local`
- Verify redirect URI is authorized
- Clear browser cookies and login page cache

**Videos Not Loading:**
- Ensure YouTube playlist is public
- Check if playlist URL is valid
- YouTube scraping may be blocked (use API in production)

## 🔮 Future Enhancements

- [ ] YouTube API integration for auto-fetching video data
- [ ] Search and filter playlists
- [ ] Keyboard shortcuts for faster navigation
- [ ] Sharing playlists with friends
- [ ] Statistics and progress charts
- [ ] Batch operations (select multiple videos)
- [ ] Time-based reminders
- [ ] Export progress to CSV/PDF
- [ ] Dark mode schedule
- [ ] Offline support with service workers

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and pull requests.

---

**Built with ❤️ using Next.js, Shadcn UI, and MongoDB**
