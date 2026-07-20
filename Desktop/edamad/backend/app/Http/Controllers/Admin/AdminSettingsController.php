<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class AdminSettingsController extends Controller
{
    public function __construct(private SettingsService $settings) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        return response()->json([
            'groups' => $this->settings->groupedForAdmin(),
            'meta' => [
                'group_labels' => [
                    'branding' => 'Site & Branding',
                    'email' => 'Email Setup',
                    'email_templates' => 'Email Templates',
                    'paystack' => 'Paystack & Payments',
                    'security' => 'Session & Security',
                ],
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'group' => ['required', Rule::in(array_keys($this->settings->definitions()))],
            'settings' => ['required', 'array'],
        ]);

        $this->settings->updateGroup($validated['group'], $validated['settings']);

        return response()->json([
            'message' => 'Settings saved.',
            'groups' => $this->settings->groupedForAdmin(),
        ]);
    }

    public function testEmail(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $user = $request->user();
        $this->settings->applyMailConfig();
        $siteName = $this->settings->get('site_name');

        try {
            Mail::raw(
                'This is a test email from '.$siteName.'. Your mail configuration is working.',
                function ($message) use ($user, $siteName) {
                    $message->to($user->email)
                        ->subject('Test email — '.$siteName);
                },
            );

            return response()->json(['message' => "Test email sent to {$user->email}."]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to send test email: '.$e->getMessage()], 422);
        }
    }

    public function testPaystack(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $result = $this->settings->verifyPaystackKeys();

        return response()->json(
            ['message' => $result['message']],
            $result['ok'] ? 200 : 422,
        );
    }
}
