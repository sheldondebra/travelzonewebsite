<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseContentController extends Controller
{
    public function show(Request $request, string $slug): JsonResponse
    {
        $course = Course::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with(['lessons' => fn ($q) => $q->orderBy('sort_order')])
            ->firstOrFail();

        $lessonOrder = max(1, (int) $request->query('lesson', 1));
        $totalLessons = $course->lessons->count();
        $lessonOrder = min($lessonOrder, max(1, $totalLessons));

        $currentLesson = $course->lessons->firstWhere('sort_order', $lessonOrder)
            ?? $course->lessons->first();

        $user = $request->user();
        $progressByLesson = $user
            ? $this->userProgressMap($user->id, $course->lessons->pluck('id'))
            : $this->demoProgressMap($course->lessons, $slug);

        $lessonsPayload = $course->lessons->map(function ($lesson) use ($progressByLesson, $currentLesson) {
            $progress = $progressByLesson[$lesson->id] ?? ['is_completed' => false, 'watch_seconds' => 0];

            return [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'duration_seconds' => $lesson->duration_seconds,
                'sort_order' => $lesson->sort_order,
                'is_completed' => (bool) $progress['is_completed'],
                'watch_seconds' => (int) $progress['watch_seconds'],
                'is_active' => $currentLesson && $lesson->id === $currentLesson->id,
            ];
        });

        $completedCount = $lessonsPayload->where('is_completed', true)->count();
        $progressPercent = $totalLessons > 0
            ? (int) round(($completedCount / $totalLessons) * 100)
            : 0;

        if (! $user) {
            $progressPercent = match ($slug) {
                'pharmacology' => 75,
                'adult-medical-surgical-nursing' => 60,
                'paediatric-nursing' => 65,
                'mental-health-nursing' => 68,
                'advanced-nursing' => 72,
                'human-anatomy-and-physiology' => 70,
                'obstetrics-nursing' => 70,
                default => $progressPercent,
            };
        } elseif ($user) {
            $enrollment = $course->enrollments()->where('user_id', $user->id)->first();
            if ($enrollment?->progress_percent) {
                $progressPercent = (int) $enrollment->progress_percent;
            }
        }

        $currentIndex = $currentLesson ? $currentLesson->sort_order : 1;
        $currentProgress = $currentLesson
            ? ($progressByLesson[$currentLesson->id] ?? ['is_completed' => false, 'watch_seconds' => 0])
            : ['is_completed' => false, 'watch_seconds' => 0];

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'description' => $course->description,
                'icon' => $course->icon,
                'icon_bg' => $course->icon_bg,
                'outline_url' => $course->outline_url,
            ],
            'progress_percent' => $progressPercent,
            'total_lessons' => $totalLessons,
            'current_lesson' => $currentLesson ? [
                'id' => $currentLesson->id,
                'title' => $currentLesson->title,
                'description' => $currentLesson->description,
                'duration_seconds' => $currentLesson->duration_seconds,
                'sort_order' => $currentLesson->sort_order,
                'is_completed' => (bool) $currentProgress['is_completed'],
                'watch_seconds' => (int) $currentProgress['watch_seconds'],
                'video_url' => $currentLesson->video_url,
                'lesson_thumbnail_url' => $currentLesson->lesson_thumbnail_url,
                'supplementary_files' => $currentLesson->supplementary_files ?? [],
            ] : null,
            'lessons' => $lessonsPayload,
            'prev_lesson_order' => $currentIndex > 1 ? $currentIndex - 1 : null,
            'next_lesson_order' => $currentIndex < $totalLessons ? $currentIndex + 1 : null,
        ]);
    }

    /** @return array<int, array{is_completed: bool, watch_seconds: int}> */
    private function userProgressMap(int $userId, $lessonIds): array
    {
        return LessonProgress::query()
            ->where('user_id', $userId)
            ->whereIn('lesson_id', $lessonIds)
            ->get()
            ->keyBy('lesson_id')
            ->map(fn ($row) => [
                'is_completed' => $row->is_completed,
                'watch_seconds' => $row->watch_seconds,
            ])
            ->all();
    }

    /** @return array<int, array{is_completed: bool, watch_seconds: int}> */
    private function demoProgressMap($lessons, string $slug): array
    {
        $config = match ($slug) {
            'pharmacology' => ['completed_through' => 3, 'current_watch' => 135],
            'adult-medical-surgical-nursing' => ['completed_through' => 6, 'current_watch' => 192],
            'paediatric-nursing' => ['completed_through' => 6, 'current_watch' => 138],
            'mental-health-nursing' => ['completed_through' => 6, 'current_watch' => 150],
            'advanced-nursing' => ['completed_through' => 6, 'current_watch' => 108],
            'human-anatomy-and-physiology' => ['completed_through' => 6, 'current_watch' => 155],
            'obstetrics-nursing' => ['completed_through' => 6, 'current_watch' => 155],
            default => ['completed_through' => 0, 'current_watch' => 0],
        };

        $map = [];
        foreach ($lessons as $lesson) {
            $order = $lesson->sort_order;
            $completed = $order <= $config['completed_through'];
            $watchSeconds = match (true) {
                $order === 1 => $config['current_watch'],
                $completed => $lesson->duration_seconds,
                default => 0,
            };

            $map[$lesson->id] = [
                'is_completed' => $completed,
                'watch_seconds' => $watchSeconds,
            ];
        }

        return $map;
    }
}
