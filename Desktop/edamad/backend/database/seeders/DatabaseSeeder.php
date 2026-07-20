<?php

namespace Database\Seeders;

use Database\Seeders\AdminUserSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\CourseSeeder;
use Database\Seeders\MaterialSeeder;
use Database\Seeders\DashboardSeeder;
use Database\Seeders\PracticeSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);
        $this->call(RolePermissionSeeder::class);
        $this->call(CourseSeeder::class);
        $this->call(CategorySeeder::class);
        $this->call(PracticeSeeder::class);
        $this->call(LiveLectureSeeder::class);
        $this->call(LessonSeeder::class);
        $this->call(MaterialSeeder::class);
        $this->call(DashboardSeeder::class);
        $this->call(AnnouncementSeeder::class);
        $this->call(SettingsSeeder::class);
        $this->call(FaqSeeder::class);
    }
}
