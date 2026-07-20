<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@edamad.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('Admin@12345'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'student@edamad.com'],
            [
                'name' => 'Student Name',
                'password' => Hash::make('Student@12345'),
                'role' => 'student',
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'pending@edamad.com'],
            [
                'name' => 'Pending Student',
                'password' => Hash::make('Student@12345'),
                'role' => 'student',
                'email_verified_at' => null,
            ],
        );
    }
}
