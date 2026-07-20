<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (PermissionCatalog::all() as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $allPermissions = Permission::where('guard_name', 'web')->pluck('name')->all();

        $admin = Role::findOrCreate('admin', 'web');
        $admin->syncPermissions($allPermissions);

        $student = Role::findOrCreate('student', 'web');
        $student->syncPermissions([]);

        $contentManager = Role::findOrCreate('content-manager', 'web');
        $contentManager->syncPermissions([
            'dashboard.view',
            'courses.view', 'courses.create', 'courses.update', 'courses.delete', 'courses.publish',
            'categories.view', 'categories.manage',
            'materials.view', 'materials.manage',
            'lessons.view', 'lessons.manage',
        ]);

        $supportAgent = Role::findOrCreate('support-agent', 'web');
        $supportAgent->syncPermissions([
            'dashboard.view',
            'users.view',
            'tickets.view', 'tickets.manage',
            'announcements.view',
            'enrollments.view',
        ]);

        User::query()->each(function (User $user) {
            $user->syncRoles([$user->role]);
        });
    }
}
