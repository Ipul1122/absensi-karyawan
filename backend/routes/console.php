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

