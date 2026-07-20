<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lesson extends Model
{
    protected $fillable = [
        'course_id',
        'module_title',
        'module_sort_order',
        'title',
        'description',
        'lesson_type',
        'video_url',
        'content_url',
        'lesson_thumbnail_url',
        'video_title',
        'lesson_number',
        'tags',
        'access_type',
        'publish_status',
        'supplementary_files',
        'scheduled_at',
        'video_metadata',
        'duration_seconds',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'supplementary_files' => 'array',
            'video_metadata' => 'array',
            'scheduled_at' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
