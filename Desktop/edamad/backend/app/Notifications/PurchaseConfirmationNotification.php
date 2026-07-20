<?php

namespace App\Notifications;

use App\Models\Payment;
use App\Services\SettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PurchaseConfirmationNotification extends Notification
{
    use Queueable;

    public function __construct(public Payment $payment) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $settings = app(SettingsService::class);
        $settings->applyMailConfig();

        $frontend = rtrim($settings->get('frontend_url', config('app.frontend_url')), '/');
        $siteName = $settings->get('site_name', 'ED-AMAD Learning Consult');
        $metadata = $this->payment->metadata ?? [];
        $courses = $metadata['courses'] ?? [];
        $subtotal = (float) ($metadata['subtotal'] ?? 0);
        $fee = (float) ($metadata['processing_fee'] ?? 0);
        $total = (float) $this->payment->amount;
        $currency = $this->payment->currency ?? 'GHS';

        $mail = (new MailMessage)
            ->subject('Your course purchase is confirmed — '.$siteName)
            ->greeting('Hello '.$notifiable->name.'!')
            ->line('Thank you for your purchase. Your payment was successful and your courses are ready to start.')
            ->line('**Order reference:** '.$this->payment->reference);

        if ($courses !== []) {
            $mail->line('**Courses purchased**');
            foreach ($courses as $course) {
                $title = $course['title'] ?? 'Course';
                $price = (float) ($course['price'] ?? 0);
                $mail->line('• '.$title.' — '.$currency.' '.number_format($price, 2));
            }
        }

        $mail
            ->line('**Subtotal:** '.$currency.' '.number_format($subtotal, 2))
            ->line('**Processing fee:** '.$currency.' '.number_format($fee, 2))
            ->line('**Total paid:** '.$currency.' '.number_format($total, 2))
            ->action('Start learning', $frontend.'/dashboard')
            ->line('You can access your courses anytime from your dashboard.')
            ->line('If you need help, contact our support team from your account.');

        return $mail;
    }
}
