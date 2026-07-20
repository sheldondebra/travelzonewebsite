<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'category' => 'account',
                'question' => 'How do I reset my password?',
                'answer' => 'Click Forgot Password on the login page, enter your email, and follow the link sent to your inbox. Links expire after 60 minutes for security.',
                'sort_order' => 1,
            ],
            [
                'category' => 'courses',
                'question' => 'How can I track my course progress?',
                'answer' => 'Open Progress from the sidebar to see overall stats and per-course completion. Each course page also shows your overall course progress bar and completed lessons.',
                'sort_order'  => 2,
            ],
            [
                'category' => 'courses',
                'question' => 'Can I download course content for offline use?',
                'answer' => 'Course outlines and instructor-provided slide decks can be downloaded from the lesson page. Video lessons require an internet connection for streaming.',
                'sort_order' => 3,
            ],
            [
                'category' => 'certificates',
                'question' => 'How do I get my certificate?',
                'answer' => 'Finish all lessons and required assessments in a course. Your certificate will be available from Profile and the course completion summary.',
                'sort_order' => 4,
            ],
            [
                'category' => 'payments',
                'question' => 'What payment methods do you accept?',
                'answer' => 'We accept Visa, Mastercard, and regional mobile money options through Paystack at checkout.',
                'sort_order' => 5,
            ],
        ];

        foreach ($items as $item) {
            Faq::updateOrCreate(
                ['question' => $item['question']],
                [...$item, 'is_active' => true],
            );
        }
    }
}
