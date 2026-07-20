<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('course_code')->nullable()->after('slug');
            $table->string('category')->nullable()->after('course_code');
            $table->string('instructor')->nullable()->after('category');
            $table->string('difficulty')->nullable()->after('instructor');
            $table->string('duration_label')->nullable()->after('difficulty');
            $table->text('short_description')->nullable()->after('description');
            $table->longText('full_description')->nullable()->after('short_description');
            $table->string('banner_url')->nullable()->after('thumbnail_url');
            $table->json('learning_objectives')->nullable()->after('full_description');
            $table->boolean('is_active')->default(true)->after('is_published');
            $table->string('visibility')->default('public')->after('is_active');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->string('module_title')->nullable()->after('course_id');
            $table->unsignedInteger('module_sort_order')->default(0)->after('module_title');
            $table->string('lesson_type')->default('video')->after('description');
            $table->string('content_url')->nullable()->after('video_url');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['module_title', 'module_sort_order', 'lesson_type', 'content_url']);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'course_code',
                'category',
                'instructor',
                'difficulty',
                'duration_label',
                'short_description',
                'full_description',
                'banner_url',
                'learning_objectives',
                'is_active',
                'visibility',
            ]);
        });
    }
};
