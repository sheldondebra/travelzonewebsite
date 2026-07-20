<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\LaravelLogReader;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminLogController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLog,
        private LaravelLogReader $logReader,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $tab = $request->string('tab')->trim()->toString() ?: 'activity';

        if ($tab === 'errors') {
            $result = $this->logReader->recent(
                $request->string('level')->trim()->toString() ?: 'all',
                $request->string('search')->trim()->toString() ?: null,
            );

            return response()->json([
                'tab' => 'errors',
                'entries' => $result['entries'],
                'meta' => [
                    'file_size' => $result['file_size'],
                    'file_updated_at' => $result['file_updated_at'],
                ],
                'stats' => $this->stats($result['entries']),
            ]);
        }

        $entries = $this->activityLog->collect(
            $request->string('type')->trim()->toString() ?: null,
            $request->string('search')->trim()->toString() ?: null,
        );

        return response()->json([
            'tab' => 'activity',
            'entries' => $entries,
            'stats' => $this->stats($entries),
            'system_health' => $this->systemHealth(),
        ]);
    }

    /** @param list<array<string, mixed>> $entries */
    private function stats(array $entries): array
    {
        $today = Carbon::today();

        return [
            'total' => count($entries),
            'today' => collect($entries)->filter(function (array $entry) use ($today) {
                if (empty($entry['occurred_at'])) {
                    return false;
                }

                return Carbon::parse($entry['occurred_at'])->gte($today);
            })->count(),
            'errors' => collect($entries)->where('level', 'ERROR')->count(),
            'warnings' => collect($entries)->whereIn('level', ['WARNING', 'warning'])->count(),
        ];
    }

    private function systemHealth(): array
    {
        $dbOk = true;
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $dbOk = false;
        }

        $logPath = storage_path('logs/laravel.log');
        $logExists = is_file($logPath);

        return [
            'server' => 'Operational',
            'database' => $dbOk ? 'Operational' : 'Degraded',
            'queue' => Schema::hasTable('jobs') ? 'Configured' : 'Not configured',
            'log_file' => $logExists ? 'Available' : 'Missing',
            'log_size' => $logExists ? (filesize($logPath) ?: 0) : 0,
            'environment' => config('app.env'),
        ];
    }
}
