<?php

namespace App\Services;

use App\Models\Course;
use App\Models\PracticeTest;
use App\Models\Question;
use App\Models\TestAttempt;
use Illuminate\Support\Collection;

class PracticeStatsService
{
    /** @return array{mastery_pct: int, correct: int, incorrect: int, unattempted: int} */
    public function coursePerformance(int $courseId, ?int $userId): array
    {
        $empty = ['mastery_pct' => 0, 'correct' => 0, 'incorrect' => 0, 'unattempted' => 0];

        if (! $userId) {
            return $empty;
        }

        $testIds = PracticeTest::query()
            ->where('course_id', $courseId)
            ->where('is_published', true)
            ->pluck('id');

        if ($testIds->isEmpty()) {
            return $empty;
        }

        $latestAttempts = TestAttempt::query()
            ->where('user_id', $userId)
            ->whereIn('practice_test_id', $testIds)
            ->orderByDesc('completed_at')
            ->get()
            ->unique('practice_test_id');

        if ($latestAttempts->isEmpty()) {
            return $empty;
        }

        $correct = 0;
        $incorrect = 0;
        $unattempted = 0;

        foreach ($latestAttempts as $attempt) {
            $test = PracticeTest::query()
                ->with(['questions' => fn ($q) => $q->orderBy('practice_test_question.sort_order')])
                ->find($attempt->practice_test_id);

            if (! $test) {
                continue;
            }

            $questions = $test->questions->keyBy('id');
            $answers = collect($attempt->answers ?? []);

            foreach ($questions as $question) {
                $selected = $answers->firstWhere('question_id', $question->id)['selected'] ?? null;

                if (! $selected) {
                    $unattempted++;
                } elseif ($selected === $question->correct_answer) {
                    $correct++;
                } else {
                    $incorrect++;
                }
            }
        }

        $masteryPct = (int) round($latestAttempts->avg('score'));

        return [
            'mastery_pct' => $masteryPct,
            'correct' => $correct,
            'incorrect' => $incorrect,
            'unattempted' => $unattempted,
        ];
    }

    /** @return Collection<int, array{name: string, progress_pct: int, question_count: int}> */
    public function topicProgress(int $courseId, ?int $userId): Collection
    {
        $topics = Question::query()
            ->where('course_id', $courseId)
            ->whereNotNull('topic')
            ->select('topic')
            ->selectRaw('count(*) as question_count')
            ->groupBy('topic')
            ->get();

        if (! $userId) {
            return $topics->map(fn ($row) => [
                'name' => $row->topic,
                'progress_pct' => 0,
                'question_count' => (int) $row->question_count,
            ]);
        }

        $questionStats = $this->questionOutcomeMap($courseId, $userId);

        return $topics->map(function ($row) use ($questionStats) {
            $topicQuestions = Question::query()
                ->where('topic', $row->topic)
                ->pluck('id');

            $correct = 0;
            $total = $topicQuestions->count();

            foreach ($topicQuestions as $questionId) {
                if (($questionStats[$questionId] ?? null) === true) {
                    $correct++;
                }
            }

            return [
                'name' => $row->topic,
                'progress_pct' => $total > 0 ? (int) round(($correct / $total) * 100) : 0,
                'question_count' => (int) $row->question_count,
            ];
        });
    }

    /** @return array<int, bool|null> question_id => correct|null if unanswered */
    private function questionOutcomeMap(int $courseId, int $userId): array
    {
        $outcomes = [];
        $testIds = PracticeTest::query()
            ->where('course_id', $courseId)
            ->where('is_published', true)
            ->pluck('id');

        $latestAttempts = TestAttempt::query()
            ->where('user_id', $userId)
            ->whereIn('practice_test_id', $testIds)
            ->orderByDesc('completed_at')
            ->get()
            ->unique('practice_test_id');

        foreach ($latestAttempts as $attempt) {
            $test = PracticeTest::query()
                ->with('questions')
                ->find($attempt->practice_test_id);

            if (! $test) {
                continue;
            }

            $questions = $test->questions->keyBy('id');
            $answers = collect($attempt->answers ?? []);

            foreach ($answers as $answer) {
                $question = $questions->get($answer['question_id'] ?? null);
                if (! $question || ! ($answer['selected'] ?? null)) {
                    continue;
                }

                $outcomes[$question->id] = $answer['selected'] === $question->correct_answer;
            }
        }

        return $outcomes;
    }

    /** @return array<string, mixed>|null */
    public function buildSubmitResult(PracticeTest $test, array $validatedAnswers, int $timeTakenSeconds): array
    {
        $questions = $test->questions->keyBy('id');
        $correct = 0;
        $incorrect = 0;
        $results = [];

        foreach ($validatedAnswers as $answer) {
            $question = $questions->get($answer['question_id']);
            if (! $question) {
                continue;
            }

            $isCorrect = ($answer['selected'] ?? null) === $question->correct_answer;
            if ($isCorrect) {
                $correct++;
            } elseif ($answer['selected']) {
                $incorrect++;
            }

            $results[] = [
                'question_id' => $question->id,
                'selected' => $answer['selected'] ?? null,
                'correct_answer' => $question->correct_answer,
                'is_correct' => $isCorrect,
                'topic' => $question->topic,
            ];
        }

        $total = $questions->count();
        $scorePct = $total > 0 ? (int) round(($correct / $total) * 100) : 0;

        $sectionPerformance = collect($results)
            ->filter(fn ($r) => $r['topic'])
            ->groupBy('topic')
            ->map(function ($items, $topic) {
                $topicTotal = $items->count();
                $topicCorrect = $items->where('is_correct', true)->count();

                return [
                    'name' => $topic,
                    'correct' => $topicCorrect,
                    'total' => $topicTotal,
                    'score_pct' => $topicTotal > 0 ? (int) round(($topicCorrect / $topicTotal) * 100) : 0,
                ];
            })
            ->values();

        return [
            'test' => $test->only(['id', 'title', 'slug', 'passing_score']),
            'course' => $test->course?->only(['title', 'slug']),
            'total_questions' => $total,
            'correct' => $correct,
            'incorrect' => $incorrect,
            'unanswered' => $total - $correct - $incorrect,
            'score_pct' => $scorePct,
            'passed' => $scorePct >= $test->passing_score,
            'time_taken_seconds' => $timeTakenSeconds,
            'results' => $results,
            'section_performance' => $sectionPerformance,
        ];
    }
}
