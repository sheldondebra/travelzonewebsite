<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'Nursing',
            'Pharmacology',
            'Anatomy & Physiology',
            'Mental Health',
            'Public Health',
            'Advanced Practice',
        ];

        $fromCourses = Course::query()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->pluck('category')
            ->all();

        $names = collect([...$defaults, ...$fromCourses])
            ->map(fn (string $name) => trim($name))
            ->filter()
            ->unique()
            ->values();

        foreach ($names as $index => $name) {
            Category::updateOrCreate(
                ['name' => $name],
                [
                    'slug' => Str::slug($name),
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ],
            );
        }
    }
}
