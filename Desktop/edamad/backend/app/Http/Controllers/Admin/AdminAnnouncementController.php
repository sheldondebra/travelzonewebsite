<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\User;
use App\Notifications\AnnouncementPublishedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AdminAnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $query = Announcement::query()->with('creator:id,name')->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->trim()->toString()) {
            if (in_array($status, ['draft', 'published'], true)) {
                $query->where('status', $status);
            }
        }

        return response()->json($query->get()->map(fn (Announcement $a) => $this->format($a)));
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'audience' => ['required', Rule::in(['all', 'students', 'admins'])],
        ]);

        $announcement = Announcement::create([
            ...$validated,
            'status' => 'draft',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Announcement saved as draft.',
            'announcement' => $this->format($announcement->load('creator:id,name')),
        ], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'body' => ['sometimes', 'string', 'max:5000'],
            'audience' => ['sometimes', Rule::in(['all', 'students', 'admins'])],
        ]);

        if ($announcement->status === 'published') {
            unset($validated['audience']);
        }

        $announcement->update($validated);

        return response()->json([
            'message' => 'Announcement updated.',
            'announcement' => $this->format($announcement->fresh()->load('creator:id,name')),
        ]);
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $title = $announcement->title;
        $announcement->delete();

        return response()->json(['message' => "Announcement \"{$title}\" deleted."]);
    }

    public function publish(Request $request, Announcement $announcement): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        app(\App\Services\SettingsService::class)->applyMailConfig();

        $resend = $request->boolean('resend');

        if ($announcement->status === 'published' && ! $resend) {
            return response()->json([
                'message' => 'Announcement is already published. Use resend to email users again.',
            ], 422);
        }

        $recipients = $this->recipientsForAudience($announcement->audience);
        $sent = 0;

        foreach ($recipients as $user) {
            try {
                $user->notify(new AnnouncementPublishedNotification($announcement));
                $sent++;
            } catch (\Throwable $e) {
                Log::warning('Failed to send announcement email', [
                    'announcement_id' => $announcement->id,
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $announcement->update([
            'status' => 'published',
            'published_at' => $announcement->published_at ?? now(),
            'emailed_at' => now(),
            'emails_sent_count' => ($announcement->emails_sent_count ?? 0) + $sent,
        ]);

        return response()->json([
            'message' => "Published and sent to {$sent} email(s).",
            'announcement' => $this->format($announcement->fresh()->load('creator:id,name')),
            'emails_sent' => $sent,
        ]);
    }

    private function recipientsForAudience(string $audience)
    {
        $query = User::query()->whereNotNull('email');

        return match ($audience) {
            'students' => $query->where('role', 'student')->get(),
            'admins' => $query->where('role', 'admin')->get(),
            default => $query->get(),
        };
    }

    private function format(Announcement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'body' => $announcement->body,
            'audience' => $announcement->audience,
            'status' => $announcement->status,
            'published_at' => $announcement->published_at?->toIso8601String(),
            'emailed_at' => $announcement->emailed_at?->toIso8601String(),
            'emails_sent_count' => $announcement->emails_sent_count,
            'created_by_name' => $announcement->creator?->name,
            'created_at' => $announcement->created_at?->toIso8601String(),
            'updated_at' => $announcement->updated_at?->toIso8601String(),
        ];
    }
}
