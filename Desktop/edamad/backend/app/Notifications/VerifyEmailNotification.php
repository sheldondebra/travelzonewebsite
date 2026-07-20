<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends BaseVerifyEmail
{
    protected function verificationUrl($notifiable): string
    {
        $apiUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );

        $frontend = rtrim(config('app.frontend_url'), '/');

        return $frontend.'/auth/verify-email?redirect='.urlencode($apiUrl);
    }

    public function toMail($notifiable): MailMessage
    {
        $url = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify Your Email — ED-AMAD Learning Consult')
            ->greeting('Hello '.$notifiable->name.'!')
            ->line('Please verify your email address to activate your account.')
            ->action('Verify Email Address', $url)
            ->line('This link expires in 60 minutes.')
            ->line('If you did not create an account, no further action is required.');
    }
}
