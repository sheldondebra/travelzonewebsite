<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SettingsService
{
    private const MASK = '••••••••';

    /** @var array<string, array<string, mixed>> */
    private const DEFINITIONS = [
        'branding' => [
            'site_name' => ['default' => 'ED-AMAD Learning Consult', 'secret' => false],
            'site_tagline' => ['default' => 'NMC exam preparation for nursing professionals', 'secret' => false],
            'logo_url' => ['default' => '', 'secret' => false],
            'primary_color' => ['default' => '#0057FF', 'secret' => false],
            'support_email' => ['default' => 'support@edamad.com', 'secret' => false],
            'frontend_url' => ['default' => 'http://localhost:3000', 'secret' => false],
        ],
        'email' => [
            'mail_mailer' => ['default' => 'log', 'secret' => false],
            'mail_host' => ['default' => '127.0.0.1', 'secret' => false],
            'mail_port' => ['default' => '2525', 'secret' => false],
            'mail_username' => ['default' => '', 'secret' => false],
            'mail_password' => ['default' => '', 'secret' => true],
            'mail_encryption' => ['default' => 'tls', 'secret' => false],
            'mail_from_address' => ['default' => 'noreply@edamad.com', 'secret' => false],
            'mail_from_name' => ['default' => 'ED-AMAD Learning Consult', 'secret' => false],
        ],
        'email_templates' => [
            'tpl_welcome_subject' => ['default' => 'Welcome to {site_name}', 'secret' => false],
            'tpl_welcome_body' => ['default' => 'Hello {name}, welcome to {site_name}. Start learning today from your dashboard.', 'secret' => false],
            'tpl_password_reset_subject' => ['default' => 'Reset your {site_name} password', 'secret' => false],
            'tpl_password_reset_body' => ['default' => 'Use the link below to reset your password. This link expires in 60 minutes.', 'secret' => false],
            'tpl_enrollment_subject' => ['default' => 'You are enrolled in {course_name}', 'secret' => false],
            'tpl_enrollment_body' => ['default' => 'Hi {name}, you now have access to {course_name}. Continue learning from your dashboard.', 'secret' => false],
            'tpl_announcement_subject_prefix' => ['default' => '[Announcement]', 'secret' => false],
        ],
        'paystack' => [
            'paystack_enabled' => ['default' => 'false', 'secret' => false],
            'paystack_public_key' => ['default' => '', 'secret' => true],
            'paystack_secret_key' => ['default' => '', 'secret' => true],
            'paystack_currency' => ['default' => 'GHS', 'secret' => false],
            'payment_processing_fee' => ['default' => '15', 'secret' => false],
        ],
        'security' => [
            'session_lifetime' => ['default' => '120', 'secret' => false],
            'require_email_verification' => ['default' => 'true', 'secret' => false],
            'max_login_attempts' => ['default' => '5', 'secret' => false],
            'password_min_length' => ['default' => '8', 'secret' => false],
            'sanctum_expiration' => ['default' => '', 'secret' => false],
        ],
    ];

    public function definitions(): array
    {
        return self::DEFINITIONS;
    }

    public function get(string $key, ?string $default = null): ?string
    {
        $cached = Cache::rememberForever("setting.{$key}", function () use ($key, $default) {
            $row = Setting::query()->where('key', $key)->first();

            if ($row) {
                return $row->value;
            }

            foreach (self::DEFINITIONS as $group => $items) {
                if (isset($items[$key])) {
                    return (string) $items[$key]['default'];
                }
            }

            return $default;
        });

        return $cached;
    }

    public function groupedForAdmin(): array
    {
        $stored = Setting::query()->get()->keyBy('key');
        $groups = [];

        foreach (self::DEFINITIONS as $group => $items) {
            $groups[$group] = [];
            foreach ($items as $key => $meta) {
                $row = $stored->get($key);
                $value = $row?->value ?? (string) $meta['default'];
                $isSecret = (bool) $meta['secret'];

                $groups[$group][$key] = [
                    'value' => $isSecret && $value !== '' ? self::MASK : $value,
                    'is_secret' => $isSecret,
                    'has_value' => $isSecret ? ($row && $row->value !== '') : true,
                ];
            }
        }

        return $groups;
    }

    public function updateGroup(string $group, array $values): void
    {
        abort_unless(isset(self::DEFINITIONS[$group]), 422, 'Invalid settings group.');

        foreach (self::DEFINITIONS[$group] as $key => $meta) {
            if (! array_key_exists($key, $values)) {
                continue;
            }

            $incoming = $values[$key];
            if ($incoming === null) {
                continue;
            }

            $incoming = trim((string) $incoming);

            if ($meta['secret'] && ($incoming === '' || $incoming === self::MASK)) {
                continue;
            }

            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'group' => $group,
                    'value' => $incoming,
                    'is_secret' => (bool) $meta['secret'],
                ],
            );

            Cache::forget("setting.{$key}");
        }
    }

    public function applyMailConfig(): void
    {
        config([
            'mail.default' => $this->get('mail_mailer', 'log'),
            'mail.mailers.smtp.host' => $this->get('mail_host'),
            'mail.mailers.smtp.port' => (int) $this->get('mail_port', '2525'),
            'mail.mailers.smtp.username' => $this->get('mail_username'),
            'mail.mailers.smtp.password' => $this->getRawSecret('mail_password'),
            'mail.mailers.smtp.encryption' => $this->get('mail_encryption') ?: null,
            'mail.from.address' => $this->get('mail_from_address'),
            'mail.from.name' => $this->get('mail_from_name'),
        ]);
    }

    public function paystackConfig(): array
    {
        return [
            'enabled' => filter_var($this->get('paystack_enabled', 'false'), FILTER_VALIDATE_BOOLEAN),
            'public_key' => $this->get('paystack_public_key', ''),
            'secret_key' => $this->getRawSecret('paystack_secret_key'),
            'currency' => $this->get('paystack_currency', 'GHS'),
            'processing_fee' => (int) $this->get('payment_processing_fee', '15'),
        ];
    }

    public function verifyPaystackKeys(): array
    {
        $config = $this->paystackConfig();
        $public = $config['public_key'];
        $secret = $config['secret_key'];

        if ($public === '' || $secret === '') {
            return ['ok' => false, 'message' => 'Public and secret keys are required.'];
        }

        if (! str_starts_with($public, 'pk_') || ! str_starts_with($secret, 'sk_')) {
            return ['ok' => false, 'message' => 'Invalid Paystack key format. Public keys start with pk_ and secret keys with sk_.'];
        }

        try {
            $response = Http::withToken($secret)
                ->timeout(10)
                ->get('https://api.paystack.co/transaction/totals');

            if ($response->successful()) {
                return ['ok' => true, 'message' => 'Paystack keys verified successfully.'];
            }

            $message = $response->json('message') ?? 'Paystack rejected the secret key.';

            return ['ok' => false, 'message' => $message];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Could not reach Paystack: '.$e->getMessage()];
        }
    }

    private function getRawSecret(string $key): string
    {
        $row = Setting::query()->where('key', $key)->first();
        if ($row && $row->value !== '') {
            return $row->value;
        }

        foreach (self::DEFINITIONS as $items) {
            if (isset($items[$key])) {
                return (string) $items[$key]['default'];
            }
        }

        return '';
    }

    public function interpolate(string $template, array $vars = []): string
    {
        $vars = array_merge([
            'site_name' => $this->get('site_name', 'ED-AMAD Learning Consult'),
        ], $vars);

        $output = $template;
        foreach ($vars as $name => $value) {
            $output = str_replace('{'.$name.'}', (string) $value, $output);
        }

        return $output;
    }
}
