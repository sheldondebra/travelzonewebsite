<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AdminRoleController extends Controller
{
    public function permissions(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $permissions = Permission::where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'label' => PermissionCatalog::label($permission->name),
                'group' => PermissionCatalog::groupFor($permission->name),
            ]);

        $grouped = [];
        foreach (PermissionCatalog::groups() as $group => $items) {
            $grouped[$group] = [];
            foreach ($items as $name => $label) {
                $permission = $permissions->firstWhere('name', $name);
                if ($permission) {
                    $grouped[$group][] = $permission;
                }
            }
        }

        return response()->json([
            'permissions' => $permissions,
            'grouped' => $grouped,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $roles = Role::where('guard_name', 'web')
            ->with('permissions:id,name')
            ->withCount('permissions')
            ->orderBy('name')
            ->get()
            ->map(function (Role $role) {
                $usersCount = $role->users()->count();

                return $this->formatRole($role, $usersCount);
            });

        return response()->json($roles);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('roles', 'name')->where('guard_name', 'web')],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')->where('guard_name', 'web')],
        ]);

        if (in_array($validated['name'], PermissionCatalog::systemRoles(), true)) {
            return response()->json(['message' => 'This role name is reserved for system use.'], 422);
        }

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (! empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role->load('permissions:id,name')->loadCount('permissions');

        return response()->json([
            'message' => 'Role created.',
            'role' => $this->formatRole($role, 0),
        ], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);
        abort_unless($role->guard_name === 'web', 404);

        $isSystem = in_array($role->name, PermissionCatalog::systemRoles(), true);

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('roles', 'name')->where('guard_name', 'web')->ignore($role->id),
            ],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')->where('guard_name', 'web')],
        ]);

        if ($isSystem && isset($validated['name']) && $validated['name'] !== $role->name) {
            return response()->json(['message' => 'System role names cannot be changed.'], 422);
        }

        if (isset($validated['name']) && in_array($validated['name'], PermissionCatalog::systemRoles(), true) && $validated['name'] !== $role->name) {
            return response()->json(['message' => 'This role name is reserved for system use.'], 422);
        }

        if (isset($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        if (array_key_exists('permissions', $validated)) {
            $role->syncPermissions($validated['permissions'] ?? []);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role->load('permissions:id,name')->loadCount('permissions');

        return response()->json([
            'message' => 'Role updated.',
            'role' => $this->formatRole($role, $role->users()->count()),
        ]);
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);
        abort_unless($role->guard_name === 'web', 404);

        if (in_array($role->name, PermissionCatalog::systemRoles(), true)) {
            return response()->json(['message' => 'System roles cannot be deleted.'], 422);
        }

        if ($role->users()->count() > 0) {
            return response()->json(['message' => 'Remove this role from all users before deleting it.'], 422);
        }

        $name = $role->name;
        $role->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json(['message' => "Role \"{$name}\" deleted."]);
    }

    private function formatRole(Role $role, int $usersCount): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'label' => $this->roleLabel($role->name),
            'is_system' => in_array($role->name, PermissionCatalog::systemRoles(), true),
            'permissions' => $role->permissions->pluck('name')->values()->all(),
            'permissions_count' => $role->permissions_count ?? $role->permissions->count(),
            'users_count' => $usersCount,
            'created_at' => $role->created_at?->toIso8601String(),
        ];
    }

    private function roleLabel(string $name): string
    {
        return match ($name) {
            'admin' => 'Administrator',
            'student' => 'Student',
            'content-manager' => 'Content Manager',
            'support-agent' => 'Support Agent',
            default => ucwords(str_replace('-', ' ', $name)),
        };
    }
}
