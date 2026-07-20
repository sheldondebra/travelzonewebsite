<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiveLecture extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'course_title',
        'topic',
        'instructor_name',
        'instructor_credentials',
        'starts_at',
        'duration_minutes',
        'meeting_id',
        'zoom_link',
        'enrolled_count',
        'attendee_count',
        'is_live',
        'learning_objectives',
        'slides_url',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'is_live' => 'boolean',
            'learning_objectives' => 'array',
        ];
    }

    public function messages(): HasMany
    {
        return $this->hasMany(LiveLectureMessage::class)->orderBy('sent_at');
    }
}
