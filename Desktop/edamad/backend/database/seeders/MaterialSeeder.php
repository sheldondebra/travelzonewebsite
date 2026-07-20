<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class MaterialSeeder extends Seeder
{
    private const DEMO_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    private const DEMO_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    public function run(): void
    {
        Course::query()->each(function (Course $course) {
            $course->update([
                'thumbnail_url' => "https://picsum.photos/seed/edamad-thumb-{$course->id}/640/360",
                'banner_url' => "https://picsum.photos/seed/edamad-banner-{$course->id}/1280/720",
            ]);

            Lesson::query()
                ->where('course_id', $course->id)
                ->orderBy('sort_order')
                ->limit(3)
                ->get()
                ->each(function (Lesson $lesson, int $index) {
                    $lesson->update([
                        'video_url' => self::DEMO_VIDEO,
                        'content_url' => self::DEMO_VIDEO,
                        'lesson_type' => 'video',
                        'lesson_thumbnail_url' => "https://picsum.photos/seed/edamad-lesson-{$lesson->id}/640/360",
                        'publish_status' => $index === 0 ? 'published' : 'draft',
                        'supplementary_files' => match ($index) {
                            0 => [
                                [
                                    'id' => "sup-{$lesson->id}-slides",
                                    'type' => 'slides',
                                    'name' => "{$lesson->title} - Slides.pdf",
                                    'url' => self::DEMO_PDF,
                                ],
                                [
                                    'id' => "sup-{$lesson->id}-notes",
                                    'type' => 'notes',
                                    'name' => "{$lesson->title} - Study Notes.pdf",
                                    'url' => self::DEMO_PDF,
                                ],
                            ],
                            1 => [
                                [
                                    'id' => "sup-{$lesson->id}-handout",
                                    'type' => 'notes',
                                    'name' => 'Lesson Handout.pdf',
                                    'url' => self::DEMO_PDF,
                                ],
                            ],
                            default => [],
                        },
                    ]);
                });
        });
    }
}
