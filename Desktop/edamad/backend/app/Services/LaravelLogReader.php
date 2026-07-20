<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Str;

class LaravelLogReader
{
    private const MAX_BYTES = 512000;

    /** @return array{entries: list<array<string, mixed>>, file_size: int, file_updated_at: ?string} */
    public function recent(?string $level = null, ?string $search = null, int $limit = 100): array
    {
        $path = storage_path('logs/laravel.log');

        if (! is_file($path)) {
            return ['entries' => [], 'file_size' => 0, 'file_updated_at' => null];
        }

        $content = $this->tail($path, self::MAX_BYTES);
        $entries = $this->parse($content);

        if ($level && $level !== 'all') {
            $entries = array_values(array_filter($entries, fn (array $e) => strtoupper($e['level']) === strtoupper($level)));
        }

        if ($search) {
            $needle = strtolower($search);
            $entries = array_values(array_filter(
                $entries,
                fn (array $e) => str_contains(strtolower($e['message']), $needle)
                    || str_contains(strtolower($e['level']), $needle),
            ));
        }

        $entries = array_slice($entries, 0, $limit);

        return [
            'entries' => array_map(function (array $entry) {
                $at = Carbon::parse($entry['occurred_at']);

                return [
                    ...$entry,
                    'time_ago' => $at->diffForHumans(),
                ];
            }, $entries),
            'file_size' => filesize($path) ?: 0,
            'file_updated_at' => Carbon::createFromTimestamp(filemtime($path))->toIso8601String(),
        ];
    }

    private function tail(string $path, int $maxBytes): string
    {
        $size = filesize($path);
        if ($size === false || $size <= $maxBytes) {
            return (string) file_get_contents($path);
        }

        $handle = fopen($path, 'rb');
        fseek($handle, -$maxBytes, SEEK_END);
        $content = fread($handle, $maxBytes);
        fclose($handle);

        return (string) $content;
    }

    /** @return list<array<string, mixed>> */
    private function parse(string $content): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $content) ?: [];
        $entries = [];
        $current = null;

        foreach ($lines as $line) {
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.*)$/', $line, $matches)) {
                if ($current) {
                    $entries[] = $this->finalizeEntry($current);
                }

                $current = [
                    'occurred_at' => $matches[1],
                    'environment' => $matches[2],
                    'level' => strtoupper($matches[3]),
                    'message' => $matches[4],
                    'stack' => '',
                ];

                continue;
            }

            if ($current !== null && $line !== '') {
                $current['stack'] .= $line."\n";
            }
        }

        if ($current) {
            $entries[] = $this->finalizeEntry($current);
        }

        return array_reverse($entries);
    }

    /** @param array<string, string> $entry */
    private function finalizeEntry(array $entry): array
    {
        $message = trim($entry['message']);
        $stack = trim($entry['stack']);

        if (Str::contains($message, '{') && Str::endsWith($message, '}')) {
            $jsonStart = strpos($message, '{');
            if ($jsonStart !== false) {
                $stack = trim(substr($message, $jsonStart)."\n".$stack);
                $message = trim(substr($message, 0, $jsonStart));
            }
        }

        return [
            'id' => md5($entry['occurred_at'].$entry['level'].$message),
            'level' => $entry['level'],
            'environment' => $entry['environment'],
            'message' => $message !== '' ? $message : 'Log entry',
            'stack' => $stack !== '' ? $stack : null,
            'occurred_at' => Carbon::parse($entry['occurred_at'])->toIso8601String(),
        ];
    }
}
