<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\PushSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class SendAttendanceReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:send-reminders {type=in : The reminder type, either "in" for check-in or "out" for check-out}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mengirim notifikasi push pengingat absensi masuk/pulang ke handphone karyawan sesuai jadwal kerja mereka';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->argument('type');
        if (!in_array($type, ['in', 'out'])) {
            $this->error('Argumen type harus berupa "in" atau "out".');
            return 1;
        }

        $today = now()->toDateString();
        $dayOfWeek = now()->dayOfWeek; // 0 = Minggu, 6 = Sabtu, 1 = Senin, dst.

        $this->info("Menjalankan pengingat absensi: Type={$type}, Tanggal={$today}, Hari={$dayOfWeek}");

        $vapidPublicKey = env('VAPID_PUBLIC_KEY');
        $vapidPrivateKey = env('VAPID_PRIVATE_KEY');

        if (empty($vapidPublicKey) || empty($vapidPrivateKey)) {
            $this->error('Kunci VAPID belum dikonfigurasi di file .env.');
            return 1;
        }

        $auth = [
            'VAPID' => [
                'subject' => 'mailto:admin@absensi.karyawan.com',
                'publicKey' => $vapidPublicKey,
                'privateKey' => $vapidPrivateKey,
            ],
        ];

        // Dapatkan karyawan aktif
        $employees = User::where('role', 'employee')
            ->where('status', 'active')
            ->with(['attendances' => function ($query) use ($today) {
                $query->whereDate('date', $today);
            }, 'pushSubscriptions'])
            ->get();

        $webPush = null;
        try {
            $webPush = new WebPush($auth);
        } catch (\Exception $e) {
            $this->error('Gagal menginisialisasi WebPush: ' . $e->getMessage());
            return 1;
        }

        $sentCount = 0;

        foreach ($employees as $employee) {
            // Evaluasi apakah hari ini adalah jadwal libur mingguan karyawan
            $isSatOff = (bool) $employee->saturday_off;
            $isSunOff = $employee->sunday_off !== false;
            $isOffDay = ($dayOfWeek === 6 && $isSatOff) || ($dayOfWeek === 0 && $isSunOff);

            if ($isOffDay) {
                $this->line("Karyawan {$employee->name} hari ini libur mingguan. Skip.");
                continue;
            }

            // Dapatkan kehadiran hari ini
            $attendance = $employee->attendances->first();

            $shouldRemind = false;
            $title = '';
            $body = '';

            if ($type === 'in') {
                // Pengingat absen masuk: jika belum ada catatan kehadiran atau belum clock_in
                if (!$attendance || !$attendance->clock_in) {
                    $shouldRemind = true;
                    $title = 'Pengingat Absen Masuk 🕒';
                    $body = "Halo {$employee->name}, jangan lupa untuk melakukan absen masuk hari ini sebelum pukul 08:30!";
                }
            } else {
                // Pengingat absen pulang: jika sudah clock_in tetapi belum clock_out
                if ($attendance && $attendance->clock_in && !$attendance->clock_out) {
                    $shouldRemind = true;
                    $title = 'Pengingat Absen Pulang 🏢';
                    $body = "Halo {$employee->name}, Anda telah menyelesaikan jam kerja. Jangan lupa untuk melakukan absen pulang!";
                }
            }

            if ($shouldRemind && $employee->pushSubscriptions->isNotEmpty()) {
                $payload = json_encode([
                    'title' => $title,
                    'body' => $body,
                    'url' => '/employee/dashboard'
                ]);

                foreach ($employee->pushSubscriptions as $sub) {
                    $webPush->queueNotification(
                        Subscription::create([
                            'endpoint' => $sub->endpoint,
                            'publicKey' => $sub->public_key,
                            'authToken' => $sub->auth_token,
                            'contentEncoding' => $sub->content_encoding,
                        ]),
                        $payload
                    );
                    $sentCount++;
                }
            }
        }

        if ($sentCount > 0) {
            $results = $webPush->flush();
            $success = 0;
            $failed = 0;
            $expiredEndpoints = [];

            foreach ($results as $report) {
                if ($report->isSuccess()) {
                    $success++;
                } else {
                    $failed++;
                    if ($report->isSubscriptionExpired()) {
                        $expiredEndpoints[] = $report->getEndpoint();
                    }
                    Log::warning('Reminder Web Push gagal: ' . $report->getReason());
                }
            }

            if (!empty($expiredEndpoints)) {
                PushSubscription::whereIn('endpoint', $expiredEndpoints)->delete();
            }

            $this->info("Pengingat dikirim. Sukses: {$success}, Gagal: {$failed}");
            Log::info("Pengingat absensi otomatis dikirim. Sukses: {$success}, Gagal: {$failed}");
        } else {
            $this->info('Tidak ada karyawan yang perlu diingatkan atau tidak ada subscription aktif.');
        }

        return 0;
    }
}
