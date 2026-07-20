<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MyCoursesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $rows = Enrollment::query()
                ->where('user_id', $user->id)
                ->with(['course' => fn ($q) => $q->withCount('lessons')])
                ->latest('enrolled_at')
                ->get()
                ->filter(fn (Enrollment $enrollment) => $enrollment->course !== null)
                ->map(fn (Enrollment $enrollment) => $this->formatCourse($enrollment->course, (int) $enrollment->progress_percent));

            return response()->json($rows->values());
        }

        $courses = Course::query()
            ->where('is_published', true)
            ->withCount('lessons')
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course) => $this->formatCourse($course, $this->demoProgress($course->slug)));

        return response()->json($courses);
    }

    /** @return array<string, mixed> */
    private function formatCourse(Course $course, int $progressPercent): array
    {
        return [
            'id' => $course->id,
            'slug' => $course->slug,
            'title' => $course->title,
            'description' => $course->description,
            'icon' => $course->icon,
            'icon_bg' => $course->icon_bg,
            'lessons_count' => (int) $course->lessons_count,
            'progress_percent' => $progressPercent,
        ];
    }

    private function demoProgress(string $slug): int
    {
        return match ($slug) {
            'pharmacology' => 75,
            'adult-medical-surgical-nursing' => 60,
            'paediatric-nursing' => 65,
            'mental-health-nursing' => 68,
            'advanced-nursing' => 72,
            'human-anatomy-and-physiology' => 70,
            'obstetrics-nursing' => 70,
            default => 0,
        };
    }
}
