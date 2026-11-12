<?php

namespace App\Services;

use App\Models\User;
use App\Models\ContractNotification;
use Carbon\Carbon;

class ContractNotificationService
{
    /**
     * Check and create notifications untuk kontrak yang akan habis
     * Default: kontrak yang akan habis dalam 30 hari
     */
    public function checkAndNotifyExpiringContracts($daysThreshold = 30)
    {
        // Cari direktur
        $directors = User::where('role', 'director')->get();

        if ($directors->isEmpty()) {
            return ['status' => 'no_directors', 'message' => 'Tidak ada direktur dalam sistem'];
        }

        // Cari karyawan dengan kontrak yang akan habis
        $expiringEmployees = User::withContractExpiring($daysThreshold)->get();

        $createdNotifications = 0;

        foreach ($expiringEmployees as $employee) {
            $daysRemaining = $employee->getDaysUntilContractEnd();

            foreach ($directors as $director) {
                // Cek apakah notifikasi sudah ada untuk hari yang sama
                $existingNotification = ContractNotification::where('user_id', $employee->id)
                    ->where('director_id', $director->id)
                    ->where('notification_type', 'expiring_soon')
                    ->where('days_remaining', $daysRemaining)
                    ->first();

                if (!$existingNotification) {
                    // Buat notifikasi baru
                    ContractNotification::create([
                        'user_id' => $employee->id,
                        'director_id' => $director->id,
                        'notification_type' => 'expiring_soon',
                        'days_remaining' => $daysRemaining,
                        'is_read' => false,
                        'notified_at' => now(),
                    ]);

                    $createdNotifications++;

                    // Send push notification ke director
                    $this->sendPushNotification($director, $employee, 'expiring_soon', $daysRemaining);
                }
            }
        }

        return [
            'status' => 'success',
            'created_notifications' => $createdNotifications,
            'expiring_employees' => $expiringEmployees->count(),
        ];
    }

    /**
     * Check dan notify untuk kontrak yang sudah habis
     */
    public function checkAndNotifyExpiredContracts()
    {
        $directors = User::where('role', 'director')->get();

        if ($directors->isEmpty()) {
            return ['status' => 'no_directors', 'message' => 'Tidak ada direktur dalam sistem'];
        }

        // Cari karyawan dengan kontrak yang sudah habis
        $expiredEmployees = User::withContractExpired()->get();

        $createdNotifications = 0;

        foreach ($expiredEmployees as $employee) {
            foreach ($directors as $director) {
                // Cek apakah notifikasi sudah ada
                $existingNotification = ContractNotification::where('user_id', $employee->id)
                    ->where('director_id', $director->id)
                    ->where('notification_type', 'expired')
                    ->first();

                if (!$existingNotification) {
                    ContractNotification::create([
                        'user_id' => $employee->id,
                        'director_id' => $director->id,
                        'notification_type' => 'expired',
                        'days_remaining' => 0,
                        'is_read' => false,
                        'notified_at' => now(),
                    ]);

                    $createdNotifications++;

                    $this->sendPushNotification($director, $employee, 'expired', 0);
                }
            }
        }

        return [
            'status' => 'success',
            'created_notifications' => $createdNotifications,
            'expired_employees' => $expiredEmployees->count(),
        ];
    }

    /**
     * Kirim push notification ke director
     */
    private function sendPushNotification($director, $employee, $type, $daysRemaining)
    {
        $subscriptions = $director->pushSubscriptions;

        if ($subscriptions->isEmpty()) {
            return;
        }

        $message = $type === 'expired'
            ? "Kontrak karyawan {$employee->name} SUDAH HABIS sejak {$employee->contract_end_date->format('d-m-Y')}"
            : "Kontrak karyawan {$employee->name} akan habis dalam {$daysRemaining} hari ({$employee->contract_end_date->format('d-m-Y')})";

        foreach ($subscriptions as $subscription) {
            $this->sendWebPush($subscription, $message, $type);
        }
    }

    /**
     * Send web push notification
     */
    private function sendWebPush($subscription, $message, $type)
    {
        try {
            // Implement using Web Push library atau service
            // Untuk sekarang, cukup log saja
            \Log::info('Contract notification sent', [
                'subscription_id' => $subscription->id,
                'message' => $message,
                'type' => $type,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send contract notification', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get pending notifications untuk director
     */
    public function getPendingNotifications($directorId, $limit = 50)
    {
        return ContractNotification::with('user')
            ->where('director_id', $directorId)
            ->where('is_read', false)
            ->orderByDesc('notified_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get all contract notifications untuk director
     */
    public function getAllNotifications($directorId, $type = null)
    {
        $query = ContractNotification::with('user')
            ->where('director_id', $directorId)
            ->orderByDesc('notified_at');

        if ($type) {
            $query->where('notification_type', $type);
        }

        return $query->paginate(20);
    }

    /**
     * Mark notification sebagai read
     */
    public function markAsRead($notificationId, $directorId)
    {
        $notification = ContractNotification::where('id', $notificationId)
            ->where('director_id', $directorId)
            ->first();

        if (!$notification) {
            return null;
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return $notification;
    }

    /**
     * Dapatkan ringkasan kontrak untuk dashboard direktur
     */
    public function getContractSummary($directorId)
    {
        $expiringCount = ContractNotification::where('director_id', $directorId)
            ->where('notification_type', 'expiring_soon')
            ->where('is_read', false)
            ->count();

        $expiredCount = ContractNotification::where('director_id', $directorId)
            ->where('notification_type', 'expired')
            ->where('is_read', false)
            ->count();

        $allContractEmployees = User::where('contract_status', 'contract')
            ->where('contract_end_date', '!=', null)
            ->count();

        return [
            'total_contract_employees' => $allContractEmployees,
            'expiring_soon_unread' => $expiringCount,
            'expired_unread' => $expiredCount,
            'total_pending' => $expiringCount + $expiredCount,
        ];
    }
}
