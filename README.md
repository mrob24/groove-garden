# Groove Garden - Music Player

A beautiful, functional music streaming application with a garden theme.

## Features

- 🎵 Full music playback with controls (play/pause, skip, shuffle, repeat)
- ❤️ Like/unlike tracks
- 🎨 Garden-themed UI with animations and floating elements
- 📱 Responsive design
- 🔄 Real-time progress tracking
- 🎛️ Volume control
- 📊 Visual audio indicators

## Setup

### 1. Database Setup

Run the SQL migration in your Supabase dashboard:

```sql
-- Copy the contents of migrations/001_initial_schema.sql
```

This will create the necessary tables:
- `tracks` - Music tracks
- `playlists` - User playlists
- `playlist_tracks` - Junction table
- `user_likes` - User liked tracks
- `user_history` - Play history

### 2. Environment Variables

Create a `.env.local` file in the frontend directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
cd frontend
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/player](http://localhost:3000/player) to view the player.

## API Endpoints

- `GET /api/tracks` - Fetch tracks
- `POST /api/tracks` - Add new track
- `GET /api/playlists?user_id=1` - Get user playlists
- `POST /api/playlists` - Create playlist
- `GET /api/likes?user_id=1` - Get liked tracks
- `POST /api/likes` - Like a track
- `DELETE /api/likes?user_id=1&track_id=123` - Unlike a track

## Database Schema

### Tracks Table
```sql
CREATE TABLE tracks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration INTEGER NOT NULL,
  url TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  plan_type TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Technologies Used

- Next.js 16
- React 19
- TypeScript
- Supabase
- Tailwind CSS
- Lucide React (icons)

## Garden Theme Features

- 🌱 Mouse-following glow effect
- 🌸 Floating animated elements
- 🌿 Gradient backgrounds with pulse animations
- 🍃 Vine-like decorative patterns
- 🌺 Organic color palette (greens and earth tones)
- 🌷 Smooth hover transitions and micro-interactions