-- Create tables for Groove Garden music player

-- Users table (assuming it exists from auth)
-- If not, uncomment below:
-- CREATE TABLE users (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   auth_id UUID REFERENCES auth.users(id),
--   username TEXT NOT NULL,
--   email TEXT UNIQUE NOT NULL,
--   password_hash TEXT,
--   plan_type TEXT DEFAULT 'free',
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Tracks table
CREATE TABLE tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration INTEGER NOT NULL, -- in seconds
  url TEXT NOT NULL, -- URL to audio file
  cover_url TEXT, -- URL to cover image
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlists table
CREATE TABLE playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlist tracks junction table
CREATE TABLE playlist_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

-- User likes
CREATE TABLE user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- User play history
CREATE TABLE user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample tracks
INSERT INTO tracks (title, artist, album, duration, url, cover_url, genre) VALUES
('Organic Synths', 'The Gardener', 'Wildflower Ep. 1', 225, 'https://example.com/audio/organic-synths.mp3', 'https://api.dicebear.com/7.x/shapes/svg?seed=123&backgroundColor=1a3a20', 'Electronic'),
('Digital Petals', 'Bloom Collective', 'Spring Awakening', 198, 'https://example.com/audio/digital-petals.mp3', 'https://api.dicebear.com/7.x/shapes/svg?seed=456&backgroundColor=1a3a20', 'Ambient'),
('Root System', 'Terra Firma', 'Underground', 267, 'https://example.com/audio/root-system.mp3', 'https://api.dicebear.com/7.x/shapes/svg?seed=789&backgroundColor=1a3a20', 'Experimental'),
('Photosynthesis', 'Solar Synth', 'Green Energy', 189, 'https://example.com/audio/photosynthesis.mp3', 'https://api.dicebear.com/7.x/shapes/svg?seed=101&backgroundColor=1a3a20', 'Synthwave'),
('Mycelium Network', 'Fungal Beats', 'Forest Floor', 234, 'https://example.com/audio/mycelium.mp3', 'https://api.dicebear.com/7.x/shapes/svg?seed=202&backgroundColor=1a3a20', 'IDM');