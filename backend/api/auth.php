<?php
// backend/api/auth.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setCORSHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

match ($action) {
    'register' => handleRegister($db),
    'login' => handleLogin($db),
    'logout' => handleLogout($db),
    'me' => handleMe($db),
    'update-profile' => handleUpdateProfile($db),
    default => respondError('Invalid action', 404)
};

function handleRegister(PDO $db): never {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respondError('Method not allowed', 405);
    $body = getBody();
    $username = sanitize($body['username'] ?? '');
    $email = sanitize($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $display_name = sanitize($body['display_name'] ?? $username);

    if (!$username || !$email || !$password) respondError('Username, email, password required');
    if (strlen($password) < 6) respondError('Password min 6 chars');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respondError('Invalid email');

    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? OR username = ?');
    $stmt->execute([$email, $username]);
    if ($stmt->fetch()) respondError('Email or username already taken');

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (username, email, password_hash, display_name) VALUES (?,?,?,?)');
    $stmt->execute([$username, $email, $hash, $display_name]);
    $userId = $db->lastInsertId();

    $token = generateJWT(['user_id' => $userId, 'role' => 'user']);
    respondSuccess(['token' => $token, 'user' => ['id' => $userId, 'username' => $username, 'email' => $email, 'display_name' => $display_name, 'role' => 'user']], 'Registration successful');
}

function handleLogin(PDO $db): never {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respondError('Method not allowed', 405);
    $body = getBody();
    $email = sanitize($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$email || !$password) respondError('Email and password required');

    $stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        respondError('Invalid credentials', 401);
    }

    $token = generateJWT(['user_id' => $user['id'], 'role' => $user['role']]);
    unset($user['password_hash']);
    respondSuccess(['token' => $token, 'user' => $user], 'Login successful');
}

function handleLogout(PDO $db): never {
    respondSuccess(null, 'Logged out');
}

function handleMe(PDO $db): never {
    $user = getAuthUser(true);
    
    // Get stats
    $stmt = $db->prepare('SELECT COUNT(*) as liked FROM song_likes WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $user['liked_count'] = $stmt->fetchColumn();
    
    $stmt = $db->prepare('SELECT COUNT(*) as playlists FROM playlists WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $user['playlist_count'] = $stmt->fetchColumn();
    
    $stmt = $db->prepare('SELECT COUNT(*) as following FROM singer_follows WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $user['following_count'] = $stmt->fetchColumn();
    
    respondSuccess($user);
}

function handleUpdateProfile(PDO $db): never {
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') respondError('Method not allowed', 405);
    $user = getAuthUser(true);
    $body = getBody();
    
    $display_name = sanitize($body['display_name'] ?? $user['display_name']);
    $bio = sanitize($body['bio'] ?? '');
    $avatar = sanitize($body['avatar'] ?? '');
    
    $stmt = $db->prepare('UPDATE users SET display_name=?, bio=?, avatar=? WHERE id=?');
    $stmt->execute([$display_name, $bio, $avatar, $user['id']]);
    respondSuccess(['display_name' => $display_name, 'bio' => $bio, 'avatar' => $avatar], 'Profile updated');
}
