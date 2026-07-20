<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Services\SettingsService;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(SettingsService::class);

        foreach ($service->definitions() as $group => $items) {
            foreach ($items as $key => $meta) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'group' => $group,
                        'value' => (string) $meta['default'],
                        'is_secret' => (bool) $meta['secret'],
                    ],
                );
            }
        }
    }
}
