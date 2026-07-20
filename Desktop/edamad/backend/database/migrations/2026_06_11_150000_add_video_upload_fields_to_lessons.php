<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('video_title')->nullable()->after('title');
            $table->string('lesson_number')->nullable()->after('video_title');
            $table->json('tags')->nullable()->after('lesson_type');
            $table->string('access_type')->default('premium')->after('tags');
            $table->string('publish_status')->default('draft')->after('access_type');
            $table->string('lesson_thumbnail_url')->nullable()->after('content_url');
            $table->json('supplementary_files')->nullable()->after('lesson_thumbnail_url');
            $table->timestamp('scheduled_at')->nullable()->after('supplementary_files');
            $table->json('video_metadata')->nullable()->after('scheduled_at');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn([
                'video_title',
                'lesson_number',
                'tags',
                'access_type',
                'publish_status',
                'lesson_thumbnail_url',
                'supplementary_files',
                'scheduled_at',
                'video_metadata',
            ]);
        });
    }
};
