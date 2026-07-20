<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $query = Category::query()->orderBy('sort_order')->orderBy('name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->string('status')->toString() === 'active') {
            $query->where('is_active', true);
        } elseif ($request->string('status')->toString() === 'inactive') {
            $query->where('is_active', false);
        }

        $categories = $query->get()->map(fn (Category $category) => $this->formatCategory($category));

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:categories,name'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        $name = trim($validated['name']);
        $category = Category::create([
            'name' => $name,
            'slug' => $this->uniqueSlug($name),
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? ((int) Category::max('sort_order')) + 1,
        ]);

        return response()->json([
            'message' => "Category \"{$category->name}\" created successfully.",
            'category' => $this->formatCategory($category),
        ], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', Rule::unique('categories', 'name')->ignore($category->id)],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        $oldName = $category->name;

        if (isset($validated['name'])) {
            $validated['name'] = trim($validated['name']);
            $validated['slug'] = $this->uniqueSlug($validated['name'], $category->id);
        }

        $category->update($validated);

        if ($oldName !== $category->name) {
            Course::where('category', $oldName)->update(['category' => $category->name]);
        }

        return response()->json([
            'message' => "Category \"{$category->name}\" updated successfully.",
            'category' => $this->formatCategory($category->fresh()),
        ]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $coursesCount = Course::where('category', $category->name)->count();
        if ($coursesCount > 0) {
            throw ValidationException::withMessages([
                'name' => ["Cannot delete \"{$category->name}\" because {$coursesCount} course(s) use it. Reassign those courses first."],
            ]);
        }

        $name = $category->name;
        $category->delete();

        return response()->json([
            'message' => "Category \"{$name}\" deleted successfully.",
        ]);
    }

    public function toggleActive(Request $request, Category $category): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $category->update(['is_active' => ! $category->is_active]);
        $status = $category->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'message' => "Category \"{$category->name}\" {$status} successfully.",
            'category' => $this->formatCategory($category->fresh()),
        ]);
    }

    private function formatCategory(Category $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'is_active' => $category->is_active,
            'sort_order' => $category->sort_order,
            'courses_count' => Course::where('category', $category->name)->count(),
            'created_at' => $category->created_at?->toIso8601String(),
            'updated_at' => $category->updated_at?->toIso8601String(),
        ];
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $counter = 1;

        while (
            Category::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
