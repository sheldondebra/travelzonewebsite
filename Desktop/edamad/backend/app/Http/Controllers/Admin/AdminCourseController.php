<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminCourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $query = Course::query()
            ->withCount(['lessons', 'enrollments'])
            ->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('course_code', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('instructor', 'like', "%{$search}%");
            });
        }

        match ($request->string('status')->toString()) {
            'published' => $query->where('is_published', true),
            'draft' => $query->where('is_published', false),
            default => null,
        };

        if ($category = $request->string('category')->trim()->toString()) {
            $query->where('category', $category);
        }

        return response()->json($query->get());
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $course->load('lessons');

        $modules = $course->lessons
            ->groupBy('module_title')
            ->map(fn ($lessons, $title) => [
                'title' => $title ?: 'General',
                'lessons_count' => $lessons->count(),
            ])
            ->values();

        return response()->json([
            ...$course->toArray(),
            'modules' => $modules,
        ]);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'course_code' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:100'],
            'instructor' => ['nullable', 'string', 'max:255'],
            'difficulty' => ['nullable', 'string', 'max:50'],
            'duration_label' => ['nullable', 'string', 'max:50'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'full_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'thumbnail_url' => ['nullable', 'string', 'max:2048'],
            'banner_url' => ['nullable', 'string', 'max:2048'],
            'icon' => ['nullable', 'string', 'max:50'],
            'icon_bg' => ['nullable', 'string', 'max:20'],
            'learning_objectives' => ['nullable', 'array'],
            'learning_objectives.*' => ['string', 'max:500'],
            'is_published' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'visibility' => ['nullable', 'string', 'max:50'],
        ]);

        if (isset($validated['title']) && $validated['title'] !== $course->title) {
            $slugBase = Str::slug($validated['title']);
            $slug = $slugBase;
            $counter = 1;
            while (Course::query()->where('slug', $slug)->where('id', '!=', $course->id)->exists()) {
                $slug = $slugBase.'-'.$counter++;
            }
            $validated['slug'] = $slug;
        }

        $course->update($validated);

        return response()->json([
            'message' => "Course \"{$course->title}\" updated successfully.",
            'course' => $course->fresh()->loadCount(['lessons', 'enrollments']),
        ]);
    }

    public function togglePublish(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $course->update(['is_published' => ! $course->is_published]);

        $status = $course->is_published ? 'published' : 'unpublished';

        return response()->json([
            'message' => "Course \"{$course->title}\" {$status} successfully.",
            'course' => $course->fresh()->loadCount(['lessons', 'enrollments']),
        ]);
    }

    public function destroy(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $title = $course->title;
        $course->delete();

        return response()->json([
            'message' => "Course \"{$title}\" deleted successfully.",
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'course_code' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:100'],
            'instructor' => ['nullable', 'string', 'max:255'],
            'difficulty' => ['nullable', 'string', 'max:50'],
            'duration_label' => ['nullable', 'string', 'max:50'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'full_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'thumbnail_url' => ['nullable', 'string', 'max:2048'],
            'banner_url' => ['nullable', 'string', 'max:2048'],
            'icon' => ['nullable', 'string', 'max:50'],
            'icon_bg' => ['nullable', 'string', 'max:20'],
            'learning_objectives' => ['nullable', 'array'],
            'learning_objectives.*' => ['string', 'max:500'],
            'is_published' => ['boolean'],
            'is_active' => ['boolean'],
            'visibility' => ['nullable', 'string', 'max:50'],
            'lessons' => ['nullable', 'array'],
            'lessons.*.title' => ['required_with:lessons', 'string', 'max:255'],
            'lessons.*.module_title' => ['nullable', 'string', 'max:255'],
            'lessons.*.module_sort_order' => ['nullable', 'integer', 'min:0'],
            'lessons.*.lesson_type' => ['nullable', 'string', 'max:50'],
            'lessons.*.duration_seconds' => ['nullable', 'integer', 'min:0'],
            'lessons.*.content_url' => ['nullable', 'string', 'max:2048'],
            'lessons.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $course = DB::transaction(function () use ($validated, $request) {
            $slugBase = Str::slug($validated['title']);
            $slug = $slugBase;
            $counter = 1;
            while (Course::query()->where('slug', $slug)->exists()) {
                $slug = $slugBase.'-'.$counter++;
            }

            $course = Course::create([
                'title' => $validated['title'],
                'slug' => $slug,
                'course_code' => $validated['course_code'] ?? null,
                'category' => $validated['category'] ?? null,
                'instructor' => $validated['instructor'] ?? null,
                'difficulty' => $validated['difficulty'] ?? null,
                'duration_label' => $validated['duration_label'] ?? null,
                'short_description' => $validated['short_description'] ?? null,
                'full_description' => $validated['full_description'] ?? null,
                'description' => $validated['description']
                    ?? $validated['short_description']
                    ?? $validated['full_description']
                    ?? null,
                'price' => $validated['price'] ?? 0,
                'thumbnail_url' => $validated['thumbnail_url'] ?? null,
                'banner_url' => $validated['banner_url'] ?? null,
                'icon' => $validated['icon'] ?? 'book',
                'icon_bg' => $validated['icon_bg'] ?? '#EBF2FF',
                'learning_objectives' => $validated['learning_objectives'] ?? [],
                'is_published' => $validated['is_published'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'visibility' => $validated['visibility'] ?? 'public',
                'created_by' => $request->user()->id,
            ]);

            foreach ($validated['lessons'] ?? [] as $index => $lessonData) {
                Lesson::create([
                    'course_id' => $course->id,
                    'title' => $lessonData['title'],
                    'module_title' => $lessonData['module_title'] ?? null,
                    'module_sort_order' => $lessonData['module_sort_order'] ?? 0,
                    'lesson_type' => $lessonData['lesson_type'] ?? 'video',
                    'duration_seconds' => $lessonData['duration_seconds'] ?? 0,
                    'video_url' => ($lessonData['lesson_type'] ?? 'video') === 'video'
                        ? ($lessonData['content_url'] ?? null)
                        : null,
                    'content_url' => $lessonData['content_url'] ?? null,
                    'sort_order' => $lessonData['sort_order'] ?? $index,
                ]);
            }

            return $course->load('lessons');
        });

        return response()->json($course, 201);
    }
}
