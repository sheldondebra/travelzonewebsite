<?php

namespace App\Notifications;

use App\Models\Announcement;
use App\Services\SettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AnnouncementPublishedNotification extends Notification
{
    use Queueable;

    public function __construct(public Announcement $announcement) {}

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
        $prefix = $settings->get('tpl_announcement_subject_prefix', '[Announcement]');
        $preview = str($this->announcement->body)->limit(240)->toString();

        return (new MailMessage)
            ->subject(trim($prefix.' '.$this->announcement->title).' — '.$siteName)
            ->greeting('Hello '.$notifiable->name.'!')
            ->line($preview)
            ->action('View in your account', $frontend.'/dashboard')
            ->line('You can also find this announcement on your dashboard and profile.');
    }
}
