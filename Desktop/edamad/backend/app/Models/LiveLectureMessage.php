<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveLectureMessage extends Model
{
    protected $fillable = [
        'live_lecture_id',
        'sender_name',
        'sender_initials',
        'message',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function lecture(): BelongsTo
    {
        return $this->belongsTo(LiveLecture::class, 'live_lecture_id');
    }
}
