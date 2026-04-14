<?php
// backend/api/singers.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setCORSHeaders();
$db = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? '';
$id = (int)($_GET['id'] ?? 0);

match ($action) {
    'list' => listSingers($db),
    'get' => getSinger($db, $id),
    'create' => createSinger($db),
    'update' => updateSinger($db, $id),
    'delete' => deleteSinger($db, $id),
    'follow' => toggleFollow($db, $id),
    'top' => getTopSingers($db),
    'followed' => getFollowedSingers($db),
    default => respondError('Invalid action', 404)
};

function listSingers(PDO $db): never {
    $user = getAuthUser(false);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, (int)($_GET['limit'] ?? 20));
    $offset = ($page - 1) * $limit;
    $q = sanitize($_GET['q'] ?? '');

    $where = 'WHERE sg.is_active = 1';
    $params = [];
    if ($q) { $where .= ' AND sg.name LIKE ?'; $params[] = "%$q%"; }

    $sql = "SELECT sg.*, g.name as genre_name, g.color as genre_color,
            (SELECT COUNT(*) FROM songs WHERE singer_id = sg.id AND is_active = 1) as song_count
            FROM singers sg LEFT JOIN genres g ON sg.genre_id = g.id
            $where ORDER BY sg.follower_count DESC LIMIT $limit OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $singers = $stmt->fetchAll();

    if ($user) {
        $ids = array_column($singers, 'id');
        if ($ids) {
            $ph = implode(',', array_fill(0, count($ids), '?'));
            $fstmt = $db->prepare("SELECT singer_id FROM singer_follows WHERE user_id = ? AND singer_id IN ($ph)");
            $fstmt->execute([$user['id'], ...$ids]);
            $followed = array_flip($fstmt->fetchAll(PDO::FETCH_COLUMN));
            foreach ($singers as &$s) $s['is_followed'] = isset($followed[$s['id']]);
        }
    }

    $count = $db->prepare("SELECT COUNT(*) FROM singers sg $where");
    $count->execute($params);
    respondSuccess(['singers' => $singers, 'total' => $count->fetchColumn()]);
}

function getSinger(PDO $db, int $id): never {
    if (!$id) respondError('Singer ID required');
    $user = getAuthUser(false);

    $stmt = $db->prepare("SELECT sg.*, g.name as genre_name, g.color as genre_color,
        (SELECT COUNT(*) FROM songs WHERE singer_id = sg.id AND is_active = 1) as song_count
        FROM singers sg LEFT JOIN genres g ON sg.genre_id = g.id WHERE sg.id = ? AND sg.is_active = 1");
    $stmt->execute([$id]);
    $singer = $stmt->fetch();
    if (!$singer) respondError('Singer not found', 404);

    if ($user) {
        $fstmt = $db->prepare('SELECT id FROM singer_follows WHERE user_id = ? AND singer_id = ?');
        $fstmt->execute([$user['id'], $id]);
        $singer['is_followed'] = (bool)$fstmt->fetch();
    } else {
        $singer['is_followed'] = false;
    }
    respondSuccess($singer);
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

function validateImageUpload(array $file): void {
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
        respondError('Image size exceeds max allowed size');
    }

    $mime = detectMime($file);
    $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    $mimeAllowed = in_array($mime, ALLOWED_IMAGE, true);
    $extAllowed = in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true);

    if (!$mimeAllowed && !$extAllowed) {
        respondError('Unsupported image type');
    }
}

function saveUploadedImage(array $file, string $targetDir, string $targetBaseName): string {
    $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    $ext = $ext ?: 'jpg';
    $filename = $targetBaseName . '.' . $ext;
    $normalizedDir = realpath($targetDir) ?: $targetDir;
    $targetPath = rtrim($normalizedDir, '/') . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        respondError('Failed to move uploaded image', 500);
    }

    $uploadsRoot = realpath(__DIR__ . '/../uploads') ?: (__DIR__ . '/../uploads');
    $relative = ltrim(str_replace($uploadsRoot, '', $targetPath), '/');
    return rtrim(UPLOAD_URL, '/') . '/' . $relative;
}

function createSingerFolder(string $name): string {
    $folder = slugify($name ?: 'singer');
    $path = __DIR__ . '/../uploads/singers/' . $folder;
    ensureUploadDir($path);
    return $path;
}

function getSingerFolderPath(array $singer): string {
    $existingPath = parse_url($singer['photo'] ?? '', PHP_URL_PATH) ?: '';
    if ($existingPath && str_contains($existingPath, '/uploads/singers/')) {
        $subPath = strstr($existingPath, '/uploads/singers/');
        if ($subPath !== false) {
            $subPath = str_replace('/uploads/', '', $subPath);
            $dir = __DIR__ . '/../uploads/' . dirname($subPath);
            if (is_dir($dir)) {
                return $dir;
            }
        }
    }

    return createSingerFolder($singer['slug'] ?? ('singer-' . $singer['id']));
}

