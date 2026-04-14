<?php
// backend/config/database.php

class Database {
    private static $instance = null;
    private $conn;

    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $charset = 'utf8mb4';

    private function __construct() {
        $this->host = getenv('DB_HOST') ?: '127.0.0.1';
        $this->port = getenv('DB_PORT') ?: '3306';
        $this->db_name = getenv('DB_NAME') ?: 'melodia';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') ?: '';

        $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset={$this->charset}";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        try {
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection(): PDO {
        return $this->conn;
    }
}
