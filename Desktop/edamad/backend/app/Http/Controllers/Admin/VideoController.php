<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $request->validate([
            'video' => ['required', 'mimes:mp4,mov,avi,webm', 'max:5120000'],
        ]);

        $file = $request->file('video');
        $path = $file->store('videos', 'public');

        return response()->json([
            'url' => asset('storage/'.$path),
            'size' => $file->getSize(),
            'format' => strtoupper($file->getClientOriginalExtension()),
            'filename' => $file->getClientOriginalName(),
        ]);
    }
}
