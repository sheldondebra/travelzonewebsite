<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'course_code',
        'category',
        'instructor',
        'difficulty',
        'duration_label',
        'description',
        'short_description',
        'full_description',
        'thumbnail_url',
        'banner_url',
        'icon',
        'icon_bg',
        'outline_url',
        'learning_objectives',
        'price',
        'is_published',
        'is_active',
        'visibility',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_published' => 'boolean',
            'is_active' => 'boolean',
            'learning_objectives' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('sort_order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function practiceTests(): HasMany
    {
        return $this->hasMany(PracticeTest::class);
    }
}
