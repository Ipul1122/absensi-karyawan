<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'webpush:generate-keys {--force : Menimpa kunci yang sudah ada di file .env}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate VAPID Public dan Private keys untuk Web Push Notification dan menyimpannya di file .env';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        $envPath = base_path('.env');

        if (!file_exists($envPath)) {
            $this->error('File .env tidak ditemukan.');
            return 1;
        }

        $envContent = file_get_contents($envPath);
        $hasPublicKey = str_contains($envContent, 'VAPID_PUBLIC_KEY=');
        $hasPrivateKey = str_contains($envContent, 'VAPID_PRIVATE_KEY=');

        if (($hasPublicKey || $hasPrivateKey) && !$force) {
            $this->warn('Kunci VAPID sudah ada di file .env Anda.');
            $this->line('Gunakan opsi --force untuk menimpa kunci lama.');
            return 0;
        }

        try {
            $keys = VAPID::createVapidKeys();
            $publicKey = $keys['publicKey'];
            $privateKey = $keys['privateKey'];

            // Hapus baris lama jika ada
            if ($hasPublicKey) {
                $envContent = preg_replace('/VAPID_PUBLIC_KEY=.*/', 'VAPID_PUBLIC_KEY="' . $publicKey . '"', $envContent);
            } else {
                $envContent .= "\nVAPID_PUBLIC_KEY=\"" . $publicKey . "\"";
            }

            if ($hasPrivateKey) {
                $envContent = preg_replace('/VAPID_PRIVATE_KEY=.*/', 'VAPID_PRIVATE_KEY="' . $privateKey . '"', $envContent);
            } else {
                $envContent .= "\nVAPID_PRIVATE_KEY=\"" . $privateKey . "\"";
            }

            file_put_contents($envPath, $envContent);

            $this->info('Kunci VAPID berhasil di-generate dan disimpan ke file .env!');
            $this->line('Public Key: ' . $publicKey);
            $this->line('Private Key: [TERSEMBUNYI]');

            return 0;
        } catch (\Exception $e) {
            $this->error('Gagal men-generate kunci VAPID: ' . $e->getMessage());
            return 1;
        }
    }
}
