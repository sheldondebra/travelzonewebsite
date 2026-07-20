<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $announcements = Announcement::query()
            ->where('status', 'published')
            ->where(function ($query) use ($user) {
                $query->where('audience', 'all');

                if ($user->role === 'student') {
                    $query->orWhere('audience', 'students');
                }

                if ($user->isAdmin()) {
                    $query->orWhere('audience', 'admins');
                }
            })
            ->orderByDesc('published_at')
            ->limit(20)
            ->get()
            ->map(fn (Announcement $announcement) => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'body' => $announcement->body,
                'audience' => $announcement->audience,
                'published_at' => $announcement->published_at?->toIso8601String(),
            ]);

        return response()->json($announcements);
    }
}
