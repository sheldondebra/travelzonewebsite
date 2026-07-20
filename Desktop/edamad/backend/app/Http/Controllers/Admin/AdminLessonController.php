<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLessonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $lessons = Lesson::query()
            ->with('course:id,title')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Lesson $lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'course' => $lesson->course?->title ?? 'Unknown',
                'module' => $lesson->module_title,
                'type' => $lesson->lesson_type ?? 'video',
                'status' => $lesson->publish_status ?? 'draft',
                'duration_seconds' => $lesson->duration_seconds,
                'updated_at' => $lesson->updated_at?->format('d M Y'),
            ]);

        return response()->json($lessons);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:255'],
            'video_title' => ['nullable', 'string', 'max:255'],
            'module_title' => ['nullable', 'string', 'max:255'],
            'lesson_number' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'lesson_thumbnail_url' => ['nullable', 'string', 'max:2048'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'access_type' => ['nullable', 'string', 'max:50'],
            'publish_status' => ['nullable', 'string', 'max:50'],
            'supplementary_files' => ['nullable', 'array'],
            'scheduled_at' => ['nullable', 'date'],
            'video_metadata' => ['nullable', 'array'],
            'publish_now' => ['boolean'],
        ]);

        $sortOrder = Lesson::query()
            ->where('course_id', $validated['course_id'])
            ->max('sort_order') + 1;

        $publishStatus = $validated['publish_status'] ?? 'draft';
        if ($validated['publish_now'] ?? false) {
            $publishStatus = 'published';
        }

        $lesson = Lesson::create([
            'course_id' => $validated['course_id'],
            'title' => $validated['title'],
            'video_title' => $validated['video_title'] ?? $validated['title'],
            'module_title' => $validated['module_title'] ?? null,
            'lesson_number' => $validated['lesson_number'] ?? null,
            'description' => $validated['description'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'content_url' => $validated['video_url'] ?? null,
            'lesson_type' => 'video',
            'lesson_thumbnail_url' => $validated['lesson_thumbnail_url'] ?? null,
            'duration_seconds' => $validated['duration_seconds'] ?? 0,
            'tags' => $validated['tags'] ?? [],
            'access_type' => $validated['access_type'] ?? 'premium',
            'publish_status' => $publishStatus,
            'supplementary_files' => $validated['supplementary_files'] ?? [],
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'video_metadata' => $validated['video_metadata'] ?? null,
            'sort_order' => $sortOrder,
        ]);

        return response()->json($lesson, 201);
    }
}
