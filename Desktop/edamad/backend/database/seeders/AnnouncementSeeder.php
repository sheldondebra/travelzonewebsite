<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();

        $items = [
            [
                'title' => 'Welcome to ED-AMAD Learning Consult',
                'body' => 'We are excited to have you on the platform. Explore your courses, practice tests, and live classes to stay on track for your NMC exam preparation.',
                'audience' => 'all',
                'status' => 'published',
                'published_at' => now()->subDays(2),
                'emailed_at' => now()->subDays(2),
                'emails_sent_count' => User::count(),
            ],
            [
                'title' => 'New Pharmacology Lessons Available',
                'body' => 'Fresh video lessons and study materials have been added to the Pharmacology Nursing course. Log in to continue learning.',
                'audience' => 'students',
                'status' => 'published',
                'published_at' => now()->subDay(),
                'emailed_at' => now()->subDay(),
                'emails_sent_count' => User::where('role', 'student')->count(),
            ],
            [
                'title' => 'Scheduled Maintenance — Draft',
                'body' => 'The platform will undergo brief maintenance this weekend. This announcement is saved as a draft until published.',
                'audience' => 'all',
                'status' => 'draft',
            ],
        ];

        foreach ($items as $item) {
            Announcement::updateOrCreate(
                ['title' => $item['title']],
                [
                    ...$item,
                    'created_by' => $admin?->id,
                ],
            );
        }
    }
}
