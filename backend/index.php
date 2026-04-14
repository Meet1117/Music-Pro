<?php
// backend/index.php - Main router

// For development server: php -S localhost:8000 index.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = trim($uri, '/');

// Handle CORS preflight globally
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Handle large file upload issues where PHP drops $_POST and $_FILES
if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST) && empty($_FILES) && isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 0) {
    if (str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data')) {
        $maxPost = ini_get('post_max_size');
        header('Content-Type: application/json');
        http_response_code(413);
        echo json_encode(['error' => "File too large. Server limit for uploads is $maxPost. Please increase post_max_size and upload_max_filesize in your php.ini.", 'success' => false]);
        exit;
    }
}

// Route to API handlers
$routes = [
    'api/auth'     => __DIR__ . '/api/auth.php',
    'api/songs'    => __DIR__ . '/api/songs.php',
    'api/singers'  => __DIR__ . '/api/singers.php',
    'api/playlists'=> __DIR__ . '/api/playlists.php',
    'api/admin'    => __DIR__ . '/api/admin.php',
];

// Serve uploaded files
if (str_starts_with($uri, 'uploads/')) {
    $file = __DIR__ . '/' . $uri;
    if (file_exists($file)) {
        $mime = mime_content_type($file);
        if (!$mime) $mime = 'application/octet-stream';
        $size = filesize($file);
        $time = date('r', filemtime($file));

        $fm = @fopen($file, 'rb');
        if (!$fm) {
            http_response_code(500);
            exit;
        }

        header("Content-Type: $mime");
        header("Last-Modified: $time");
        header('Accept-Ranges: bytes');
        header('Cache-Control: public, max-age=86400');

        if (isset($_SERVER['HTTP_RANGE'])) {
            preg_match('/bytes=(\d+)-(\d+)?/', $_SERVER['HTTP_RANGE'], $matches);
            $offset = intval($matches[1]);
            $length = intval($matches[2] ?? $size - 1);
            if ($length >= $size) $length = $size - 1;

            header('HTTP/1.1 206 Partial Content');
            header('Content-Range: bytes ' . $offset . '-' . $length . '/' . $size);
            header('Content-Length: ' . ($length - $offset + 1));
            
            fseek($fm, $offset);
            $bytesLeft = $length - $offset + 1;
            while ($bytesLeft > 0 && !feof($fm)) {
                $read = min(8192, $bytesLeft);
                $bytesLeft -= $read;
                echo fread($fm, $read);
                ob_flush();
                flush();
            }
        } else {
            header('Content-Length: ' . $size);
            fpassthru($fm);
        }
        fclose($fm);
        exit;
    }
    http_response_code(404);
    exit;
}

foreach ($routes as $prefix => $handler) {
    if ($uri === $prefix || str_starts_with($uri, $prefix . '?') || str_starts_with($uri, $prefix . '/')) {
        require $handler;
        exit;
    }
}

header('Content-Type: application/json');
http_response_code(404);
echo json_encode(['error' => 'Route not found']);
