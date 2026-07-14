<?php
declare(strict_types=1);

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function redirect(string $path): never
{
    global $config;
    $url = str_starts_with($path, 'http') ? $path : rtrim($config['app_url'], '/') . '/' . ltrim($path, '/');
    header('Location: ' . $url);
    exit;
}

function url(string $path = ''): string
{
    global $config;
    return rtrim($config['app_url'], '/') . '/' . ltrim($path, '/');
}

function asset(string $path): string
{
    return url(ltrim($path, '/'));
}

function setting(string $key, ?string $default = null): ?string
{
    static $cache = null;
    if ($cache === null) {
        $cache = [];
        try {
            $rows = db()->query('SELECT setting_key, setting_value FROM settings')->fetchAll();
            foreach ($rows as $row) {
                $cache[$row['setting_key']] = $row['setting_value'];
            }
        } catch (Throwable $e) {
            $cache = [];
        }
    }
    return $cache[$key] ?? $default;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

function verify_csrf(?string $token): bool
{
    return is_string($token)
        && isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

function flash(string $key, ?string $message = null): ?string
{
    if ($message !== null) {
        $_SESSION['flash'][$key] = $message;
        return null;
    }
    $val = $_SESSION['flash'][$key] ?? null;
    unset($_SESSION['flash'][$key]);
    return $val;
}

function slugify(string $text): string
{
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
    return trim($text, '-') ?: 'item';
}

function stars(float $rating): string
{
    $full = (int) floor($rating);
    $html = '';
    for ($i = 0; $i < 5; $i++) {
        $html .= $i < $full
            ? '<span class="text-amber-500">★</span>'
            : '<span class="text-stone-300">★</span>';
    }
    return $html;
}

function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function request_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function post(string $key, mixed $default = null): mixed
{
    return $_POST[$key] ?? $default;
}

function get(string $key, mixed $default = null): mixed
{
    return $_GET[$key] ?? $default;
}

function order_number(): string
{
    return 'CD-' . strtoupper(bin2hex(random_bytes(4))) . '-' . date('ymd');
}

function active_nav(string $page): string
{
    $current = $_GET['page'] ?? 'home';
    return $current === $page ? 'text-brand-ink font-semibold' : 'text-brand-ink/70 hover:text-brand-ink';
}

/**
 * Colored status pill for admin order statuses.
 */
function admin_status_badge(string $status): string
{
    $map = [
        'pending'    => 'bg-amber-100 text-amber-800',
        'paid'       => 'bg-emerald-100 text-emerald-800',
        'processing' => 'bg-sky-100 text-sky-800',
        'shipped'    => 'bg-indigo-100 text-indigo-800',
        'delivered'  => 'bg-green-100 text-green-800',
        'cancelled'  => 'bg-rose-100 text-rose-700',
        'refunded'   => 'bg-stone-200 text-stone-700',
    ];
    $classes = $map[$status] ?? 'bg-stone-100 text-stone-600';
    return '<span class="inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ' . $classes . '">'
        . e($status) . '</span>';
}

/**
 * Active-nav classes for the admin sidebar based on the current script filename.
 */
function admin_active_nav(string $file): string
{
    $current = basename($_SERVER['SCRIPT_NAME'] ?? '');
    $active = 'flex items-center gap-3 rounded-lg px-3 py-2 bg-[#F3C4C4] text-stone-900 font-semibold';
    $idle   = 'flex items-center gap-3 rounded-lg px-3 py-2 text-stone-300 hover:text-white hover:bg-white/5';
    return $current === $file ? $active : $idle;
}

/**
 * Emit a Lucide icon element. Rendered client-side by lucide.createIcons().
 */
function admin_icon(string $name, string $classes = 'w-4 h-4'): string
{
    return '<i data-lucide="' . e($name) . '" class="' . e($classes) . '"></i>';
}
