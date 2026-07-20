<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Database\Seeder;

class DashboardSeeder extends Seeder
{
    public function run(): void
    {
        $students = User::where('role', 'student')->get();
        $courses = Course::all();

        foreach ($students as $student) {
            foreach ($courses->random(min(3, $courses->count())) as $course) {
                Enrollment::updateOrCreate(
                    ['user_id' => $student->id, 'course_id' => $course->id],
                    [
                        'progress_percent' => random_int(20, 95),
                        'enrolled_at' => now()->subDays(random_int(1, 90)),
                        'completed_at' => random_int(0, 1) ? now()->subDays(random_int(1, 30)) : null,
                    ],
                );
            }
        }

        $students = User::where('role', 'student')->get();
        $student = $students->first();

        $tickets = [
            [
                'user_id' => $student?->id,
                'user_name' => 'Sarah Johnson',
                'user_email' => 'sarah.johnson@example.com',
                'subject' => 'Unable to access videos',
                'message' => 'When I try to play lesson videos in Pharmacology Nursing, the player loads but shows a black screen. I have tried Chrome and Safari.',
                'category' => 'courses',
                'priority' => 'High',
                'status' => 'Open',
            ],
            [
                'user_id' => $students->skip(1)->first()?->id,
                'user_name' => 'Michael Chen',
                'user_email' => 'michael.chen@example.com',
                'subject' => 'Payment not reflected',
                'message' => 'I completed checkout yesterday but my course is still locked. Transaction reference: ED-88421.',
                'category' => 'payments',
                'priority' => 'Medium',
                'status' => 'In Progress',
                'admin_notes' => 'Checking payment gateway logs.',
            ],
            [
                'user_id' => $students->skip(2)->first()?->id,
                'user_name' => 'Amina Hassan',
                'user_email' => 'amina.hassan@example.com',
                'subject' => 'Certificate download issue',
                'message' => 'The download button on my completed course certificate returns a 404 error.',
                'category' => 'certificates',
                'priority' => 'Low',
                'status' => 'Resolved',
                'admin_notes' => 'Regenerated certificate PDF. Confirmed working.',
            ],
            [
                'user_id' => $students->skip(3)->first()?->id,
                'user_name' => 'James Wilson',
                'user_email' => 'james.wilson@example.com',
                'subject' => 'Password reset not working',
                'message' => 'I requested a password reset twice but never received the email.',
                'category' => 'account',
                'priority' => 'High',
                'status' => 'Open',
            ],
        ];

        foreach ($tickets as $ticket) {
            SupportTicket::updateOrCreate(
                ['subject' => $ticket['subject'], 'user_name' => $ticket['user_name']],
                $ticket,
            );
        }
    }
}
