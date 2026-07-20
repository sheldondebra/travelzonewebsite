<?php

namespace Database\Seeders;

use App\Models\LiveLecture;
use App\Models\LiveLectureMessage;
use Illuminate\Database\Seeder;

class LiveLectureSeeder extends Seeder
{
    public function run(): void
    {
        $lecture = LiveLecture::query()->updateOrCreate(
            ['slug' => 'cardiovascular-disorders'],
            [
                'title' => 'Live Zoom Lecture',
                'course_title' => 'Adult Medical-Surgical Nursing',
                'topic' => 'Cardiovascular Disorders',
                'instructor_name' => 'Mr. Abdul Mohammed',
                'instructor_credentials' => 'RN, MSN',
                'starts_at' => '2025-05-15 19:00:00',
                'duration_minutes' => 90,
                'meeting_id' => '812 675 4321',
                'zoom_link' => 'https://zoom.us/j/8126754321',
                'enrolled_count' => 120,
                'attendee_count' => 120,
                'is_live' => true,
                'learning_objectives' => [
                    'Describe the pathophysiology of heart failure and common cardiovascular disorders.',
                    'Identify priority nursing assessments and monitoring for patients with acute cardiovascular conditions.',
                    'Apply evidence-based nursing interventions for fluid management and medication administration.',
                ],
                'slides_url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            ],
        );

        LiveLecture::query()->updateOrCreate(
            ['slug' => 'respiratory-disorders'],
            [
                'title' => 'Live Zoom Lecture',
                'course_title' => 'Adult Medical-Surgical Nursing',
                'topic' => 'Respiratory Disorders',
                'instructor_name' => 'Mr. Abdul Mohammed',
                'instructor_credentials' => 'RN, MSN',
                'starts_at' => '2025-05-20 19:00:00',
                'duration_minutes' => 90,
                'meeting_id' => '812 675 4399',
                'enrolled_count' => 98,
                'attendee_count' => 0,
                'is_live' => false,
                'learning_objectives' => [],
            ],
        );

        $lecture->messages()->delete();

        $messages = [
            ['Fatima Yusuf', 'FY', 'Thank you for the clear explanation on heart failure management!', -12],
            ['Emeka Okafor', 'EO', 'Could you explain the fluid restriction guidelines again?', -9],
            ['Amina Bello', 'AB', 'The case study on cardiomyopathy is very helpful!', -6],
            ['Samuel Adeyemi', 'SA', 'Will the slides be uploaded after class?', -3],
        ];

        foreach ($messages as [$name, $initials, $text, $minutesAgo]) {
            LiveLectureMessage::query()->create([
                'live_lecture_id' => $lecture->id,
                'sender_name' => $name,
                'sender_initials' => $initials,
                'message' => $text,
                'sent_at' => now()->addMinutes($minutesAgo),
            ]);
        }
    }
}
