<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminEnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $rows = Enrollment::query()
            ->with(['user:id,name,email', 'course:id,title'])
            ->latest('enrolled_at')
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'id' => $enrollment->id,
                'student' => $enrollment->user?->name ?? 'Unknown',
                'email' => $enrollment->user?->email ?? '',
                'course' => $enrollment->course?->title ?? 'Unknown',
                'progress' => $enrollment->progress_percent,
                'enrolled_at' => $enrollment->enrolled_at?->format('d M Y'),
                'completed_at' => $enrollment->completed_at?->format('d M Y'),
            ]);

        return response()->json($rows);
    }
}
