<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\PracticeTest;
use App\Models\Question;
use App\Models\TestAttempt;
use App\Services\PracticeStatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PracticeController extends Controller
{
    public function __construct(private PracticeStatsService $stats) {}

    public function subjects(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;

        $courses = Course::query()
            ->where('is_published', true)
            ->whereHas('practiceTests', fn ($q) => $q->where('is_published', true))
            ->withCount(['practiceTests as tests_count' => fn ($q) => $q->where('is_published', true)])
            ->get()
            ->map(function (Course $course) use ($userId) {
                $questionCount = Question::query()
                    ->where('course_id', $course->id)
                    ->count();

                $performance = $this->stats->coursePerformance($course->id, $userId);

                return [
                    'slug' => $course->slug,
                    'title' => $course->title,
                    'description' => $course->description,
                    'icon' => $course->icon,
                    'icon_bg' => $course->icon_bg,
                    'tests_count' => $course->tests_count,
                    'total_questions' => $questionCount,
                    'mastery_pct' => $performance['mastery_pct'],
                ];
            });

        return response()->json($courses);
    }

    public function subject(Request $request, string $slug): JsonResponse
    {
        $userId = $request->user()?->id;

        $course = Course::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with([
                'lessons' => fn ($q) => $q->orderBy('sort_order'),
                'practiceTests' => fn ($q) => $q->where('is_published', true)->orderBy('id'),
            ])
            ->firstOrFail();

        $totalQuestions = Question::query()->where('course_id', $course->id)->count();
        $performance = $this->stats->coursePerformance($course->id, $userId);
        $topics = $this->stats->topicProgress($course->id, $userId);

        return response()->json([
            'course' => $course,
            'stats' => [
                'total_questions' => $totalQuestions,
                'total_tests' => $course->practiceTests->count(),
                'mastery_pct' => $performance['mastery_pct'],
            ],
            'performance' => $performance,
            'tests' => $course->practiceTests,
            'topics' => $topics,
            'lessons' => $course->lessons,
        ]);
    }

    public function test(string $slug): JsonResponse
    {
        $test = PracticeTest::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with([
                'course',
                'questions' => fn ($q) => $q->orderBy('practice_test_question.sort_order'),
            ])
            ->firstOrFail();

        return response()->json([
            'test' => $test->only([
                'id', 'title', 'slug', 'description', 'icon',
                'duration_minutes', 'question_count', 'passing_score', 'course_id',
            ]),
            'course' => $test->course?->only(['id', 'title', 'slug', 'icon', 'icon_bg']),
            'questions' => $test->questions->map(fn (Question $q) => [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'options' => $q->options,
                'topic' => $q->topic,
            ]),
        ]);
    }

    public function checkAnswer(Request $request, string $slug, int $questionId): JsonResponse
    {
        $validated = $request->validate([
            'selected' => ['required', 'string', 'max:1'],
        ]);

        $test = PracticeTest::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $question = $test->questions()
            ->where('questions.id', $questionId)
            ->firstOrFail();

        $isCorrect = $validated['selected'] === $question->correct_answer;

        return response()->json([
            'question_id' => $question->id,
            'is_correct' => $isCorrect,
            'correct_answer' => $question->correct_answer,
            'explanation' => $question->explanation,
            'reference' => $question->reference,
        ]);
    }

    public function submit(Request $request, string $slug): JsonResponse
    {
        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.selected' => ['nullable', 'string'],
            'time_taken_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $test = PracticeTest::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with(['questions', 'course'])
            ->firstOrFail();

        $timeTaken = $validated['time_taken_seconds'] ?? 0;
        $payload = $this->stats->buildSubmitResult($test, $validated['answers'], $timeTaken);

        if ($request->user()) {
            $attempt = $test->attempts()->create([
                'user_id' => $request->user()->id,
                'score' => $payload['score_pct'],
                'total_questions' => $payload['total_questions'],
                'answers' => $validated['answers'],
                'time_taken_seconds' => $timeTaken,
                'started_at' => now()->subSeconds($timeTaken),
                'completed_at' => now(),
            ]);

            $payload['attempt_id'] = $attempt->id;
        }

        return response()->json($payload);
    }

    public function latestResult(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Authentication required.');

        $test = PracticeTest::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with(['questions', 'course'])
            ->firstOrFail();

        $attempt = TestAttempt::query()
            ->where('user_id', $user->id)
            ->where('practice_test_id', $test->id)
            ->latest('completed_at')
            ->first();

        abort_unless($attempt, 404, 'No completed attempt found for this test.');

        $payload = $this->stats->buildSubmitResult(
            $test,
            $attempt->answers ?? [],
            (int) ($attempt->time_taken_seconds ?? 0),
        );

        $payload['attempt_id'] = $attempt->id;

        return response()->json($payload);
    }

    public function reviewQuestions(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();

        $test = PracticeTest::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with([
                'course',
                'questions' => fn ($q) => $q->orderBy('practice_test_question.sort_order'),
            ])
            ->firstOrFail();

        if (! $user) {
            return response()->json([
                'test' => $test->only([
                    'id', 'title', 'slug', 'description', 'icon',
                    'duration_minutes', 'question_count', 'passing_score', 'course_id',
                ]),
                'course' => $test->course?->only(['id', 'title', 'slug', 'icon', 'icon_bg']),
                'questions' => $test->questions->map(fn (Question $q) => [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'options' => $q->options,
                    'correct_answer' => $q->correct_answer,
                    'explanation' => $q->explanation,
                    'reference' => $q->reference,
                    'topic' => $q->topic,
                ]),
            ]);
        }

        $attempt = TestAttempt::query()
            ->where('user_id', $user->id)
            ->where('practice_test_id', $test->id)
            ->latest('completed_at')
            ->first();

        abort_unless($attempt, 404, 'Complete the test before reviewing answers.');

        return response()->json([
            'test' => $test->only([
                'id', 'title', 'slug', 'description', 'icon',
                'duration_minutes', 'question_count', 'passing_score', 'course_id',
            ]),
            'course' => $test->course?->only(['id', 'title', 'slug', 'icon', 'icon_bg']),
            'questions' => $test->questions->map(fn (Question $q) => [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'options' => $q->options,
                'correct_answer' => $q->correct_answer,
                'explanation' => $q->explanation,
                'reference' => $q->reference,
                'topic' => $q->topic,
            ]),
        ]);
    }
}
