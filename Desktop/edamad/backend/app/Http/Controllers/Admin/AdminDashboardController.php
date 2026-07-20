<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\SupportTicket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $now = Carbon::now();

        $stats = [
            $this->statBlock('Total Users', User::count(), User::class),
            $this->statBlock('Total Courses', Course::count(), Course::class),
            $this->statBlock('Active Enrollments', Enrollment::count(), Enrollment::class),
            $this->statBlock('Certificates Issued', Enrollment::whereNotNull('completed_at')->count(), Enrollment::class, 'completed_at'),
            $this->statBlock('Open Tickets', SupportTicket::whereIn('status', ['Open', 'In Progress'])->count(), SupportTicket::class, null, true),
        ];

        $topCourses = Course::query()
            ->withCount('enrollments')
            ->withAvg('enrollments', 'progress_percent')
            ->orderByDesc('enrollments_count')
            ->limit(5)
            ->get()
            ->map(fn (Course $course) => [
                'id' => (string) $course->id,
                'title' => $course->title,
                'enrollments' => $course->enrollments_count,
                'completion' => (int) round($course->enrollments_avg_progress_percent ?? 0),
            ]);

        $totalUsers = max(User::count(), 1);
        $students = User::where('role', 'student')->count();
        $admins = User::where('role', 'admin')->count();
        $others = max($totalUsers - $students - $admins, 0);

        $studentPercent = (int) round(($students / $totalUsers) * 100);
        $adminPercent = (int) round(($admins / $totalUsers) * 100);
        $otherPercent = max(0, 100 - $studentPercent - $adminPercent);

        $userBreakdown = [
            ['label' => 'Students', 'count' => $students, 'percent' => $studentPercent, 'color' => '#0057FF'],
            ['label' => 'Instructors', 'count' => 0, 'percent' => 0, 'color' => '#22C55E'],
            ['label' => 'Administrators', 'count' => $admins, 'percent' => $adminPercent, 'color' => '#8B5CF6'],
            ['label' => 'Others', 'count' => $others, 'percent' => $otherPercent, 'color' => '#F59E0B'],
        ];

        $openTicketCount = SupportTicket::whereIn('status', ['Open', 'In Progress'])->count();

        $enrollmentChart = $this->enrollmentChartData();

        return response()->json([
            'stats' => $stats,
            'top_courses' => $topCourses,
            'user_breakdown' => $userBreakdown,
            'total_users' => User::count(),
            'enrollment_chart' => $enrollmentChart,
            'recent_activities' => $this->recentActivities(),
            'tickets' => SupportTicket::query()->latest()->limit(10)->get()->map(fn (SupportTicket $t) => [
                'id' => '#'.$t->id,
                'subject' => $t->subject,
                'user' => $t->user_name,
                'priority' => $t->priority,
                'status' => $t->status,
                'date' => $t->created_at?->format('d M Y'),
            ]),
            'open_ticket_count' => $openTicketCount,
            'system_health' => [
                'server' => 'Operational',
                'database' => 'Operational',
                'backup' => 'Up to date',
                'storage_percent' => $this->storageUsagePercent(),
            ],
        ]);
    }

    private function statBlock(string $label, int $value, string $model, ?string $dateColumn = 'created_at', bool $invertTrend = false): array
    {
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $query = fn () => $model::query();
        if ($dateColumn === 'completed_at') {
            $thisPeriod = $query()->whereNotNull('completed_at')->where('completed_at', '>=', $thisMonthStart)->count();
            $lastPeriod = $query()->whereNotNull('completed_at')->whereBetween('completed_at', [$lastMonthStart, $lastMonthEnd])->count();
        } else {
            $thisPeriod = $query()->where($dateColumn ?? 'created_at', '>=', $thisMonthStart)->count();
            $lastPeriod = $query()->whereBetween($dateColumn ?? 'created_at', [$lastMonthStart, $lastMonthEnd])->count();
        }

        $trend = 0.0;
        if ($lastPeriod > 0) {
            $trend = round((($thisPeriod - $lastPeriod) / $lastPeriod) * 100, 1);
        } elseif ($thisPeriod > 0) {
            $trend = 100.0;
        }

        if ($invertTrend) {
            $trend = -$trend;
        }

        return [
            'label' => $label,
            'value' => $value,
            'trend' => $trend,
            'trendLabel' => 'from last month',
        ];
    }

    private function enrollmentChartData(): array
    {
        $months = collect(range(5, 0))->map(fn (int $i) => Carbon::now()->subMonths($i)->startOfMonth());

        return $months->map(function (Carbon $month) {
            $start = $month->copy();
            $end = $month->copy()->endOfMonth();

            $enrollments = Enrollment::whereBetween('created_at', [$start, $end])->count();
            $completions = Enrollment::whereBetween('completed_at', [$start, $end])->count();

            return [
                'month' => $start->format('M Y'),
                'enrollments' => $enrollments,
                'completions' => $completions,
            ];
        })->values()->all();
    }

    private function recentActivities(): array
    {
        $activities = [];

        User::latest()->limit(3)->get()->each(function (User $user) use (&$activities) {
            $activities[] = [
                'id' => 'user-'.$user->id,
                'text' => 'New user registered ('.$user->name.')',
                'time' => $user->created_at?->diffForHumans(),
                'type' => 'user',
                'sort' => $user->created_at?->timestamp ?? 0,
            ];
        });

        Course::latest()->limit(3)->get()->each(function (Course $course) use (&$activities) {
            $activities[] = [
                'id' => 'course-'.$course->id,
                'text' => 'Course updated ('.$course->title.')',
                'time' => $course->updated_at?->diffForHumans(),
                'type' => 'course',
                'sort' => $course->updated_at?->timestamp ?? 0,
            ];
        });

        Lesson::latest()->limit(2)->get()->each(function (Lesson $lesson) use (&$activities) {
            $activities[] = [
                'id' => 'lesson-'.$lesson->id,
                'text' => 'Lesson updated ('.$lesson->title.')',
                'time' => $lesson->updated_at?->diffForHumans(),
                'type' => 'lesson',
                'sort' => $lesson->updated_at?->timestamp ?? 0,
            ];
        });

        SupportTicket::latest()->limit(2)->get()->each(function (SupportTicket $ticket) use (&$activities) {
            $activities[] = [
                'id' => 'ticket-'.$ticket->id,
                'text' => 'New support ticket ('.$ticket->subject.' by '.$ticket->user_name.')',
                'time' => $ticket->created_at?->diffForHumans(),
                'type' => 'ticket',
                'sort' => $ticket->created_at?->timestamp ?? 0,
            ];
        });

        Enrollment::query()
            ->whereNotNull('completed_at')
            ->with(['user', 'course'])
            ->latest('completed_at')
            ->limit(2)
            ->get()
            ->each(function (Enrollment $enrollment) use (&$activities) {
                $activities[] = [
                    'id' => 'certificate-'.$enrollment->id,
                    'text' => 'Certificate issued ('.($enrollment->user?->name ?? 'Student').')',
                    'time' => $enrollment->completed_at?->diffForHumans(),
                    'type' => 'certificate',
                    'sort' => $enrollment->completed_at?->timestamp ?? 0,
                ];
            });

        return collect($activities)
            ->sortByDesc('sort')
            ->take(5)
            ->map(fn (array $item) => collect($item)->except('sort')->all())
            ->values()
            ->all();
    }

    private function storageUsagePercent(): int
    {
        $storagePath = storage_path('app/public');
        if (! is_dir($storagePath)) {
            return 0;
        }

        $size = 0;
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($storagePath, \FilesystemIterator::SKIP_DOTS)) as $file) {
            $size += $file->getSize();
        }

        // Assume 5GB quota for demo display
        return min(99, (int) round(($size / (5 * 1024 * 1024 * 1024)) * 100));
    }
}
