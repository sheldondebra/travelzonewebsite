<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $tickets = SupportTicket::query()
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn (SupportTicket $ticket) => $this->format($ticket));

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'category' => ['nullable', Rule::in(['account', 'courses', 'payments', 'certificates', 'general'])],
            'priority' => ['nullable', Rule::in(['Low', 'Medium', 'High'])],
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'category' => $validated['category'] ?? 'general',
            'priority' => $validated['priority'] ?? 'Medium',
            'status' => 'Open',
        ]);

        return response()->json([
            'message' => 'Support ticket submitted. Our team will respond within 24 hours.',
            'ticket' => $this->format($ticket),
        ], 201);
    }

    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && $ticket->user_id === $user->id, 403);

        return response()->json($this->format($ticket, true));
    }

    private function format(SupportTicket $ticket, bool $detailed = false): array
    {
        $data = [
            'id' => $ticket->id,
            'number' => $ticket->ticketNumber(),
            'subject' => $ticket->subject,
            'message' => $ticket->message,
            'category' => $ticket->category,
            'priority' => $ticket->priority,
            'status' => $ticket->status,
            'created_at' => $ticket->created_at?->toIso8601String(),
            'updated_at' => $ticket->updated_at?->toIso8601String(),
        ];

        if ($detailed) {
            $data['admin_notes'] = $ticket->admin_notes;
        }

        return $data;
    }
}
