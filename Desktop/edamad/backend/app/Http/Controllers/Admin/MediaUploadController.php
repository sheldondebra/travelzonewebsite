<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaUploadController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'type' => ['required', 'in:thumbnail,banner,lesson'],
            'file' => ['required', 'file'],
        ]);

        $rules = match ($validated['type']) {
            'thumbnail' => ['mimes:png,jpg,jpeg,webp', 'max:2048'],
            'banner' => ['mimes:png,jpg,jpeg,webp', 'max:5120'],
            'lesson' => ['mimes:mp4,pdf,ppt,pptx', 'max:512000'],
        };

        $request->validate(['file' => $rules]);

        $folder = match ($validated['type']) {
            'thumbnail' => 'course-thumbnails',
            'banner' => 'course-banners',
            'lesson' => 'lesson-content',
        };

        $path = $request->file('file')->store($folder, 'public');

        return response()->json([
            'url' => asset('storage/'.$path),
            'path' => $path,
        ]);
    }
}
