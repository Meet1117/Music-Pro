-- ============================================
-- MELODIA - Music Streaming Platform Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS melodia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE melodia;

-- Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar VARCHAR(255),
  bio TEXT,
  role ENUM('user','admin') DEFAULT 'user',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Genres
CREATE TABLE genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#8B5CF6',
  icon VARCHAR(50),
  cover_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moods
CREATE TABLE moods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#EC4899',
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Singers / Artists
CREATE TABLE singers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  bio TEXT,
  photo VARCHAR(255),
  cover_image VARCHAR(255),
  country VARCHAR(100),
  genre_id INT,
  follower_count INT DEFAULT 0,
  monthly_listeners INT DEFAULT 0,
  verified TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL
);

-- Albums
CREATE TABLE albums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  singer_id INT NOT NULL,
  cover_image VARCHAR(255),
  release_year YEAR,
  album_type ENUM('album','ep','single') DEFAULT 'album',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (singer_id) REFERENCES singers(id) ON DELETE CASCADE
);

-- Songs
CREATE TABLE songs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  singer_id INT NOT NULL,
  album_id INT,
  genre_id INT,
  mood_id INT,
  file_url VARCHAR(500) NOT NULL,
  thumbnail VARCHAR(500),
  duration INT DEFAULT 0,
  language VARCHAR(50),
  lyrics TEXT,
  tags VARCHAR(500),
  play_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  release_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (singer_id) REFERENCES singers(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL,
  FOREIGN KEY (mood_id) REFERENCES moods(id) ON DELETE SET NULL
);

-- Song Singers (supports collaborations / multiple singers per song)
CREATE TABLE song_singers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT NOT NULL,
  singer_id INT NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_song_singer (song_id, singer_id),
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (singer_id) REFERENCES singers(id) ON DELETE CASCADE
);

-- Playlists
CREATE TABLE playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  is_public TINYINT(1) DEFAULT 1,
  song_count INT DEFAULT 0,
  total_duration INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Playlist Songs
CREATE TABLE playlist_songs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  position INT DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_playlist_song (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Likes (Songs)
CREATE TABLE song_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  song_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_song (user_id, song_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Follows (Singer)
CREATE TABLE singer_follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  singer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_singer (user_id, singer_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (singer_id) REFERENCES singers(id) ON DELETE CASCADE
);

-- Play History
CREATE TABLE play_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  song_id INT NOT NULL,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  play_duration INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Search History
CREATE TABLE search_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  query VARCHAR(500) NOT NULL,
  result_type ENUM('song','singer','album','genre','playlist') DEFAULT 'song',
  result_id INT,
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Auth Tokens
CREATE TABLE auth_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trending (cached)
CREATE TABLE trending_songs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT NOT NULL UNIQUE,
  score DECIMAL(10,2) DEFAULT 0,
  rank_position INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_songs_singer ON songs(singer_id);
CREATE INDEX idx_songs_genre ON songs(genre_id);
CREATE INDEX idx_songs_mood ON songs(mood_id);
CREATE INDEX idx_play_history_user ON play_history(user_id, played_at);
CREATE INDEX idx_song_likes_user ON song_likes(user_id);
CREATE INDEX idx_search_history_user ON search_history(user_id, searched_at);
CREATE INDEX idx_playlist_songs_playlist ON playlist_songs(playlist_id, position);

-- ============================================
-- SEED DATA
-- ============================================

-- Genres
INSERT INTO genres (name, slug, color, icon) VALUES
('Pop', 'pop', '#EC4899', '🎵'),
('Rock', 'rock', '#EF4444', '🎸'),
('Hip-Hop', 'hip-hop', '#F59E0B', '🎤'),
('Electronic', 'electronic', '#6366F1', '🎛️'),
('Jazz', 'jazz', '#14B8A6', '🎷'),
('Classical', 'classical', '#8B5CF6', '🎹'),
('R&B', 'rnb', '#F97316', '🎶'),
('Country', 'country', '#84CC16', '🤠'),
('Indie', 'indie', '#06B6D4', '🎵'),
('Metal', 'metal', '#6B7280', '🤘');

-- Moods
INSERT INTO moods (name, slug, color, icon) VALUES
('Happy', 'happy', '#FDE68A', '😊'),
('Sad', 'sad', '#93C5FD', '😢'),
('Energetic', 'energetic', '#FCA5A5', '⚡'),
('Chill', 'chill', '#A7F3D0', '😌'),
('Romantic', 'romantic', '#FBCFE8', '❤️'),
('Focus', 'focus', '#C4B5FD', '🎯'),
('Party', 'party', '#FDE68A', '🎉'),
('Workout', 'workout', '#FED7AA', '💪');

-- Admin user (password: admin123)
INSERT INTO users (username, email, password_hash, display_name, role) VALUES
('admin', 'admin@melodia.com', '$2y$12$B3UdZ6BYMOFaw9cdANF2cOe2ypZcVGT2GHQo2l/IrgFGCMwocQJdO', 'Melodia Admin', 'admin');

-- Demo user (password: demo123)
INSERT INTO users (username, email, password_hash, display_name) VALUES
('demo', 'demo@melodia.com', '$2y$12$LDmiOr0UsonxKluSUOwgjOzh2zHpDI0oQnCPiZ703H8ihzTlElUK6', 'Demo User');
