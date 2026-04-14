<?php
// backend/api/admin.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setCORSHeaders();
$db = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? '';

match ($action) {
    'dashboard' => dashboard($db),
    'users' => manageUsers($db),
    'genres' => manageGenres($db),
    'moods' => manageMoods($db),
    'top-songs' => topSongs($db),
    'top-singers' => topSingers($db),
    default => respondError('Invalid action', 404)
};

function dashboard(PDO $db): never {
    requireAdmin();
    $stats = [];
    $stats['total_users'] = $db->query('SELECT COUNT(*) FROM users WHERE role = "user"')->fetchColumn();
    $stats['total_songs'] = $db->query('SELECT COUNT(*) FROM songs WHERE is_active = 1')->fetchColumn();
    $stats['total_singers'] = $db->query('SELECT COUNT(*) FROM singers WHERE is_active = 1')->fetchColumn();
    $stats['total_playlists'] = $db->query('SELECT COUNT(*) FROM playlists')->fetchColumn();
    $stats['total_plays'] = $db->query('SELECT SUM(play_count) FROM songs WHERE is_active = 1')->fetchColumn();
    $stats['total_likes'] = $db->query('SELECT COUNT(*) FROM song_likes')->fetchColumn();

    $top_songs = $db->query("SELECT s.id, s.title, s.thumbnail, s.play_count, s.like_count, sg.name as singer_name
        FROM songs s JOIN singers sg ON s.singer_id = sg.id WHERE s.is_active = 1 ORDER BY s.play_count DESC LIMIT 5")->fetchAll();
    $stats['top_songs'] = $top_songs;

    $recent_users = $db->query("SELECT id, username, email, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 5")->fetchAll();
    $stats['recent_users'] = $recent_users;

    respondSuccess($stats);
}

function manageUsers(PDO $db): never {
    requireAdmin();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;
    $q = sanitize($_GET['q'] ?? '');

    $where = 'WHERE 1=1';
    $params = [];
    if ($q) { $where .= ' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ?)'; $params = ["%$q%", "%$q%", "%$q%"]; }

    $stmt = $db->prepare("SELECT id, username, email, display_name, avatar, role, is_active, created_at FROM users $where ORDER BY created_at DESC LIMIT $limit OFFSET $offset");
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    $total = $db->prepare("SELECT COUNT(*) FROM users $where"); $total->execute($params);
    respondSuccess(['users' => $users, 'total' => $total->fetchColumn()]);
}

function manageGenres(PDO $db): never {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        $stmt = $db->query("SELECT g.*, (SELECT COUNT(*) FROM songs WHERE genre_id = g.id AND is_active = 1) as song_count FROM genres g ORDER BY g.name");
        respondSuccess($stmt->fetchAll());
    }
    requireAdmin();
    $body = getBody();
    if ($method === 'POST') {
        $name = sanitize($body['name'] ?? '');
        if (!$name) respondError('Name required');
        $slug = slugify($name);
        $db->prepare('INSERT INTO genres (name, slug, color, icon) VALUES (?,?,?,?)')->execute([$name, $slug, $body['color'] ?? '#8B5CF6', $body['icon'] ?? '🎵']);
        respondSuccess(['id' => $db->lastInsertId()], 'Genre created');
    }
    if ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        $db->prepare('DELETE FROM genres WHERE id = ?')->execute([$id]);
        respondSuccess(null, 'Genre deleted');
    }
    respondError('Method not allowed', 405);
}

function manageMoods(PDO $db): never {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        $stmt = $db->query("SELECT m.*, (SELECT COUNT(*) FROM songs WHERE mood_id = m.id AND is_active = 1) as song_count FROM moods m ORDER BY m.name");
        respondSuccess($stmt->fetchAll());
    }
    requireAdmin();
    $body = getBody();
    if ($method === 'POST') {
        $name = sanitize($body['name'] ?? '');
        if (!$name) respondError('Name required');
        $slug = slugify($name);
        $db->prepare('INSERT INTO moods (name, slug, color, icon) VALUES (?,?,?,?)')->execute([$name, $slug, $body['color'] ?? '#EC4899', $body['icon'] ?? '✨']);
        respondSuccess(['id' => $db->lastInsertId()], 'Mood created');
    }
    respondError('Method not allowed', 405);
}

function topSongs(PDO $db): never {
    requireAdmin();
    $by = in_array($_GET['by'] ?? '', ['play_count', 'like_count']) ? $_GET['by'] : 'play_count';
    $stmt = $db->query("SELECT s.id, s.title, s.thumbnail, s.play_count, s.like_count, s.share_count, sg.name as singer_name
        FROM songs s JOIN singers sg ON s.singer_id = sg.id WHERE s.is_active = 1 ORDER BY s.$by DESC LIMIT 20");
    respondSuccess($stmt->fetchAll());
}

function topSingers(PDO $db): never {
    requireAdmin();
    $stmt = $db->query("SELECT sg.*, (SELECT COUNT(*) FROM songs WHERE singer_id = sg.id AND is_active = 1) as song_count
        FROM singers sg WHERE sg.is_active = 1 ORDER BY sg.follower_count DESC LIMIT 20");
    respondSuccess($stmt->fetchAll());
}
