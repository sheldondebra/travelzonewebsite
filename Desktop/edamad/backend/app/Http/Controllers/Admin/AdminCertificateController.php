<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCertificateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $rows = Enrollment::query()
            ->with(['user:id,name,email', 'course:id,title'])
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'id' => $enrollment->id,
                'student' => $enrollment->user?->name ?? 'Unknown',
                'email' => $enrollment->user?->email ?? '',
                'course' => $enrollment->course?->title ?? 'Unknown',
                'issued_at' => $enrollment->completed_at?->format('d M Y'),
                'certificate_id' => 'CERT-'.str_pad((string) $enrollment->id, 5, '0', STR_PAD_LEFT),
            ]);

        return response()->json($rows);
    }
}
