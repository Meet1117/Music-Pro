# 🎵 Music Pro — Premium Music Streaming Platform

A full-stack, production-grade music streaming platform with a dark premium UI.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18, Zustand, TanStack Query, Howler.js, Tailwind CSS |
| Backend | PHP 8.1+ REST API |
| Database | MySQL 8.0+ |
| Auth | JWT (HS256, 7-day expiry) |

---

## 📁 Project Structure

```
melodia/
├── frontend/                  # Vite + React app
│   ├── src/
│   │   ├── App.jsx            # Router + layout
│   │   ├── components/
│   │   │   ├── layout/        # MainLayout, Sidebar, AuthLayout
│   │   │   ├── player/        # MiniPlayer, ExpandedPlayer
│   │   │   └── ui/            # SongCard, SongRow, PageLoader, etc.
│   │   ├── hooks/             # useDebounce
│   │   ├── pages/             # All app pages
│   │   │   └── admin/         # Admin panel pages
│   │   ├── services/          # Axios API layer
│   │   └── store/             # Zustand stores (auth, player)
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                   # PHP REST API
│   ├── api/
│   │   ├── auth.php           # Register, login, profile
│   │   ├── songs.php          # CRUD, search, trending, likes
│   │   ├── singers.php        # CRUD, follow/unfollow
│   │   ├── playlists.php      # CRUD, add/remove songs
│   │   └── admin.php          # Dashboard, stats, genres/moods
│   ├── config/
│   │   ├── database.php       # PDO singleton
│   │   └── config.php         # Constants, helpers
│   ├── middleware/
│   │   └── auth.php           # JWT verify/generate
│   ├── uploads/               # Song files & images
│   └── index.php              # PHP router
│
└── database/
    └── schema.sql             # Full DB schema + seed data
```

---

## 🚀 Setup Instructions

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

This creates the `melodia` database with all tables and seed data.

**Default accounts:**
- Demo: `demo@melodia.com` / `demo123`
- Admin: `admin@melodia.com` / `admin123`

### 2. Backend (PHP)

```bash
cd backend

# Edit database credentials in config/database.php
# Change: $host, $username, $password

# Start PHP dev server
php -S localhost:8000 index.php
```

> **Production:** Deploy backend via Apache/Nginx with proper PHP config. Enable mod_rewrite or configure server to route all requests through `index.php`.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api` requests to `http://localhost:8000`.

### 4. Production Build

```bash
cd frontend
npm run build
# Deploy dist/ folder to your web server
```

---

## 🎯 Feature Overview

### Music Player
- Play / Pause / Next / Previous
- Seek (click progress bar)
- Volume control + mute toggle
- Shuffle and Repeat (none / all / one)
- Mini Player (bottom bar, always visible)
- Expanded Full Player (click album art)
- Queue management + Recently Played

### Smart Recommendations
- Recommended based on: liked songs' genres, followed singers, play history
- "Trending Now" — weighted by plays + likes
- "Continue Listening" — last played songs
- "Recommended for You" — personalized

### Search
- Instant search with 350ms debounce
- Search by song title, singer, genre, album, tags
- Tabs: Songs / Artists / Genres / Trending

### Song Page
- Full song details + blurred cover art hero
- Like / Share / Add to Queue
- Lyrics section (if available)
- Related songs

### Artist Pages
- Full artist profile with cover + photo
- Follow / Unfollow (real-time count)
- Song list

### Playlists
- Create / Edit / Delete playlists
- Public & Private visibility
- Add / Remove songs
- Full playlist page with play all

### Liked Songs
- Like/unlike with optimistic UI
- Dedicated liked songs page

### Admin Panel (`/admin`)
- Dashboard with 6 key stats + top songs + recent users
- Full Songs CRUD (add/edit/delete with all fields)
- Full Singers CRUD (add/edit/delete with photo)
- Users list with search + pagination
- Route: `/admin`, `/admin/songs`, `/admin/singers`, `/admin/users`

---

## 🔌 API Reference

```
POST /api/auth?action=register      Register user
POST /api/auth?action=login         Login
GET  /api/auth?action=me            Get current user

GET  /api/songs?action=list         All songs (paginated)
GET  /api/songs?action=get&id=1     Song detail
POST /api/songs?action=create       Create song (admin)
PUT  /api/songs?action=update&id=1  Update song (admin)
DELETE /api/songs?action=delete&id=1 Delete song (admin)
GET  /api/songs?action=trending     Trending songs
GET  /api/songs?action=recent       Recently played (auth)
GET  /api/songs?action=liked        Liked songs (auth)
POST /api/songs?action=like&id=1    Toggle like (auth)
POST /api/songs?action=play&id=1    Record play
GET  /api/songs?action=search&q=xyz Search
GET  /api/songs?action=recommended  Personalized recs

GET  /api/singers?action=list       All singers
GET  /api/singers?action=get&id=1   Singer detail
POST /api/singers?action=follow&id=1 Toggle follow (auth)
GET  /api/singers?action=top        Top singers
GET  /api/singers?action=followed   Followed singers (auth)

GET  /api/playlists?action=my       User's playlists (auth)
POST /api/playlists?action=create   Create playlist (auth)
POST /api/playlists?action=add-song&id=1  Add song to playlist
DELETE /api/playlists?action=remove-song&id=1 Remove song

GET  /api/admin?action=dashboard    Admin stats (admin)
GET  /api/admin?action=genres       All genres
GET  /api/admin?action=moods        All moods
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| `--bg-primary` | `#080410` |
| `--accent-purple` | `#c026d3` |
| `--accent-pink` | `#f0abfc` |
| `--accent-violet` | `#7c3aed` |
| Font | Plus Jakarta Sans |
| Border radius | 12–24px (rounded-xl to rounded-3xl) |
| Blur | 20–30px backdrop-filter |

---

## 📝 Adding Songs (Admin)

1. Login as admin: `admin@melodia.com / admin123`
2. Go to `/admin/singers` → Add your artists
3. Go to `/admin/songs` → Add songs with:
   - Audio file URL (e.g. from your server, Cloudinary, S3, etc.)
   - Thumbnail image URL
   - Singer, genre, mood, duration, lyrics

**Tip:** For demo/testing, use publicly hosted audio files:
```
https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
```

---

## 🔒 Security Notes

- JWT secret is in `backend/config/config.php` → change in production!
- Passwords hashed with `bcrypt`
- All inputs sanitized server-side
- Admin routes protected by role check
- CORS restricted to `localhost:5173` (update for production)

---

## 🚢 Production Deployment

1. **Frontend:** `npm run build` → deploy `dist/` to Netlify / Vercel / Nginx
2. **Backend:** Deploy `backend/` to any PHP host (PHP 8.1+, PDO extension)
3. **Database:** Import schema to production MySQL
4. Update CORS origin in `backend/config/config.php`
5. Update `VITE_API_URL` if using env vars or update the vite proxy

---

Made with ❤️ — Music Pro, Feel the Music.


cd backend
php -d upload_max_filesize=100M -d post_max_size=100M -S localhost:8000 index.php

cd frontend
npm run dev 
or
npm run dev -- --host 
