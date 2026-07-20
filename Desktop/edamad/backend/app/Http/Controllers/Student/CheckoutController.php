<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class CheckoutController extends Controller
{
    public function __construct(private CheckoutService $checkout) {}

    public function initialize(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_ids' => ['required', 'array', 'min:1'],
            'course_ids.*' => ['integer', 'exists:courses,id'],
            'payment_method' => ['required', 'in:momo,card'],
            'billing' => ['required', 'array'],
            'billing.name' => ['required', 'string', 'max:120'],
            'billing.email' => ['required', 'email', 'max:255'],
            'billing.phone' => ['nullable', 'string', 'max:20'],
            'billing.network' => ['nullable', 'string', 'max:30'],
        ]);

        try {
            $result = $this->checkout->initialize(
                $request->user(),
                $validated['course_ids'],
                $validated['billing'],
                $validated['payment_method'],
            );

            return response()->json($result);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function verify(Request $request, string $reference): JsonResponse
    {
        try {
            $result = $this->checkout->verify($reference, $request->user());

            return response()->json($result);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
