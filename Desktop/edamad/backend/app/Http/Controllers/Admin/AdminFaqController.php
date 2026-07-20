<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminFaqController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $query = Faq::query()->orderBy('sort_order')->orderBy('id');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('question', 'like', "%{$search}%")
                    ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        if ($category = $request->string('category')->trim()->toString()) {
            if ($category !== 'all') {
                $query->where('category', $category);
            }
        }

        return response()->json($query->get()->map(fn (Faq $faq) => $this->format($faq)));
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'category' => ['required', Rule::in(['account', 'courses', 'payments', 'certificates', 'general'])],
            'question' => ['required', 'string', 'max:500'],
            'answer' => ['required', 'string', 'max:5000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $faq = Faq::create([
            ...$validated,
            'sort_order' => $validated['sort_order'] ?? ((int) Faq::max('sort_order')) + 1,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['message' => 'FAQ created.', 'faq' => $this->format($faq)], 201);
    }

    public function update(Request $request, Faq $faq): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'category' => ['sometimes', Rule::in(['account', 'courses', 'payments', 'certificates', 'general'])],
            'question' => ['sometimes', 'string', 'max:500'],
            'answer' => ['sometimes', 'string', 'max:5000'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $faq->update($validated);

        return response()->json(['message' => 'FAQ updated.', 'faq' => $this->format($faq->fresh())]);
    }

    public function destroy(Request $request, Faq $faq): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $faq->delete();

        return response()->json(['message' => 'FAQ deleted.']);
    }

    private function format(Faq $faq): array
    {
        return [
            'id' => $faq->id,
            'category' => $faq->category,
            'question' => $faq->question,
            'answer' => $faq->answer,
            'sort_order' => $faq->sort_order,
            'is_active' => $faq->is_active,
            'created_at' => $faq->created_at?->toIso8601String(),
            'updated_at' => $faq->updated_at?->toIso8601String(),
        ];
    }
}
