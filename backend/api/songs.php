<?php
// backend/api/songs.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setCORSHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = (int)($_GET['id'] ?? 0);

ensureSongSingersTable($db);

match ($action) {
    'list' => listSongs($db),
    'get' => getSong($db, $id),
    'create' => createSong($db),
    'update' => updateSong($db, $id),
    'delete' => deleteSong($db, $id),
    'trending' => getTrending($db),
    'recent' => getRecentPlayed($db),
    'liked' => getLikedSongs($db),
    'like' => toggleLike($db, $id),
    'play' => recordPlay($db, $id),
    'search' => searchSongs($db),
    'recommended' => getRecommended($db),
    'by-singer' => getBySinger($db),
    'by-genre' => getByGenre($db),
    'by-mood' => getByMood($db),
    'related' => getRelated($db, $id),
    default => respondError('Invalid action', 404)
};

function songQuery(): string {
    return "SELECT s.*, COALESCE(ss_agg.singer_names, sg.name) as singer_name, COALESCE(ss_agg.singer_ids, CAST(s.singer_id AS CHAR)) as singer_ids, sg.slug as singer_slug, sg.photo as singer_photo,
            g.name as genre_name, g.slug as genre_slug, g.color as genre_color,
            m.name as mood_name, m.slug as mood_slug,
            al.title as album_title, al.slug as album_slug
            FROM songs s
            LEFT JOIN singers sg ON s.singer_id = sg.id
            LEFT JOIN (
                SELECT ss.song_id,
                       GROUP_CONCAT(sg2.name ORDER BY ss.is_primary DESC, ss.id ASC SEPARATOR ', ') as singer_names,
                       GROUP_CONCAT(ss.singer_id ORDER BY ss.is_primary DESC, ss.id ASC SEPARATOR ',') as singer_ids
                FROM song_singers ss
                JOIN singers sg2 ON ss.singer_id = sg2.id
                GROUP BY ss.song_id
            ) ss_agg ON ss_agg.song_id = s.id
            LEFT JOIN genres g ON s.genre_id = g.id
            LEFT JOIN moods m ON s.mood_id = m.id
            LEFT JOIN albums al ON s.album_id = al.id";
}

