<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pengingat absensi otomatis sesuai jadwal kerja karyawan (dikirim sebelum jam 8:30)
Schedule::command('attendance:send-reminders in')->dailyAt('08:00');
Schedule::command('attendance:send-reminders out')->dailyAt('17:30');

// Bersihkan data recycle bin yang berumur lebih dari 30 hari secara permanen
Schedule::call(function () {
    $expired = \App\Models\RecycleBin::where('deleted_at', '<', now()->subDays(30))->get();
    foreach ($expired as $item) {
        $modelClass = $item->model_type;
        try {
            if (class_exists($modelClass)) {
                $model = $modelClass::onlyTrashed()->find($item->model_id);
                if ($model) {
                    $model->forceDelete();
                }
            }
        } catch (\Exception $e) {
            // Ignore
        }
        $item->delete();
    }
})->daily();


