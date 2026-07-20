<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\PurchaseConfirmationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class CheckoutService
{
    public function __construct(private SettingsService $settings) {}

    /** @param  array<int>  $courseIds
     * @param  array{name: string, email: string, phone?: string|null, network?: string|null}  $billing
     * @return array{authorization_url: string, reference: string, access_code: string}
     */
    public function initialize(User $user, array $courseIds, array $billing, string $paymentMethod = 'momo'): array
    {
        $paystack = $this->settings->paystackConfig();

        if (! $paystack['enabled']) {
            throw new RuntimeException('Paystack payments are currently disabled.');
        }

        if ($paystack['secret_key'] === '' || $paystack['public_key'] === '') {
            throw new RuntimeException('Paystack is not configured. Contact support.');
        }

        $courses = Course::query()
            ->whereIn('id', $courseIds)
            ->where('is_published', true)
            ->get();

        if ($courses->isEmpty()) {
            throw new RuntimeException('No valid courses in your cart.');
        }

        $enrolledIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->whereIn('course_id', $courses->pluck('id'))
            ->pluck('course_id')
            ->all();

        $purchasable = $courses->reject(fn (Course $course) => in_array($course->id, $enrolledIds, true));

        if ($purchasable->isEmpty()) {
            throw new RuntimeException('You are already enrolled in all selected courses.');
        }

        $subtotal = (float) $purchasable->sum('price');
        $fee = (float) $paystack['processing_fee'];
        $total = $subtotal + $fee;
        $currency = $paystack['currency'] ?? 'GHS';
        $reference = 'ED-'.strtoupper(Str::random(8)).'-'.time();

        $frontendUrl = rtrim($this->settings->get('frontend_url', 'http://localhost:3000'), '/');
        $callbackUrl = $frontendUrl.'/checkout/callback?reference='.$reference;
        $amountInMinor = (int) round($total * 100);
        $channels = $paymentMethod === 'card' ? ['card'] : ['mobile_money'];

        $response = Http::withToken($paystack['secret_key'])
            ->timeout(30)
            ->post('https://api.paystack.co/transaction/initialize', [
                'email' => $billing['email'],
                'amount' => $amountInMinor,
                'currency' => $currency,
                'reference' => $reference,
                'callback_url' => $callbackUrl,
                'channels' => $channels,
                'metadata' => [
                    'user_id' => $user->id,
                    'course_ids' => $purchasable->pluck('id')->values()->all(),
                    'customer_name' => $billing['name'],
                    'customer_phone' => $billing['phone'] ?? '',
                    'subtotal' => $subtotal,
                    'processing_fee' => $fee,
                ],
            ]);

        if (! $response->successful() || ! $response->json('status')) {
            throw new RuntimeException($response->json('message') ?? 'Could not initialize payment.');
        }

        $data = $response->json('data');

        Payment::create([
            'user_id' => $user->id,
            'course_id' => null,
            'amount' => $total,
            'currency' => $currency,
            'reference' => $reference,
            'provider' => 'paystack',
            'status' => 'pending',
            'metadata' => [
                'course_ids' => $purchasable->pluck('id')->values()->all(),
                'courses' => $purchasable->map(fn (Course $course) => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'price' => (float) $course->price,
                ])->values()->all(),
                'subtotal' => $subtotal,
                'processing_fee' => $fee,
                'payment_method' => $paymentMethod,
                'billing' => $billing,
            ],
        ]);

        return [
            'authorization_url' => $data['authorization_url'],
            'reference' => $reference,
            'access_code' => $data['access_code'],
        ];
    }

    /** @return array<string, mixed> */
    public function verify(string $reference, ?User $user = null): array
    {
        $payment = Payment::query()->where('reference', $reference)->firstOrFail();

        if ($user && $payment->user_id !== $user->id) {
            abort(403, 'This payment does not belong to your account.');
        }

        if ($payment->status === 'success') {
            return $this->formatVerifyResponse($payment);
        }

        $paystack = $this->settings->paystackConfig();

        $response = Http::withToken($paystack['secret_key'])
            ->timeout(30)
            ->get('https://api.paystack.co/transaction/verify/'.$reference);

        if (! $response->successful() || ! $response->json('status')) {
            throw new RuntimeException($response->json('message') ?? 'Payment verification failed.');
        }

        $data = $response->json('data');

        if (($data['status'] ?? '') !== 'success') {
            $payment->update(['status' => 'failed']);

            throw new RuntimeException('Payment was not completed.');
        }

        return DB::transaction(function () use ($payment) {
            $payment->refresh();

            if ($payment->status === 'success') {
                return $this->formatVerifyResponse($payment);
            }

            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
            ]);

            $courseIds = $payment->metadata['course_ids'] ?? [];
            $this->createEnrollments($payment->user, $courseIds);
            $this->sendPurchaseConfirmationEmail($payment->fresh());

            return $this->formatVerifyResponse($payment->fresh());
        });
    }

    /** @param  array<int>  $courseIds */
    private function createEnrollments(User $user, array $courseIds): void
    {
        foreach ($courseIds as $courseId) {
            Enrollment::firstOrCreate(
                ['user_id' => $user->id, 'course_id' => $courseId],
                ['progress_percent' => 0, 'enrolled_at' => now()],
            );
        }
    }

    private function sendPurchaseConfirmationEmail(Payment $payment): void
    {
        try {
            $payment->user->notify(new PurchaseConfirmationNotification($payment));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** @return array<string, mixed> */
    private function formatVerifyResponse(Payment $payment): array
    {
        $courseIds = $payment->metadata['course_ids'] ?? [];

        $courses = Course::query()
            ->whereIn('id', $courseIds)
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
            ])
            ->values();

        return [
            'status' => 'success',
            'reference' => $payment->reference,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'courses' => $courses,
        ];
    }
}
