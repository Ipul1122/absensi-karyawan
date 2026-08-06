<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Carbon\Carbon;
use App\Models\User;
use App\Models\Attendance;

$name = $argv[1] ?? 'Wahyu Nur Agustusanto';
$period = $argv[2] ?? '2026-08'; // Format: YYYY-MM

$user = User::where('name', 'like', "%$name%")->first();
if (!$user) {
    echo "Employee not found: $name\n";
    exit(1);
}

echo "Simulating full attendance for: {$user->name} in $period\n";

$start = Carbon::parse($period . '-01')->startOfMonth();
$end = Carbon::parse($period . '-01')->endOfMonth();

$isSatOff = (bool)$user->saturday_off;
$isSunOff = $user->sunday_off !== false;

$tempDate = $start->copy();
$addedCount = 0;
while ($tempDate->lte($end)) {
    $isOff = false;
    if ($tempDate->isSunday() && $isSunOff) {
        $isOff = true;
    } elseif ($tempDate->isSaturday() && $isSatOff) {
        $isOff = true;
    }

    if (!$isOff) {
        // Insert or update attendance
        Attendance::updateOrCreate(
            [
                'user_id' => $user->id,
                'date' => $tempDate->toDateString(),
            ],
            [
                'clock_in' => '08:00:00',
                'clock_out' => '17:00:00',
                'status_in' => 'normal',
                'status_out' => 'normal',
                'approval_status' => 'approved',
                'attendance_type' => 'present',
            ]
        );
        $addedCount++;
    }
    $tempDate->addDay();
}

echo "Successfully added/updated $addedCount attendance records for {$user->name}.\n";
