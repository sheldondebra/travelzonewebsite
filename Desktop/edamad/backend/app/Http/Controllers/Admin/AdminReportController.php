<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\SupportTicket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $enrollmentChart = collect(range(5, 0))->map(function (int $i) {
            $month = Carbon::now()->subMonths($i)->startOfMonth();
            $start = $month->copy();
            $end = $month->copy()->endOfMonth();

            return [
                'month' => $start->format('M Y'),
                'enrollments' => Enrollment::whereBetween('created_at', [$start, $end])->count(),
                'completions' => Enrollment::whereBetween('completed_at', [$start, $end])->count(),
            ];
        })->values()->all();

        $courseCompletion = Course::query()
            ->withCount('enrollments')
            ->withAvg('enrollments', 'progress_percent')
            ->orderByDesc('enrollments_count')
            ->limit(8)
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'enrollments' => $course->enrollments_count,
                'avg_progress' => (int) round($course->enrollments_avg_progress_percent ?? 0),
                'completion_rate' => (int) round(
                    Enrollment::where('course_id', $course->id)->whereNotNull('completed_at')->count()
                    / max($course->enrollments_count, 1) * 100,
                ),
            ]);

        $usersThisMonth = User::where('created_at', '>=', $thisMonthStart)->count();
        $usersLastMonth = User::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();
        $verifiedStudents = User::where('role', 'student')->whereNotNull('email_verified_at')->count();
        $unverifiedStudents = User::where('role', 'student')->whereNull('email_verified_at')->count();

        $paymentsTotal = Payment::query()->sum('amount');
        $paymentsThisMonth = Payment::query()->where('created_at', '>=', $thisMonthStart)->sum('amount');

        return response()->json([
            'summary' => [
                'total_users' => User::count(),
                'total_enrollments' => Enrollment::count(),
                'completed_enrollments' => Enrollment::whereNotNull('completed_at')->count(),
                'open_tickets' => SupportTicket::whereIn('status', ['Open', 'In Progress'])->count(),
                'total_revenue' => (float) $paymentsTotal,
                'revenue_this_month' => (float) $paymentsThisMonth,
            ],
            'user_growth' => [
                'this_month' => $usersThisMonth,
                'last_month' => $usersLastMonth,
                'verified_students' => $verifiedStudents,
                'unverified_students' => $unverifiedStudents,
            ],
            'enrollment_chart' => $enrollmentChart,
            'course_completion' => $courseCompletion,
        ]);
    }
}
