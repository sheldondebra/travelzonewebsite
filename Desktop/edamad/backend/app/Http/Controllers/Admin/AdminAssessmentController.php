<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\PracticeTest;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminAssessmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $tests = PracticeTest::query()
            ->with('course:id,title')
            ->withCount('questions')
            ->latest()
            ->get()
            ->map(fn (PracticeTest $test) => [
                'id' => $test->id,
                'title' => $test->title,
                'slug' => $test->slug,
                'course' => $test->course?->title,
                'question_count' => $test->questions_count,
                'duration_minutes' => $test->duration_minutes,
                'is_published' => $test->is_published,
                'updated_at' => $test->updated_at?->toIso8601String(),
            ]);

        return response()->json($tests);
    }

    public function import(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'version' => ['required', 'string'],
            'subject' => ['nullable', 'string', 'max:255'],
            'practice_test_slug' => ['nullable', 'string', 'max:255'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.options' => ['required', 'array'],
            'questions.*.correct_answer' => ['required', 'string'],
            'questions.*.explanation' => ['nullable', 'string'],
        ]);

        $course = null;
        if (! empty($validated['course_id'])) {
            $course = Course::find($validated['course_id']);
        } elseif (! empty($validated['subject'])) {
            $course = Course::query()
                ->where('title', 'like', '%'.$validated['subject'].'%')
                ->orWhere('slug', Str::slug($validated['subject']))
                ->first();
        }

        if (! $course) {
            $course = Course::query()->first();
        }

        if (! $course) {
            return response()->json(['message' => 'No course found to attach questions. Create a course first.'], 422);
        }

        $test = null;
        if (! empty($validated['practice_test_slug'])) {
            $test = PracticeTest::query()->where('slug', $validated['practice_test_slug'])->first();
        }

        if (! $test) {
            $slug = Str::slug($validated['subject'] ?? 'imported-'.now()->format('Ymd-His'));
            $test = PracticeTest::create([
                'title' => $validated['subject'] ?? 'Imported Practice Test',
                'slug' => $slug,
                'description' => 'Imported via bulk upload',
                'icon' => 'clipboard',
                'course_id' => $course->id,
                'duration_minutes' => 60,
                'passing_score' => 70,
                'is_published' => true,
            ]);
        }

        $imported = 0;
        $startOrder = $test->questions()->count();

        foreach ($validated['questions'] as $index => $item) {
            $question = Question::create([
                'course_id' => $course->id,
                'question_text' => $item['question_text'],
                'options' => $item['options'],
                'correct_answer' => $item['correct_answer'],
                'explanation' => $item['explanation'] ?? null,
                'topic' => $validated['subject'] ?? null,
                'difficulty' => 'medium',
            ]);

            $test->questions()->attach($question->id, ['sort_order' => $startOrder + $index + 1]);
            $imported++;
        }

        $test->update(['question_count' => $test->questions()->count()]);

        return response()->json([
            'message' => "Imported {$imported} question(s) into {$test->title}.",
            'imported' => $imported,
            'practice_test' => [
                'id' => $test->id,
                'title' => $test->title,
                'slug' => $test->slug,
                'question_count' => $test->questions()->count(),
            ],
        ]);
    }
}