function ensureSongSingersTable(PDO $db): void {
    static $ensured = false;
    if ($ensured) return;

    $db->exec("CREATE TABLE IF NOT EXISTS song_singers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        song_id INT NOT NULL,
        singer_id INT NOT NULL,
        is_primary TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_song_singer (song_id, singer_id),
        KEY idx_song_singers_song (song_id),
        KEY idx_song_singers_singer (singer_id),
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
        FOREIGN KEY (singer_id) REFERENCES singers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $ensured = true;
}

function parseSingerIds(array $body): array {
    $raw = $body['singer_ids'] ?? ($body['singer_id'] ?? []);

    if (is_string($raw)) {
        $parts = preg_split('/[\s,]+/', $raw) ?: [];
    } elseif (is_array($raw)) {
        $parts = $raw;
    } else {
        $parts = [$raw];
    }

    $ids = [];
    foreach ($parts as $part) {
        $id = (int)$part;
        if ($id > 0 && !in_array($id, $ids, true)) {
            $ids[] = $id;
        }
    }
    return $ids;
}

function syncSongSingers(PDO $db, int $songId, array $singerIds): void {
    $db->prepare('DELETE FROM song_singers WHERE song_id = ?')->execute([$songId]);
    if (empty($singerIds)) return;

    $stmt = $db->prepare('INSERT INTO song_singers (song_id, singer_id, is_primary) VALUES (?, ?, ?)');
    foreach ($singerIds as $idx => $singerId) {
        $stmt->execute([$songId, $singerId, $idx === 0 ? 1 : 0]);
    }
}

function addLikeStatus(PDO $db, array &$songs, ?int $userId): void {
    if (!$userId || empty($songs)) return;
    $ids = array_column($songs, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $db->prepare("SELECT song_id FROM song_likes WHERE user_id = ? AND song_id IN ($placeholders)");
    $stmt->execute([$userId, ...$ids]);
    $liked = array_flip($stmt->fetchAll(PDO::FETCH_COLUMN));
    foreach ($songs as &$song) {
        $song['is_liked'] = isset($liked[$song['id']]);
    }
}

function listSongs(PDO $db): never {
    $user = getAuthUser(false);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, (int)($_GET['limit'] ?? 20));
    $offset = ($page - 1) * $limit;
    $orderBy = in_array($_GET['sort'] ?? '', ['play_count', 'like_count', 'created_at', 'title']) ? $_GET['sort'] : 'created_at';
    $dir = ($_GET['dir'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';

    $sql = songQuery() . " WHERE s.is_active = 1 ORDER BY s.$orderBy $dir LIMIT $limit OFFSET $offset";
    $stmt = $db->query($sql);
    $songs = $stmt->fetchAll();
    addLikeStatus($db, $songs, $user['id'] ?? null);

    $total = $db->query("SELECT COUNT(*) FROM songs WHERE is_active = 1")->fetchColumn();
    respondSuccess(['songs' => $songs, 'total' => $total, 'page' => $page, 'limit' => $limit]);
}

function getSong(PDO $db, int $id): never {
    if (!$id) respondError('Song ID required');
    $user = getAuthUser(false);
    $stmt = $db->prepare(songQuery() . " WHERE s.id = ? AND s.is_active = 1");
    $stmt->execute([$id]);
    $song = $stmt->fetch();
    if (!$song) respondError('Song not found', 404);

    if ($user) {
        $stmt = $db->prepare('SELECT id FROM song_likes WHERE user_id = ? AND song_id = ?');
        $stmt->execute([$user['id'], $id]);
        $song['is_liked'] = (bool)$stmt->fetch();
    } else {
        $song['is_liked'] = false;
    }
    respondSuccess($song);
}

function isMultipartRequest(): bool {
    return str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');
}

function getRequestData(): array {
    return isMultipartRequest() ? $_POST : getBody();
}

function ensureUploadDir(string $path): void {
    if (!is_dir($path) && !mkdir($path, 0755, true) && !is_dir($path)) {
        respondError('Failed to create upload directory', 500);
    }
}

function detectMime(array $file): string {
    $mime = mime_content_type($file['tmp_name'] ?? '') ?: '';
    return strtolower(trim($mime));
}

function validateUpload(array $file, array $allowedMimes, array $allowedExtensions): void {
    $err = $file['error'] ?? UPLOAD_ERR_NO_FILE;
    if ($err !== UPLOAD_ERR_OK) {
        $msgs = [
            UPLOAD_ERR_INI_SIZE => 'File too large (exceeds upload_max_filesize directive in php.ini)',
            UPLOAD_ERR_FORM_SIZE => 'File too large (exceeds MAX_FILE_SIZE directive in HTML form)',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload',
        ];
        respondError($msgs[$err] ?? 'Unknown upload error');
    }

    if (($file['size'] ?? 0) > MAX_FILE_SIZE) {
        respondError('File size exceeds max allowed size');
    }

    $mime = detectMime($file);
    $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    $mimeAllowed = in_array($mime, $allowedMimes, true);
    $extAllowed = in_array($ext, $allowedExtensions, true);

    if (!$mimeAllowed && !$extAllowed) {
        respondError('Unsupported file type');
    }
}

function saveUploadedFile(array $file, string $targetDir, string $targetBaseName): string {
    $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    $ext = $ext ?: 'bin';
    $filename = $targetBaseName . '.' . $ext;
    $normalizedDir = realpath($targetDir) ?: $targetDir;
    $targetPath = rtrim($normalizedDir, '/') . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        respondError('Failed to move uploaded file', 500);
    }

    $uploadsRoot = realpath(__DIR__ . '/../uploads') ?: (__DIR__ . '/../uploads');
    $relative = ltrim(str_replace($uploadsRoot, '', $targetPath), '/');
    return rtrim(UPLOAD_URL, '/') . '/' . $relative;
}

function getSongFolderPath(array $song): string {
    $existingPath = parse_url($song['file_url'] ?? '', PHP_URL_PATH) ?: '';
    if ($existingPath && str_contains($existingPath, '/uploads/songs/')) {
        $subPath = strstr($existingPath, '/uploads/songs/');
        if ($subPath !== false) {
            $subPath = str_replace('/uploads/', '', $subPath);
            $dir = __DIR__ . '/../uploads/' . dirname($subPath);
            if (is_dir($dir)) {
                return $dir;
            }
        }
    }

    $folder = slugify($song['slug'] ?? ('song-' . $song['id']));
    return __DIR__ . '/../uploads/songs/' . $folder;
}

function createSongFolder(string $title): string {
    $folder = slugify($title);
    $path = __DIR__ . '/../uploads/songs/' . $folder;
    ensureUploadDir($path);
    return $path;
}

function createSong(PDO $db): never {
    requireAdmin();
    $body = getRequestData();
    $title = sanitize($body['title'] ?? '');
    $singerIds = parseSingerIds($body);
    $singer_id = $singerIds[0] ?? 0;
    $file_url = sanitize($body['file_url'] ?? '');
    $thumbnail = sanitize($body['thumbnail'] ?? '');

    if (isMultipartRequest()) {
        if (!isset($_FILES['audio_file'])) {
            respondError('Audio file is required');
        }

        validateUpload($_FILES['audio_file'], ALLOWED_AUDIO, ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']);
        $songDir = createSongFolder($title ?: 'song');
        $file_url = saveUploadedFile($_FILES['audio_file'], $songDir, 'audio');

        if (isset($_FILES['thumbnail_file']) && ($_FILES['thumbnail_file']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            validateUpload($_FILES['thumbnail_file'], ALLOWED_IMAGE, ['jpg', 'jpeg', 'png', 'webp', 'gif']);
            $thumbnail = saveUploadedFile($_FILES['thumbnail_file'], $songDir, 'cover');
        }
    }

    if (!$title || !$singer_id || !$file_url) respondError('Title, singer_id, file_url required');

    $slug = slugify($title);
    $stmt = $db->prepare("INSERT INTO songs (title, slug, singer_id, album_id, genre_id, mood_id, file_url, thumbnail, duration, language, lyrics, tags, release_date)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $title, $slug, $singer_id,
        $body['album_id'] ?? null, $body['genre_id'] ?? null, $body['mood_id'] ?? null,
        $file_url, $thumbnail,
        (int)($body['duration'] ?? 0),
        sanitize($body['language'] ?? ''),
        sanitize($body['lyrics'] ?? ''),
        sanitize($body['tags'] ?? ''),
        $body['release_date'] ?? null
    ]);

    $songId = (int)$db->lastInsertId();
    syncSongSingers($db, $songId, $singerIds);

    respondSuccess(['id' => $songId], 'Song created');
}

function updateSong(PDO $db, int $id): never {
    requireAdmin();
    if (!$id) respondError('Song ID required');
    $body = getRequestData();
    $title = sanitize($body['title'] ?? '');
    if (!$title) respondError('Title required');

    $songStmt = $db->prepare('SELECT id, slug, file_url, thumbnail FROM songs WHERE id = ?');
    $songStmt->execute([$id]);
    $existingSong = $songStmt->fetch();
    if (!$existingSong) respondError('Song not found', 404);

    $file_url = sanitize($body['file_url'] ?? ($existingSong['file_url'] ?? ''));
    $thumbnail = sanitize($body['thumbnail'] ?? ($existingSong['thumbnail'] ?? ''));

    if (isMultipartRequest()) {
        $songDir = getSongFolderPath($existingSong);
        ensureUploadDir($songDir);

        if (isset($_FILES['audio_file']) && ($_FILES['audio_file']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            validateUpload($_FILES['audio_file'], ALLOWED_AUDIO, ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']);
            $file_url = saveUploadedFile($_FILES['audio_file'], $songDir, 'audio');
        }

        if (isset($_FILES['thumbnail_file']) && ($_FILES['thumbnail_file']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            validateUpload($_FILES['thumbnail_file'], ALLOWED_IMAGE, ['jpg', 'jpeg', 'png', 'webp', 'gif']);
            $thumbnail = saveUploadedFile($_FILES['thumbnail_file'], $songDir, 'cover');
        }
    }

    $singerIds = parseSingerIds($body);
    $primarySingerId = $singerIds[0] ?? (int)($body['singer_id'] ?? 0);
    if (!$primarySingerId) respondError('singer_id required');

    $stmt = $db->prepare("UPDATE songs SET title=?, singer_id=?, album_id=?, genre_id=?, mood_id=?,
        file_url=?, thumbnail=?, duration=?, language=?, lyrics=?, tags=?, release_date=?, updated_at=NOW()
        WHERE id=?");
    $stmt->execute([
        $title, $primarySingerId, $body['album_id'] ?? null,
        $body['genre_id'] ?? null, $body['mood_id'] ?? null,
        $file_url, $thumbnail,
        (int)($body['duration'] ?? 0), sanitize($body['language'] ?? ''),
        sanitize($body['lyrics'] ?? ''), sanitize($body['tags'] ?? ''),
        $body['release_date'] ?? null, $id
    ]);

    syncSongSingers($db, $id, empty($singerIds) ? [$primarySingerId] : $singerIds);

    respondSuccess(null, 'Song updated');
}

function deleteSong(PDO $db, int $id): never {
    requireAdmin();
    if (!$id) respondError('Song ID required');
    $stmt = $db->prepare('UPDATE songs SET is_active = 0 WHERE id = ?');
    $stmt->execute([$id]);
    respondSuccess(null, 'Song deleted');
}

function getTrending(PDO $db): never {
    $user = getAuthUser(false);
    $limit = min(50, (int)($_GET['limit'] ?? 20));
    $stmt = $db->prepare(songQuery() . " WHERE s.is_active = 1 ORDER BY (s.play_count * 0.4 + s.like_count * 0.6) DESC, s.created_at DESC LIMIT ?");
    $stmt->execute([$limit]);
    $songs = $stmt->fetchAll();
    addLikeStatus($db, $songs, $user['id'] ?? null);
    respondSuccess($songs);
}

function getRecentPlayed(PDO $db): never {
    $user = getAuthUser(true);
    $limit = min(50, (int)($_GET['limit'] ?? 20));
    $sql = "SELECT DISTINCT s.*, COALESCE(ss_agg.singer_names, sg.name) as singer_name, COALESCE(ss_agg.singer_ids, CAST(s.singer_id AS CHAR)) as singer_ids, sg.slug as singer_slug, sg.photo as singer_photo,
            g.name as genre_name, g.slug as genre_slug, g.color as genre_color,
            m.name as mood_name, al.title as album_title,
            ph.played_at as last_played
            FROM play_history ph
            JOIN songs s ON ph.song_id = s.id
            LEFT JOIN singers sg ON s.singer_id = sg.id
            LEFT JOIN (
                SELECT ss.song_id,
                       GROUP_CONCAT(sg2.name ORDER BY ss.is_primary DESC, ss.id ASC SEPARATOR ', ') as singer_names,
                       GROUP_CONCAT(ss.singer_id ORDER BY ss.is_primary DESC, ss.id ASC SEPARATOR ',') as singer_ids
                FROM song_singers ss
                JOIN singers sg2 ON ss.singer_id = sg2.id
                GROUP BY ss.song_id
            ) ss_agg ON ss_agg.song_id = s.id
            LEFT JOIN genres g ON s.genre_id = g.id
            LEFT JOIN moods m ON s.mood_id = m.id
            LEFT JOIN albums al ON s.album_id = al.id
            WHERE ph.user_id = ? AND s.is_active = 1
            GROUP BY s.id ORDER BY ph.played_at DESC LIMIT ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$user['id'], $limit]);
    $songs = $stmt->fetchAll();
    addLikeStatus($db, $songs, $user['id']);
    respondSuccess($songs);
}

function getLikedSongs(PDO $db): never {
    $user = getAuthUser(true);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, (int)($_GET['limit'] ?? 20));
    $offset = ($page - 1) * $limit;

    $sql = songQuery() . " JOIN song_likes sl ON s.id = sl.song_id WHERE sl.user_id = ? AND s.is_active = 1 ORDER BY sl.created_at DESC LIMIT $limit OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute([$user['id']]);
    $songs = $stmt->fetchAll();
    foreach ($songs as &$s) $s['is_liked'] = true;

    $total = $db->prepare('SELECT COUNT(*) FROM song_likes WHERE user_id = ?');
    $total->execute([$user['id']]);
    respondSuccess(['songs' => $songs, 'total' => $total->fetchColumn()]);
}

function toggleLike(PDO $db, int $id): never {
    $user = getAuthUser(true);
    if (!$id) respondError('Song ID required');

    $stmt = $db->prepare('SELECT id FROM song_likes WHERE user_id = ? AND song_id = ?');
    $stmt->execute([$user['id'], $id]);
    $existing = $stmt->fetch();

    if ($existing) {
        $db->prepare('DELETE FROM song_likes WHERE user_id = ? AND song_id = ?')->execute([$user['id'], $id]);
        $db->prepare('UPDATE songs SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?')->execute([$id]);
        $liked = false;
    } else {
        $db->prepare('INSERT INTO song_likes (user_id, song_id) VALUES (?,?)')->execute([$user['id'], $id]);
        $db->prepare('UPDATE songs SET like_count = like_count + 1 WHERE id = ?')->execute([$id]);
        $liked = true;
    }

    $stmt = $db->prepare('SELECT like_count FROM songs WHERE id = ?');
    $stmt->execute([$id]);
    respondSuccess(['liked' => $liked, 'like_count' => $stmt->fetchColumn()]);
}

function recordPlay(PDO $db, int $id): never {
    $user = getAuthUser(false);
    if (!$id) respondError('Song ID required');

    $db->prepare('UPDATE songs SET play_count = play_count + 1 WHERE id = ?')->execute([$id]);

    if ($user) {
        $db->prepare('INSERT INTO play_history (user_id, song_id, play_duration) VALUES (?,?,?)')->execute([
            $user['id'], $id, (int)(getBody()['duration'] ?? 0)
        ]);
    }
    respondSuccess(null, 'Play recorded');
}

function searchSongs(PDO $db): never {
    $user = getAuthUser(false);
    $q = sanitize($_GET['q'] ?? '');
    if (!$q) respondError('Query required');

    $limit = min(50, (int)($_GET['limit'] ?? 20));
    $term = "%$q%";

    $sql = songQuery() . " WHERE s.is_active = 1 AND (s.title LIKE ? OR COALESCE(ss_agg.singer_names, sg.name) LIKE ? OR al.title LIKE ? OR g.name LIKE ? OR s.tags LIKE ?)
           ORDER BY (s.title LIKE ?) DESC, s.play_count DESC LIMIT $limit";
    $stmt = $db->prepare($sql);
    $stmt->execute([$term, $term, $term, $term, $term, "$q%"]);
    $songs = $stmt->fetchAll();
    addLikeStatus($db, $songs, $user['id'] ?? null);

    if ($user) {
        $db->prepare('INSERT INTO search_history (user_id, query) VALUES (?,?)')->execute([$user['id'], $q]);
    }
    respondSuccess($songs);
}

function getRecommended(PDO $db): never {
    $user = getAuthUser(false);
    $limit = (int)($_GET['limit'] ?? 20);

    if (!$user) {
        // fallback: trending
        $stmt = $db->prepare(songQuery() . " WHERE s.is_active = 1 ORDER BY s.play_count DESC LIMIT ?");
        $stmt->execute([$limit]);
        respondSuccess($stmt->fetchAll());
    }

    // Based on liked genres, singers from history and likes
    $sql = songQuery() . " WHERE s.is_active = 1
            AND (
                s.genre_id IN (SELECT genre_id FROM songs WHERE id IN (SELECT song_id FROM song_likes WHERE user_id = ?) AND genre_id IS NOT NULL LIMIT 5)
                OR s.singer_id IN (SELECT singer_id FROM singer_follows WHERE user_id = ?)
                OR EXISTS (
                    SELECT 1
                    FROM song_singers ssf
                    WHERE ssf.song_id = s.id
                    AND ssf.singer_id IN (SELECT singer_id FROM singer_follows WHERE user_id = ?)
                )
                OR s.singer_id IN (SELECT singer_id FROM songs WHERE id IN (SELECT song_id FROM play_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 20))
                OR EXISTS (
                    SELECT 1
                    FROM song_singers ssh
                    WHERE ssh.song_id = s.id
                    AND ssh.singer_id IN (
                        SELECT singer_id FROM songs WHERE id IN (SELECT song_id FROM play_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 20)
                    )
                )
            )
            AND s.id NOT IN (SELECT song_id FROM song_likes WHERE user_id = ?)
            ORDER BY s.play_count DESC, RAND()
            LIMIT ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$user['id'], $user['id'], $user['id'], $user['id'], $user['id'], $user['id'], $limit]);
    $songs = $stmt->fetchAll();

    if (count($songs) < $limit) {
        $extra = $limit - count($songs);
        $existingIds = empty($songs) ? [0] : array_column($songs, 'id');
        $ph = implode(',', array_fill(0, count($existingIds), '?'));
        $stmt = $db->prepare(songQuery() . " WHERE s.is_active = 1 AND s.id NOT IN ($ph) ORDER BY s.play_count DESC, RAND() LIMIT ?");
        $stmt->execute([...$existingIds, $extra]);
        $songs = array_merge($songs, $stmt->fetchAll());
    }

    addLikeStatus($db, $songs, $user['id']);
    respondSuccess($songs);
}

function getBySinger(PDO $db): never {
    $user = getAuthUser(false);
    $singerId = (int)($_GET['singer_id'] ?? 0);
    if (!$singerId) respondError('Singer ID required');
    $limit = (int)($_GET['limit'] ?? 20);

    $stmt = $db->prepare(songQuery() . " WHERE s.is_active = 1 AND (s.singer_id = ? OR EXISTS (SELECT 1 FROM song_singers ss WHERE ss.song_id = s.id AND ss.singer_id = ?)) ORDER BY s.play_count DESC LIMIT ?");
    $stmt->execute([$singerId, $singerId, $limit]);
    $songs = $stmt->fetchAll();
    addLikeStatus($db, $songs, $user['id'] ?? null);
    respondSuccess($songs);
}

function getByGenre(PDO $db): never {
    $user = getAuthUser(false);
    $genreId = (int)($_GET['genre_id'] ?? 0);
    if (!$genreId) respondError('Genre ID required');
    $limit = (int)($_GET['limit'] ?? 20);

    $stmt = $db->prepare(songQuery() . " WHERE s.genre_id = ? AND s.is_active = 1 ORDER BY s.play_count DESC LIMIT ?");
    $stmt->execute([$genreId, $limit]);
    $songs = $stmt->fetchAll();
    addLikeStatus($db, $songs, $user['id'] ?? null);
    respondSuccess($songs);
}

function getByMood(PDO $db): never {
    $user = getAuthUser(false);
    $moodId = (int)($_GET['mood_id'] ?? 0);
    if (!$moodId) respondError('Mood ID required');
    $limit = (int)($_GET['limit'] ?? 20);

    $stmt = $db->prepare(songQuery() . " WHERE s.mood_id = ? AND s.is_active = 1 ORDER BY RAND() LIMIT ?");
    $stmt->execute([$moodId, $limit]);
    $songs = $stmt->fetchAll();
    addLikeStatus($db, $songs, $user['id'] ?? null);
    respondSuccess($songs);
}

function getRelated(PDO $db, int $id): never {
    $user = getAuthUser(false);
    if (!$id) respondError('Song ID required');
    $limit = (int)($_GET['limit'] ?? 10);

    $curr = $db->prepare('SELECT singer_id, genre_id FROM songs WHERE id = ?');
    $curr->execute([$id]);
    $song = $curr->fetch();

    $stmt = $db->prepare(songQuery() . " WHERE s.is_active = 1 AND s.id != ? AND (s.singer_id = ? OR s.genre_id = ?) ORDER BY s.play_count DESC, RAND() LIMIT ?");
    $stmt->execute([$id, $song['singer_id'], $song['genre_id'], $limit]);
    $songs = $stmt->fetchAll();
    addLikeStatus($db, $songs, $user['id'] ?? null);
    respondSuccess($songs);
}
