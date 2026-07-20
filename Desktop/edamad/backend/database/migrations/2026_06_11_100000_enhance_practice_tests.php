<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('practice_tests', function (Blueprint $table) {
            $table->string('slug')->unique()->after('title');
            $table->string('icon')->default('clipboard')->after('description');
            $table->unsignedTinyInteger('passing_score')->default(70)->after('question_count');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->string('topic')->nullable()->after('explanation');
            $table->text('reference')->nullable()->after('topic');
        });

        Schema::create('practice_test_question', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_test_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->unique(['practice_test_id', 'question_id']);
        });

        Schema::table('test_attempts', function (Blueprint $table) {
            $table->unsignedInteger('time_taken_seconds')->default(0)->after('answers');
        });
    }

    public function down(): void
    {
        Schema::table('test_attempts', function (Blueprint $table) {
            $table->dropColumn('time_taken_seconds');
        });

        Schema::dropIfExists('practice_test_question');

        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn(['topic', 'reference']);
        });

        Schema::table('practice_tests', function (Blueprint $table) {
            $table->dropColumn(['slug', 'icon', 'passing_score']);
        });
    }
};
