<?php
// backend/middleware/auth.php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

function generateJWT(array $payload): string {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    $payloadEnc = base64_encode(json_encode($payload));
    $sig = base64_encode(hash_hmac('sha256', "$header.$payloadEnc", JWT_SECRET, true));
    return "$header.$payloadEnc.$sig";
}

function verifyJWT(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $payload, $sig] = $parts;
    $expectedSig = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if (!hash_equals($expectedSig, $sig)) return null;
    $data = json_decode(base64_decode($payload), true);
    if (!$data || $data['exp'] < time()) return null;
    return $data;
}

function getAuthUser(bool $required = true): ?array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($authHeader, 'Bearer ')) {
        if ($required) respondError('Unauthorized', 401);
        return null;
    }
    $token = substr($authHeader, 7);
    $data = verifyJWT($token);
    if (!$data) {
        if ($required) respondError('Token invalid or expired', 401);
        return null;
    }
    $db = Database::getInstance()->getConnection();
    $stmt = $db->prepare('SELECT id, username, email, display_name, avatar, role, is_active FROM users WHERE id = ?');
    $stmt->execute([$data['user_id']]);
    $user = $stmt->fetch();
    if (!$user || !$user['is_active']) {
        if ($required) respondError('User not found or deactivated', 401);
        return null;
    }
    return $user;
}

function requireAdmin(): array {
    $user = getAuthUser(true);
    if ($user['role'] !== 'admin') respondError('Admin access required', 403);
    return $user;
}
