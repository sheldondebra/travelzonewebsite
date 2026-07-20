<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_lectures', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('course_title');
            $table->string('topic');
            $table->string('instructor_name');
            $table->string('instructor_credentials')->nullable();
            $table->dateTime('starts_at');
            $table->unsignedSmallInteger('duration_minutes')->default(90);
            $table->string('meeting_id')->nullable();
            $table->string('zoom_link')->nullable();
            $table->unsignedInteger('enrolled_count')->default(0);
            $table->unsignedInteger('attendee_count')->default(0);
            $table->boolean('is_live')->default(false);
            $table->json('learning_objectives')->nullable();
            $table->string('slides_url')->nullable();
            $table->timestamps();
        });

        Schema::create('live_lecture_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_lecture_id')->constrained()->cascadeOnDelete();
            $table->string('sender_name');
            $table->string('sender_initials', 4)->nullable();
            $table->text('message');
            $table->timestamp('sent_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_lecture_messages');
        Schema::dropIfExists('live_lectures');
    }
};
