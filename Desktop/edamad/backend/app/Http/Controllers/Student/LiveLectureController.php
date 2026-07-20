<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\LiveLecture;
use Illuminate\Http\JsonResponse;

class LiveLectureController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $lecture = LiveLecture::query()
            ->where('slug', $slug)
            ->with('messages')
            ->firstOrFail();

        $upcoming = LiveLecture::query()
            ->where('slug', '!=', $slug)
            ->orderBy('starts_at')
            ->limit(3)
            ->get();

        return response()->json([
            'lecture' => $lecture,
            'upcoming' => $upcoming,
        ]);
    }

    public function featured(): JsonResponse
    {
        $lecture = LiveLecture::query()
            ->where('is_live', true)
            ->with('messages')
            ->latest('starts_at')
            ->first();

        if (! $lecture) {
            $lecture = LiveLecture::query()->with('messages')->latest('starts_at')->firstOrFail();
        }

        $upcoming = LiveLecture::query()
            ->where('id', '!=', $lecture->id)
            ->orderBy('starts_at')
            ->limit(3)
            ->get();

        return response()->json([
            'lecture' => $lecture,
            'upcoming' => $upcoming,
        ]);
    }
}
