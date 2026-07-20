<?php

use App\Http\Controllers\Admin\AdminAnnouncementController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminCertificateController;
use App\Http\Controllers\Admin\AdminCourseController;
use App\Http\Controllers\Admin\AdminAssessmentController;
use App\Http\Controllers\Admin\AdminFaqController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminEnrollmentController;
use App\Http\Controllers\Admin\AdminLessonController;
use App\Http\Controllers\Admin\AdminLogController;
use App\Http\Controllers\Admin\AdminMaterialController;
use App\Http\Controllers\Admin\AdminRoleController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminSupportTicketController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\MediaUploadController;
use App\Http\Controllers\Admin\VideoController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\PublicSettingsController;
use App\Http\Controllers\Student\AnnouncementController;
use App\Http\Controllers\Student\CheckoutController;
use App\Http\Controllers\Student\CourseContentController;
use App\Http\Controllers\Student\CourseController;
use App\Http\Controllers\Student\LiveLectureController;
use App\Http\Controllers\Student\MyCoursesController;
use App\Http\Controllers\Student\PracticeController;
use App\Http\Controllers\Student\SupportTicketController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed'])
    ->name('verification.verify');

Route::get('/store/courses', [CourseController::class, 'index']);
Route::get('/courses/{slug}/content', [CourseContentController::class, 'show']);
Route::get('/my-courses', [MyCoursesController::class, 'index']);

Route::get('/practice/subjects', [PracticeController::class, 'subjects']);
Route::get('/practice/subjects/{slug}', [PracticeController::class, 'subject']);
Route::get('/practice/tests/{slug}', [PracticeController::class, 'test']);
Route::post('/practice/tests/{slug}/questions/{questionId}/check', [PracticeController::class, 'checkAnswer']);
Route::post('/practice/tests/{slug}/submit', [PracticeController::class, 'submit']);
Route::get('/practice/tests/{slug}/review', [PracticeController::class, 'reviewQuestions']);
Route::get('/practice/tests/{slug}/latest-result', [PracticeController::class, 'latestResult']);

Route::get('/live-classes/featured', [LiveLectureController::class, 'featured']);
Route::get('/live-classes/{slug}', [LiveLectureController::class, 'show']);
Route::get('/settings/branding', [PublicSettingsController::class, 'branding']);
Route::get('/faqs', [FaqController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/user/password', [AuthController::class, 'updatePassword']);

    Route::get('/email/verification-status', [EmailVerificationController::class, 'status']);
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1');

    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{course}', [CourseController::class, 'show']);
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/support/tickets', [SupportTicketController::class, 'index']);
    Route::post('/support/tickets', [SupportTicketController::class, 'store']);
    Route::get('/support/tickets/{ticket}', [SupportTicketController::class, 'show']);

    Route::post('/checkout/initialize', [CheckoutController::class, 'initialize']);
    Route::get('/checkout/verify/{reference}', [CheckoutController::class, 'verify']);

    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::patch('/admin/users/{user}', [AdminUserController::class, 'update']);
    Route::post('/admin/users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);
    Route::post('/admin/users/{user}/verify', [AdminUserController::class, 'verify']);
    Route::post('/admin/users/{user}/unverify', [AdminUserController::class, 'unverify']);
    Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);

    Route::get('/admin/enrollments', [AdminEnrollmentController::class, 'index']);
    Route::get('/admin/certificates', [AdminCertificateController::class, 'index']);
    Route::get('/admin/categories', [AdminCategoryController::class, 'index']);
    Route::post('/admin/categories', [AdminCategoryController::class, 'store']);
    Route::patch('/admin/categories/{category}', [AdminCategoryController::class, 'update']);
    Route::delete('/admin/categories/{category}', [AdminCategoryController::class, 'destroy']);
    Route::post('/admin/categories/{category}/toggle-active', [AdminCategoryController::class, 'toggleActive']);
    Route::get('/admin/lessons', [AdminLessonController::class, 'index']);
    Route::get('/admin/materials', [AdminMaterialController::class, 'index']);
    Route::post('/admin/materials', [AdminMaterialController::class, 'store']);
    Route::delete('/admin/materials/{material}', [AdminMaterialController::class, 'destroy']);
    Route::get('/admin/tickets', [AdminSupportTicketController::class, 'index']);
    Route::get('/admin/tickets/{ticket}', [AdminSupportTicketController::class, 'show']);
    Route::patch('/admin/tickets/{ticket}', [AdminSupportTicketController::class, 'update']);
    Route::delete('/admin/tickets/{ticket}', [AdminSupportTicketController::class, 'destroy']);
    Route::get('/admin/announcements', [AdminAnnouncementController::class, 'index']);
    Route::post('/admin/announcements', [AdminAnnouncementController::class, 'store']);
    Route::patch('/admin/announcements/{announcement}', [AdminAnnouncementController::class, 'update']);
    Route::delete('/admin/announcements/{announcement}', [AdminAnnouncementController::class, 'destroy']);
    Route::post('/admin/announcements/{announcement}/publish', [AdminAnnouncementController::class, 'publish']);
    Route::get('/admin/settings', [AdminSettingsController::class, 'index']);
    Route::patch('/admin/settings', [AdminSettingsController::class, 'update']);
    Route::post('/admin/settings/test-email', [AdminSettingsController::class, 'testEmail']);
    Route::post('/admin/settings/test-paystack', [AdminSettingsController::class, 'testPaystack']);
    Route::get('/admin/roles', [AdminRoleController::class, 'index']);
    Route::post('/admin/roles', [AdminRoleController::class, 'store']);
    Route::patch('/admin/roles/{role}', [AdminRoleController::class, 'update']);
    Route::delete('/admin/roles/{role}', [AdminRoleController::class, 'destroy']);
    Route::get('/admin/permissions', [AdminRoleController::class, 'permissions']);
    Route::get('/admin/logs', [AdminLogController::class, 'index']);
    Route::get('/admin/reports', [AdminReportController::class, 'index']);
    Route::get('/admin/faqs', [AdminFaqController::class, 'index']);
    Route::post('/admin/faqs', [AdminFaqController::class, 'store']);
    Route::patch('/admin/faqs/{faq}', [AdminFaqController::class, 'update']);
    Route::delete('/admin/faqs/{faq}', [AdminFaqController::class, 'destroy']);
    Route::get('/admin/assessments', [AdminAssessmentController::class, 'index']);
    Route::post('/admin/assessments/import', [AdminAssessmentController::class, 'import']);

    Route::get('/admin/courses', [AdminCourseController::class, 'index']);
    Route::get('/admin/courses/{course}', [AdminCourseController::class, 'show']);
    Route::patch('/admin/courses/{course}', [AdminCourseController::class, 'update']);
    Route::delete('/admin/courses/{course}', [AdminCourseController::class, 'destroy']);
    Route::post('/admin/courses/{course}/toggle-publish', [AdminCourseController::class, 'togglePublish']);
    Route::post('/admin/lessons', [AdminLessonController::class, 'store']);
    Route::post('/courses', [AdminCourseController::class, 'store']);
    Route::post('/admin/media/upload', [MediaUploadController::class, 'upload']);
    Route::post('/videos/upload', [VideoController::class, 'upload']);
});
