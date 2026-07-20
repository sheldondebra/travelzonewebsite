<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminSupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $query = SupportTicket::query()->with('user:id,name,email')->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('subject', 'like', "%{$search}%")
                    ->orWhere('user_name', 'like', "%{$search}%")
                    ->orWhere('user_email', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->trim()->toString()) {
            if (in_array($status, ['Open', 'In Progress', 'Resolved'], true)) {
                $query->where('status', $status);
            }
        }

        if ($priority = $request->string('priority')->trim()->toString()) {
            if (in_array($priority, ['Low', 'Medium', 'High'], true)) {
                $query->where('priority', $priority);
            }
        }

        return response()->json($query->get()->map(fn (SupportTicket $ticket) => $this->format($ticket)));
    }

    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $ticket->load('user:id,name,email');

        return response()->json($this->format($ticket, true));
    }

    public function update(Request $request, SupportTicket $ticket): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['Open', 'In Progress', 'Resolved'])],
            'priority' => ['sometimes', Rule::in(['Low', 'Medium', 'High'])],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $ticket->update($validated);

        return response()->json([
            'message' => 'Ticket updated.',
            'ticket' => $this->format($ticket->fresh()->load('user:id,name,email'), true),
        ]);
    }

    public function destroy(Request $request, SupportTicket $ticket): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $label = $ticket->ticketNumber();
        $ticket->delete();

        return response()->json(['message' => "Ticket {$label} deleted."]);
    }

    private function format(SupportTicket $ticket, bool $detailed = false): array
    {
        $data = [
            'id' => $ticket->ticketNumber(),
            'ticket_id' => $ticket->id,
            'subject' => $ticket->subject,
            'message' => $ticket->message,
            'category' => $ticket->category,
            'user' => $ticket->user_name,
            'email' => $ticket->user_email ?? $ticket->user?->email,
            'priority' => $ticket->priority,
            'status' => $ticket->status,
            'date' => $ticket->created_at?->format('d M Y'),
            'created_at' => $ticket->created_at?->toIso8601String(),
            'updated_at' => $ticket->updated_at?->toIso8601String(),
        ];

        if ($detailed) {
            $data['admin_notes'] = $ticket->admin_notes;
            $data['user_id'] = $ticket->user_id;
        }

        return $data;
    }
}
