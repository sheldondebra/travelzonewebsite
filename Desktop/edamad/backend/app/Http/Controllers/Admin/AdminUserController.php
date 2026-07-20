<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $query = User::query()
            ->withCount('enrollments')
            ->orderByDesc('created_at');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($role = $request->string('role')->trim()->toString()) {
            if (in_array($role, ['student', 'admin'], true)) {
                $query->where('role', $role);
            }
        }

        match ($request->string('status')->toString()) {
            'unverified' => $query->whereNull('email_verified_at'),
            'verified' => $query->whereNotNull('email_verified_at'),
            default => null,
        };

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', Rule::in(['student', 'admin'])],
            'verified' => ['boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'],
            'role' => $validated['role'],
            'email_verified_at' => ($validated['verified'] ?? false) ? now() : null,
        ]);

        $user->syncPlatformRole();

        return response()->json([
            'message' => "User {$user->email} created successfully.",
            'user' => $user->loadCount('enrollments'),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['sometimes', Rule::in(['student', 'admin'])],
        ]);

        if (isset($validated['role']) && $validated['role'] === 'student' && $user->isAdmin()) {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                throw ValidationException::withMessages([
                    'role' => ['Cannot change the role of the only admin account.'],
                ]);
            }
        }

        if ($user->id === $request->user()->id && isset($validated['role']) && $validated['role'] !== 'admin') {
            throw ValidationException::withMessages([
                'role' => ['You cannot remove your own admin role.'],
            ]);
        }

        $user->update($validated);
        $user->syncPlatformRole();

        return response()->json([
            'message' => "User {$user->email} updated successfully.",
            'user' => $user->fresh()->loadCount('enrollments'),
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user->update(['password' => $validated['password']]);

        return response()->json([
            'message' => "Password reset for {$user->email}.",
            'user' => $user->fresh()->loadCount('enrollments'),
        ]);
    }

    public function verify(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        if (! $user->hasVerifiedEmail()) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return response()->json([
            'message' => "User {$user->email} verified successfully.",
            'user' => $user->fresh()->loadCount('enrollments'),
        ]);
    }

    public function unverify(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot unverify an admin account.'], 422);
        }

        $user->forceFill(['email_verified_at' => null])->save();

        return response()->json([
            'message' => "Verification removed for {$user->email}.",
            'user' => $user->fresh()->loadCount('enrollments'),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($user->isAdmin() && User::where('role', 'admin')->count() <= 1) {
            return response()->json(['message' => 'Cannot delete the only admin account.'], 422);
        }

        $email = $user->email;
        $user->delete();

        return response()->json(['message' => "User {$email} deleted successfully."]);
    }
}