function createSinger(PDO $db): never {
    requireAdmin();
    $body = getRequestData();
    $name = sanitize($body['name'] ?? '');
    if (!$name) respondError('Name required');

    $photo = sanitize($body['photo'] ?? '');
    $coverImage = sanitize($body['cover_image'] ?? '');

    if (isMultipartRequest()) {
        $singerDir = createSingerFolder($name);

        if (isset($_FILES['photo_file']) && ($_FILES['photo_file']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            validateImageUpload($_FILES['photo_file']);
            $photo = saveUploadedImage($_FILES['photo_file'], $singerDir, 'photo');
        }

        if (isset($_FILES['cover_file']) && ($_FILES['cover_file']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            validateImageUpload($_FILES['cover_file']);
            $coverImage = saveUploadedImage($_FILES['cover_file'], $singerDir, 'cover');
        }
    }

    $slug = slugify($name);
    $stmt = $db->prepare("INSERT INTO singers (name, slug, bio, photo, cover_image, country, genre_id, verified) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->execute([$name, $slug, sanitize($body['bio'] ?? ''), $photo, $coverImage, sanitize($body['country'] ?? ''), $body['genre_id'] ?? null, (int)($body['verified'] ?? 0)]);
    respondSuccess(['id' => $db->lastInsertId()], 'Singer created');
}

function updateSinger(PDO $db, int $id): never {
    requireAdmin();
    if (!$id) respondError('Singer ID required');
    $body = getRequestData();
    $name = sanitize($body['name'] ?? '');
    if (!$name) respondError('Name required');

    $singerStmt = $db->prepare('SELECT id, slug, photo, cover_image FROM singers WHERE id = ?');
    $singerStmt->execute([$id]);
    $existingSinger = $singerStmt->fetch();
    if (!$existingSinger) respondError('Singer not found', 404);

    $photo = sanitize($body['photo'] ?? ($existingSinger['photo'] ?? ''));
    $coverImage = sanitize($body['cover_image'] ?? ($existingSinger['cover_image'] ?? ''));

    if (isMultipartRequest()) {
        $singerDir = getSingerFolderPath($existingSinger);
        ensureUploadDir($singerDir);

        if (isset($_FILES['photo_file']) && ($_FILES['photo_file']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            validateImageUpload($_FILES['photo_file']);
            $photo = saveUploadedImage($_FILES['photo_file'], $singerDir, 'photo');
        }

        if (isset($_FILES['cover_file']) && ($_FILES['cover_file']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            validateImageUpload($_FILES['cover_file']);
            $coverImage = saveUploadedImage($_FILES['cover_file'], $singerDir, 'cover');
        }
    }

    $stmt = $db->prepare("UPDATE singers SET name=?, bio=?, photo=?, cover_image=?, country=?, genre_id=?, verified=? WHERE id=?");
    $stmt->execute([$name, sanitize($body['bio'] ?? ''), $photo, $coverImage, sanitize($body['country'] ?? ''), $body['genre_id'] ?? null, (int)($body['verified'] ?? 0), $id]);
    respondSuccess(null, 'Singer updated');
}

function deleteSinger(PDO $db, int $id): never {
    requireAdmin();
    if (!$id) respondError('Singer ID required');
    $db->prepare('UPDATE singers SET is_active = 0 WHERE id = ?')->execute([$id]);
    respondSuccess(null, 'Singer deleted');
}

function toggleFollow(PDO $db, int $id): never {
    $user = getAuthUser(true);
    if (!$id) respondError('Singer ID required');

    $stmt = $db->prepare('SELECT id FROM singer_follows WHERE user_id = ? AND singer_id = ?');
    $stmt->execute([$user['id'], $id]);

    if ($stmt->fetch()) {
        $db->prepare('DELETE FROM singer_follows WHERE user_id = ? AND singer_id = ?')->execute([$user['id'], $id]);
        $db->prepare('UPDATE singers SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = ?')->execute([$id]);
        $followed = false;
    } else {
        $db->prepare('INSERT INTO singer_follows (user_id, singer_id) VALUES (?,?)')->execute([$user['id'], $id]);
        $db->prepare('UPDATE singers SET follower_count = follower_count + 1 WHERE id = ?')->execute([$id]);
        $followed = true;
    }

    $count = $db->prepare('SELECT follower_count FROM singers WHERE id = ?');
    $count->execute([$id]);
    respondSuccess(['followed' => $followed, 'follower_count' => $count->fetchColumn()]);
}

function getTopSingers(PDO $db): never {
    $limit = (int)($_GET['limit'] ?? 10);
    $stmt = $db->prepare("SELECT sg.*, g.name as genre_name,
        (SELECT COUNT(*) FROM songs WHERE singer_id = sg.id AND is_active = 1) as song_count
        FROM singers sg LEFT JOIN genres g ON sg.genre_id = g.id WHERE sg.is_active = 1
        ORDER BY sg.follower_count DESC LIMIT ?");
    $stmt->execute([$limit]);
    respondSuccess($stmt->fetchAll());
}

function getFollowedSingers(PDO $db): never {
    $user = getAuthUser(true);
    $stmt = $db->prepare("SELECT sg.*, g.name as genre_name, 1 as is_followed
        FROM singer_follows sf JOIN singers sg ON sf.singer_id = sg.id
        LEFT JOIN genres g ON sg.genre_id = g.id
        WHERE sf.user_id = ? AND sg.is_active = 1 ORDER BY sf.created_at DESC");
    $stmt->execute([$user['id']]);
    respondSuccess($stmt->fetchAll());
}
