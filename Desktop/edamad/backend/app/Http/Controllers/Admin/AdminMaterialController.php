<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AdminMaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $materials = $this->collectMaterials();

        if ($search = $request->string('search')->trim()->toString()) {
            $needle = Str::lower($search);
            $materials = $materials->filter(function (array $row) use ($needle) {
                return Str::contains(Str::lower($row['name']), $needle)
                    || Str::contains(Str::lower($row['course']), $needle)
                    || Str::contains(Str::lower($row['lesson'] ?? ''), $needle);
            });
        }

        if ($type = $request->string('type')->trim()->toString()) {
            if ($type !== 'all') {
                $materials = $materials->filter(fn (array $row) => $row['type'] === $type);
            }
        }

        if ($course = $request->string('course')->trim()->toString()) {
            $materials = $materials->filter(fn (array $row) => $row['course'] === $course);
        }

        return response()->json($materials->values()->all());
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'lesson_id' => ['nullable', 'exists:lessons,id'],
            'kind' => ['required', 'in:video,slides,notes,document,thumbnail,banner,other'],
            'name' => ['nullable', 'string', 'max:255'],
            'file' => ['required', 'file', 'max:512000'],
        ]);

        $course = Course::findOrFail($validated['course_id']);
        $lesson = isset($validated['lesson_id'])
            ? Lesson::where('course_id', $course->id)->findOrFail($validated['lesson_id'])
            : null;

        $folder = match ($validated['kind']) {
            'thumbnail' => 'course-thumbnails',
            'banner' => 'course-banners',
            default => 'lesson-content',
        };

        $path = $request->file('file')->store($folder, 'public');
        $url = asset('storage/'.$path);
        $displayName = $validated['name'] ?? $request->file('file')->getClientOriginalName();

        if ($validated['kind'] === 'thumbnail') {
            $course->update(['thumbnail_url' => $url]);
        } elseif ($validated['kind'] === 'banner') {
            $course->update(['banner_url' => $url]);
        } elseif ($lesson) {
            if ($validated['kind'] === 'video') {
                $lesson->update([
                    'video_url' => $url,
                    'content_url' => $url,
                    'lesson_type' => 'video',
                ]);
            } else {
                $files = $lesson->supplementary_files ?? [];
                $supType = in_array($validated['kind'], ['slides', 'notes'], true)
                    ? $validated['kind']
                    : 'other';
                $files[] = [
                    'id' => 'sup-'.time(),
                    'type' => $supType,
                    'name' => $displayName,
                    'url' => $url,
                ];
                $lesson->update(['supplementary_files' => $files]);
            }
        } else {
            return response()->json([
                'message' => 'Select a lesson when uploading video or supplementary files.',
            ], 422);
        }

        return response()->json([
            'message' => "\"{$displayName}\" uploaded successfully.",
            'materials' => $this->collectMaterials()->values()->all(),
        ], 201);
    }

    public function destroy(Request $request, string $material): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        if (str_starts_with($material, 'course-')) {
            [, $courseId, $field] = explode('-', $material, 3);
            $course = Course::findOrFail((int) $courseId);
            if ($field === 'thumbnail') {
                $course->update(['thumbnail_url' => null]);
            } elseif ($field === 'banner') {
                $course->update(['banner_url' => null]);
            }
        } elseif (preg_match('/^lesson-(\d+)-video$/', $material, $matches)) {
            $lesson = Lesson::findOrFail((int) $matches[1]);
            $lesson->update(['video_url' => null, 'content_url' => null]);
        } elseif (preg_match('/^lesson-(\d+)-thumbnail$/', $material, $matches)) {
            $lesson = Lesson::findOrFail((int) $matches[1]);
            $lesson->update(['lesson_thumbnail_url' => null]);
        } elseif (preg_match('/^lesson-(\d+)-content$/', $material, $matches)) {
            $lesson = Lesson::findOrFail((int) $matches[1]);
            $lesson->update(['content_url' => null]);
        } elseif (preg_match('/^lesson-(\d+)-sup-(\d+)$/', $material, $matches)) {
            $lesson = Lesson::findOrFail((int) $matches[1]);
            $index = (int) $matches[2];
            $files = $lesson->supplementary_files ?? [];
            if (isset($files[$index])) {
                array_splice($files, $index, 1);
                $lesson->update(['supplementary_files' => array_values($files)]);
            }
        } else {
            return response()->json(['message' => 'Material not found.'], 404);
        }

        return response()->json(['message' => 'Material removed successfully.']);
    }

    private function collectMaterials(): Collection
    {
        $items = collect();

        Lesson::query()->with('course:id,title,slug')->orderByDesc('updated_at')->get()->each(function (Lesson $lesson) use ($items) {
            $courseTitle = $lesson->course?->title ?? 'Unknown';
            $courseSlug = $lesson->course?->slug;

            if ($lesson->video_url) {
                $items->push($this->materialRow(
                    "lesson-{$lesson->id}-video",
                    $lesson->video_title ?? $lesson->title,
                    'video',
                    $courseTitle,
                    $lesson->title,
                    $lesson->video_url,
                    $lesson->publish_status ?? 'draft',
                    $lesson->updated_at?->toIso8601String(),
                    $courseSlug,
                    $lesson->course_id,
                    $lesson->id,
                ));
            }

            if ($lesson->lesson_thumbnail_url) {
                $items->push($this->materialRow(
                    "lesson-{$lesson->id}-thumbnail",
                    'Lesson thumbnail',
                    'image',
                    $courseTitle,
                    $lesson->title,
                    $lesson->lesson_thumbnail_url,
                    $lesson->publish_status ?? 'draft',
                    $lesson->updated_at?->toIso8601String(),
                    $courseSlug,
                    $lesson->course_id,
                    $lesson->id,
                ));
            }

            if ($lesson->content_url && $lesson->content_url !== $lesson->video_url) {
                $items->push($this->materialRow(
                    "lesson-{$lesson->id}-content",
                    'Lesson content file',
                    'document',
                    $courseTitle,
                    $lesson->title,
                    $lesson->content_url,
                    $lesson->publish_status ?? 'draft',
                    $lesson->updated_at?->toIso8601String(),
                    $courseSlug,
                    $lesson->course_id,
                    $lesson->id,
                ));
            }

            foreach ($lesson->supplementary_files ?? [] as $index => $file) {
                $supType = $file['type'] ?? 'other';
                $items->push($this->materialRow(
                    "lesson-{$lesson->id}-sup-{$index}",
                    $file['name'] ?? 'Supplementary file',
                    $this->mapSupplementaryType($supType),
                    $courseTitle,
                    $lesson->title,
                    $file['url'] ?? '',
                    $lesson->publish_status ?? 'draft',
                    $lesson->updated_at?->toIso8601String(),
                    $courseSlug,
                    $lesson->course_id,
                    $lesson->id,
                ));
            }
        });

        Course::query()->orderBy('title')->get()->each(function (Course $course) use ($items) {
            if ($course->thumbnail_url) {
                $items->push($this->materialRow(
                    "course-{$course->id}-thumbnail",
                    'Course thumbnail',
                    'image',
                    $course->title,
                    null,
                    $course->thumbnail_url,
                    $course->is_published ? 'published' : 'draft',
                    $course->updated_at?->toIso8601String(),
                    $course->slug,
                    $course->id,
                    null,
                ));
            }

            if ($course->banner_url) {
                $items->push($this->materialRow(
                    "course-{$course->id}-banner",
                    'Course banner',
                    'image',
                    $course->title,
                    null,
                    $course->banner_url,
                    $course->is_published ? 'published' : 'draft',
                    $course->updated_at?->toIso8601String(),
                    $course->slug,
                    $course->id,
                    null,
                ));
            }
        });

        return $items->sortByDesc('updated_at')->values();
    }

    private function materialRow(
        string $id,
        string $name,
        string $type,
        string $course,
        ?string $lesson,
        string $url,
        string $status,
        ?string $updatedAt,
        ?string $courseSlug,
        int $courseId,
        ?int $lessonId,
    ): array {
        return [
            'id' => $id,
            'name' => $name,
            'type' => $type,
            'course' => $course,
            'course_id' => $courseId,
            'course_slug' => $courseSlug,
            'lesson' => $lesson,
            'lesson_id' => $lessonId,
            'url' => $url,
            'status' => $status,
            'updated_at' => $updatedAt,
        ];
    }

    private function mapSupplementaryType(string $type): string
    {
        return match ($type) {
            'slides' => 'slides',
            'notes' => 'notes',
            default => 'document',
        };
    }
}
