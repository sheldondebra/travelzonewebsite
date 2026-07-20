<?php

namespace App\Support;

class PermissionCatalog
{
    /** @return array<string, array<string, string>> */
    public static function groups(): array
    {
        return [
            'Dashboard' => [
                'dashboard.view' => 'View admin dashboard',
            ],
            'Users' => [
                'users.view' => 'View users',
                'users.create' => 'Create users',
                'users.update' => 'Update users',
                'users.delete' => 'Delete users',
            ],
            'Courses' => [
                'courses.view' => 'View courses',
                'courses.create' => 'Create courses',
                'courses.update' => 'Update courses',
                'courses.delete' => 'Delete courses',
                'courses.publish' => 'Publish courses',
            ],
            'Categories' => [
                'categories.view' => 'View categories',
                'categories.manage' => 'Manage categories',
            ],
            'Materials' => [
                'materials.view' => 'View materials',
                'materials.manage' => 'Manage materials',
            ],
            'Lessons' => [
                'lessons.view' => 'View lessons',
                'lessons.manage' => 'Manage lessons',
            ],
            'Enrollments' => [
                'enrollments.view' => 'View enrollments',
            ],
            'Certificates' => [
                'certificates.view' => 'View certificates',
            ],
            'Support Tickets' => [
                'tickets.view' => 'View tickets',
                'tickets.manage' => 'Manage tickets',
            ],
            'Announcements' => [
                'announcements.view' => 'View announcements',
                'announcements.manage' => 'Manage announcements',
            ],
            'Settings' => [
                'settings.view' => 'View settings',
                'settings.manage' => 'Manage settings',
            ],
            'Roles & Permissions' => [
                'roles.view' => 'View roles',
                'roles.manage' => 'Manage roles',
            ],
        ];
    }

    /** @return list<string> */
    public static function all(): array
    {
        $names = [];
        foreach (self::groups() as $permissions) {
            foreach ($permissions as $name => $label) {
                $names[] = $name;
            }
        }

        return $names;
    }

    public static function label(string $name): string
    {
        foreach (self::groups() as $permissions) {
            if (isset($permissions[$name])) {
                return $permissions[$name];
            }
        }

        return str_replace('.', ' ', $name);
    }

    public static function groupFor(string $name): string
    {
        foreach (self::groups() as $group => $permissions) {
            if (isset($permissions[$name])) {
                return $group;
            }
        }

        return 'Other';
    }

    /** @return list<string> */
    public static function systemRoles(): array
    {
        return ['admin', 'student'];
    }
}
