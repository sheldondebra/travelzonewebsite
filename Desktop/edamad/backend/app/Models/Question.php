<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Question extends Model
{
    protected $fillable = [
        'course_id',
        'question_text',
        'options',
        'correct_answer',
        'explanation',
        'topic',
        'reference',
        'difficulty',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function practiceTests(): BelongsToMany
    {
        return $this->belongsToMany(PracticeTest::class, 'practice_test_question')
            ->withPivot('sort_order');
    }
}
