<?php
// backend/api/playlists.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setCORSHeaders();
$db = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? '';
$id = (int)($_GET['id'] ?? 0);

match ($action) {
    'list' => listPlaylists($db),
    'get' => getPlaylist($db, $id),
    'create' => createPlaylist($db),
    'update' => updatePlaylist($db, $id),
    'delete' => deletePlaylist($db, $id),
    'add-song' => addSong($db, $id),
    'remove-song' => removeSong($db, $id),
    'my' => myPlaylists($db),
    default => respondError('Invalid action', 404)
};

function getPlaylistBase(PDO $db, int $id, ?int $userId = null): array {
    $stmt = $db->prepare("SELECT p.*, u.display_name as owner_name FROM playlists p JOIN users u ON p.user_id = u.id WHERE p.id = ?");
    $stmt->execute([$id]);
    $playlist = $stmt->fetch();
    if (!$playlist) respondError('Playlist not found', 404);
    if (!$playlist['is_public'] && $playlist['user_id'] !== $userId) respondError('Private playlist', 403);
    return $playlist;
}

function listPlaylists(PDO $db): never {
    $user = getAuthUser(false);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, (int)($_GET['limit'] ?? 20));
    $offset = ($page - 1) * $limit;

    $where = 'WHERE p.is_public = 1';
    $params = [];
    if ($user) { $where = 'WHERE (p.is_public = 1 OR p.user_id = ?)'; $params[] = $user['id']; }

    $sql = "SELECT p.*, u.display_name as owner_name FROM playlists p JOIN users u ON p.user_id = u.id $where ORDER BY p.updated_at DESC LIMIT $limit OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    respondSuccess($stmt->fetchAll());
}

function getPlaylist(PDO $db, int $id): never {
    if (!$id) respondError('Playlist ID required');
    $user = getAuthUser(false);
    $playlist = getPlaylistBase($db, $id, $user['id'] ?? null);

    $sql = "SELECT s.*, sg.name as singer_name, sg.slug as singer_slug, sg.photo as singer_photo,
            g.name as genre_name, g.color as genre_color, ps.position, ps.added_at
            FROM playlist_songs ps JOIN songs s ON ps.song_id = s.id
            LEFT JOIN singers sg ON s.singer_id = sg.id
            LEFT JOIN genres g ON s.genre_id = g.id
            WHERE ps.playlist_id = ? AND s.is_active = 1 ORDER BY ps.position ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);
    $playlist['songs'] = $stmt->fetchAll();

    if ($user) {
        $likedIds = array_column($playlist['songs'], 'id');
        if ($likedIds) {
            $ph = implode(',', array_fill(0, count($likedIds), '?'));
            $lstmt = $db->prepare("SELECT song_id FROM song_likes WHERE user_id = ? AND song_id IN ($ph)");
            $lstmt->execute([$user['id'], ...$likedIds]);
            $liked = array_flip($lstmt->fetchAll(PDO::FETCH_COLUMN));
            foreach ($playlist['songs'] as &$s) $s['is_liked'] = isset($liked[$s['id']]);
        }
    }
    respondSuccess($playlist);
}

function createPlaylist(PDO $db): never {
    $user = getAuthUser(true);
    $body = getBody();
    $title = sanitize($body['title'] ?? '');
    if (!$title) respondError('Title required');

    $stmt = $db->prepare("INSERT INTO playlists (user_id, title, description, cover_image, is_public) VALUES (?,?,?,?,?)");
    $stmt->execute([$user['id'], $title, sanitize($body['description'] ?? ''), sanitize($body['cover_image'] ?? ''), (int)($body['is_public'] ?? 1)]);
    respondSuccess(['id' => $db->lastInsertId()], 'Playlist created');
}

function updatePlaylist(PDO $db, int $id): never {
    $user = getAuthUser(true);
    if (!$id) respondError('Playlist ID required');
    $playlist = getPlaylistBase($db, $id, $user['id']);
    if ($playlist['user_id'] != $user['id'] && $user['role'] !== 'admin') respondError('Forbidden', 403);

    $body = getBody();
    $title = sanitize($body['title'] ?? $playlist['title']);
    $stmt = $db->prepare("UPDATE playlists SET title=?, description=?, cover_image=?, is_public=?, updated_at=NOW() WHERE id=?");
    $stmt->execute([$title, sanitize($body['description'] ?? ''), sanitize($body['cover_image'] ?? ''), (int)($body['is_public'] ?? 1), $id]);
    respondSuccess(null, 'Playlist updated');
}

function deletePlaylist(PDO $db, int $id): never {
    $user = getAuthUser(true);
    if (!$id) respondError('Playlist ID required');
    $playlist = getPlaylistBase($db, $id, $user['id']);
    if ($playlist['user_id'] != $user['id'] && $user['role'] !== 'admin') respondError('Forbidden', 403);

    $db->prepare('DELETE FROM playlists WHERE id = ?')->execute([$id]);
    respondSuccess(null, 'Playlist deleted');
}

function addSong(PDO $db, int $playlistId): never {
    $user = getAuthUser(true);
    if (!$playlistId) respondError('Playlist ID required');
    $body = getBody();
    $songId = (int)($body['song_id'] ?? 0);
    if (!$songId) respondError('Song ID required');

    $playlist = getPlaylistBase($db, $playlistId, $user['id']);
    if ($playlist['user_id'] != $user['id'] && $user['role'] !== 'admin') respondError('Forbidden', 403);

    $pos = $db->prepare('SELECT COALESCE(MAX(position), 0) + 1 FROM playlist_songs WHERE playlist_id = ?');
    $pos->execute([$playlistId]);
    $position = $pos->fetchColumn();

    try {
        $db->prepare('INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?,?,?)')->execute([$playlistId, $songId, $position]);
        $db->prepare('UPDATE playlists SET song_count = song_count + 1, updated_at = NOW() WHERE id = ?')->execute([$playlistId]);
        respondSuccess(null, 'Song added to playlist');
    } catch (PDOException) {
        respondError('Song already in playlist');
    }
}

function removeSong(PDO $db, int $playlistId): never {
    $user = getAuthUser(true);
    if (!$playlistId) respondError('Playlist ID required');
    $body = getBody();
    $songId = (int)($body['song_id'] ?? 0);
    if (!$songId) respondError('Song ID required');

    $playlist = getPlaylistBase($db, $playlistId, $user['id']);
    if ($playlist['user_id'] != $user['id'] && $user['role'] !== 'admin') respondError('Forbidden', 403);

    $db->prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?')->execute([$playlistId, $songId]);
    $db->prepare('UPDATE playlists SET song_count = GREATEST(song_count - 1, 0), updated_at = NOW() WHERE id = ?')->execute([$playlistId]);
    respondSuccess(null, 'Song removed');
}

function myPlaylists(PDO $db): never {
    $user = getAuthUser(true);
    $stmt = $db->prepare("SELECT p.*, u.display_name as owner_name FROM playlists p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.updated_at DESC");
    $stmt->execute([$user['id']]);
    respondSuccess($stmt->fetchAll());
}
