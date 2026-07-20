<?php

namespace App\Http\Controllers;

use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

class PublicSettingsController extends Controller
{
    public function __construct(private SettingsService $settings) {}

    public function branding(): JsonResponse
    {
        return response()->json([
            'site_name' => $this->settings->get('site_name'),
            'site_tagline' => $this->settings->get('site_tagline'),
            'logo_url' => $this->settings->get('logo_url'),
            'primary_color' => $this->settings->get('primary_color'),
            'support_email' => $this->settings->get('support_email'),
            'paystack' => [
                'enabled' => filter_var($this->settings->get('paystack_enabled', 'false'), FILTER_VALIDATE_BOOLEAN),
                'public_key' => $this->settings->get('paystack_public_key', ''),
                'currency' => $this->settings->get('paystack_currency', 'GHS'),
                'processing_fee' => (int) $this->settings->get('payment_processing_fee', '15'),
            ],
        ]);
    }
}
