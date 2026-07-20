<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\SupportTicket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ActivityLogService
{
    /** @return list<array<string, mixed>> */
    public function collect(?string $type = null, ?string $search = null, int $limit = 100): array
    {
        $events = collect();

        if (! $type || $type === 'user') {
            User::query()->latest()->limit(30)->get()->each(function (User $user) use ($events) {
                $events->push($this->event(
                    'user-'.$user->id,
                    'user',
                    'info',
                    'User registered',
                    $user->name,
                    $user->email,
                    $user->created_at,
                ));
            });
        }

        if (! $type || $type === 'course') {
            Course::query()->latest('updated_at')->limit(30)->get()->each(function (Course $course) use ($events) {
                $created = $course->created_at?->eq($course->updated_at);
                $events->push($this->event(
                    'course-'.$course->id.'-'.($course->updated_at?->timestamp ?? 0),
                    'course',
                    'info',
                    $created ? 'Course created' : 'Course updated',
                    $course->title,
                    null,
                    $course->updated_at,
                ));
            });
        }

        if (! $type || $type === 'lesson') {
            Lesson::query()->latest('updated_at')->limit(25)->get()->each(function (Lesson $lesson) use ($events) {
                $events->push($this->event(
                    'lesson-'.$lesson->id.'-'.($lesson->updated_at?->timestamp ?? 0),
                    'lesson',
                    'info',
                    'Lesson updated',
                    $lesson->title,
                    null,
                    $lesson->updated_at,
                ));
            });
        }

        if (! $type || $type === 'enrollment') {
            Enrollment::query()->with(['user', 'course'])->latest()->limit(25)->get()->each(function (Enrollment $enrollment) use ($events) {
                $events->push($this->event(
                    'enrollment-'.$enrollment->id,
                    'enrollment',
                    'info',
                    'New enrollment',
                    ($enrollment->user?->name ?? 'Student').' → '.($enrollment->course?->title ?? 'Course'),
                    $enrollment->user?->email,
                    $enrollment->created_at,
                ));
            });

            Enrollment::query()
                ->whereNotNull('completed_at')
                ->with(['user', 'course'])
                ->latest('completed_at')
                ->limit(15)
                ->get()
                ->each(function (Enrollment $enrollment) use ($events) {
                    $events->push($this->event(
                        'completion-'.$enrollment->id,
                        'enrollment',
                        'success',
                        'Course completed',
                        ($enrollment->user?->name ?? 'Student').' completed '.($enrollment->course?->title ?? 'course'),
                        $enrollment->user?->email,
                        $enrollment->completed_at,
                    ));
                });
        }

        if (! $type || $type === 'ticket') {
            SupportTicket::query()->latest()->limit(25)->get()->each(function (SupportTicket $ticket) use ($events) {
                $events->push($this->event(
                    'ticket-'.$ticket->id,
                    'ticket',
                    $ticket->priority === 'High' ? 'warning' : 'info',
                    'Support ticket opened',
                    $ticket->subject,
                    $ticket->user_name,
                    $ticket->created_at,
                    ['status' => $ticket->status, 'priority' => $ticket->priority],
                ));
            });
        }

        if (! $type || $type === 'announcement') {
            Announcement::query()->with('creator:id,name')->latest()->limit(20)->get()->each(function (Announcement $announcement) use ($events) {
                $events->push($this->event(
                    'announcement-'.$announcement->id,
                    'announcement',
                    $announcement->status === 'published' ? 'success' : 'info',
                    $announcement->status === 'published' ? 'Announcement published' : 'Announcement saved',
                    $announcement->title,
                    $announcement->creator?->name,
                    $announcement->published_at ?? $announcement->updated_at,
                    ['audience' => $announcement->audience, 'emails_sent' => $announcement->emails_sent_count],
                ));
            });
        }

        $sorted = $events
            ->filter(fn (array $event) => $event['occurred_at'] !== null)
            ->sortByDesc(fn (array $event) => $event['occurred_at'])
            ->values();

        if ($search) {
            $needle = strtolower($search);
            $sorted = $sorted->filter(function (array $event) use ($needle) {
                return str_contains(strtolower($event['message']), $needle)
                    || str_contains(strtolower($event['subject']), $needle)
                    || str_contains(strtolower((string) $event['actor']), $needle);
            })->values();
        }

        return $sorted->take($limit)->map(function (array $event) {
            $at = Carbon::parse($event['occurred_at']);

            return [
                ...$event,
                'time_ago' => $at->diffForHumans(),
                'occurred_at' => $at->toIso8601String(),
            ];
        })->all();
    }

    /** @param array<string, mixed> $meta */
    private function event(
        string $id,
        string $type,
        string $level,
        string $message,
        string $subject,
        ?string $actor,
        ?Carbon $at,
        array $meta = [],
    ): array {
        return [
            'id' => $id,
            'type' => $type,
            'level' => $level,
            'message' => $message,
            'subject' => $subject,
            'actor' => $actor,
            'occurred_at' => $at?->toIso8601String(),
            'meta' => $meta,
        ];
    }
}
