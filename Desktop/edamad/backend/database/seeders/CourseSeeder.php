<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $creator = User::query()->first();

        $courses = [
            [
                'title' => 'Human Anatomy & Physiology',
                'slug' => 'human-anatomy-and-physiology',
                'description' => 'Explore the structure, organisation, and function of the human body to build a strong foundation for clinical nursing practice.',
                'price' => 180,
                'icon' => 'anatomy',
                'icon_bg' => '#EDE9FE',
            ],
            [
                'title' => 'Pharmacology Nursing',
                'slug' => 'pharmacology',
                'description' => 'Master the principles of drugs and their safe, effective use in nursing practice.',
                'price' => 170,
                'icon' => 'pharmacy',
                'icon_bg' => '#EDE9FE',
            ],
            [
                'title' => 'Advanced Nursing Practice',
                'slug' => 'advanced-nursing',
                'description' => 'Enhance clinical expertise, leadership, and evidence-based decision making to improve patient outcomes.',
                'price' => 210,
                'icon' => 'advanced',
                'icon_bg' => '#EDE9FE',
            ],
            [
                'title' => 'Adult Medical-Surgical Nursing',
                'slug' => 'adult-medical-surgical-nursing',
                'description' => 'Comprehensive care across the adult lifespan for medical and surgical conditions.',
                'price' => 200,
                'icon' => 'surgical',
                'icon_bg' => '#DCFCE7',
            ],
            [
                'title' => 'Paediatric Nursing',
                'slug' => 'paediatric-nursing',
                'description' => 'Provide safe, developmentally appropriate care for infants, children and adolescents.',
                'price' => 190,
                'icon' => 'paediatric',
                'icon_bg' => '#FCE7F3',
            ],
            [
                'title' => 'Obstetrics Nursing',
                'slug' => 'obstetrics-nursing',
                'description' => 'Provide compassionate, evidence-based care for mothers and newborns throughout pregnancy, labour, delivery, and recovery.',
                'price' => 185,
                'icon' => 'obstetrics',
                'icon_bg' => '#FFE8F0',
            ],
            [
                'title' => 'Public Health Nursing',
                'slug' => 'public-health-nursing',
                'description' => 'Population health, prevention strategies, and community nursing practice.',
                'price' => 175,
                'icon' => 'public-health',
                'icon_bg' => '#E8F0FF',
            ],
            [
                'title' => 'Mental Health Nursing',
                'slug' => 'mental-health-nursing',
                'description' => 'Promote mental well-being and provide compassionate, evidence-based care for individuals across the lifespan.',
                'price' => 175,
                'icon' => 'mental-health',
                'icon_bg' => '#CCFBF1',
            ],
        ];

        foreach ($courses as $course) {
            Course::query()->updateOrCreate(
                ['slug' => $course['slug']],
                [
                    ...$course,
                    'is_published' => true,
                    'created_by' => $creator?->id,
                ],
            );
        }
    }
}
