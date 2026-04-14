<?php
// backend/config/config.php

define('JWT_SECRET', getenv('JWT_SECRET') ?: 'musicpro_super_secret_key_change_in_production_2024');
define('JWT_EXPIRY', 86400 * 7); // 7 days
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL', getenv('UPLOAD_URL') ?: '/uploads/');
define('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
define('ALLOWED_AUDIO', ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']);
define('ALLOWED_IMAGE', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function setCORSHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedFromEnv = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: '')));
    $defaultAllowed = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];
    $allowed = !empty($allowedFromEnv) ? $allowedFromEnv : $defaultAllowed;

    if ($origin && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } elseif (!$origin) {
        // Non-browser request (no Origin header)
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json; charset=UTF-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

function respond(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respondError(string $message, int $code = 400): never {
    respond(['error' => $message, 'success' => false], $code);
}

function respondSuccess(mixed $data, string $message = 'Success'): never {
    respond(['success' => true, 'message' => $message, 'data' => $data]);
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function sanitize(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

function slugify(string $text): string {
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/[\s-]+/', '-', $text);
    return trim($text, '-') . '-' . substr(uniqid(), -6);
}
