<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationController extends Controller
{
    /**
     * Store or update a push subscription.
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
            'content_encoding' => 'nullable|string',
        ]);

        $user = $request->user();

        $subscription = PushSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'endpoint' => $request->endpoint,
            ],
            [
                'public_key' => $request->input('keys.p256dh'),
                'auth_token' => $request->input('keys.auth'),
                'content_encoding' => $request->input('content_encoding', 'aes128gcm'),
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Subscription berhasil didaftarkan.',
            'data' => $subscription
        ]);
    }

    /**
     * Remove a push subscription.
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|url',
        ]);

        $user = $request->user();

        PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $request->endpoint)
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Subscription berhasil dihapus.'
        ]);
    }

    /**
     * Send a test push notification to the current user.
     */
    public function sendTestNotification(Request $request)
    {
        $user = $request->user();
        $subscriptions = $user->pushSubscriptions;

        if ($subscriptions->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda belum mengaktifkan notifikasi push di perangkat ini atau perangkat lainnya.'
            ], 400);
        }

        $vapidPublicKey = config('webpush.vapid.public_key');
        $vapidPrivateKey = config('webpush.vapid.private_key');

        if (empty($vapidPublicKey) || empty($vapidPrivateKey)) {
            // Coba ambil dari env jika belum terkonfigurasi di config
            $vapidPublicKey = env('VAPID_PUBLIC_KEY');
            $vapidPrivateKey = env('VAPID_PRIVATE_KEY');
        }

        if (empty($vapidPublicKey) || empty($vapidPrivateKey)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kunci VAPID belum dikonfigurasi di server (.env).'
            ], 500);
        }

        $auth = [
            'VAPID' => [
                'subject' => 'mailto:admin@absensi.karyawan.com',
                'publicKey' => $vapidPublicKey,
                'privateKey' => $vapidPrivateKey,
            ],
        ];

        try {
            $webPush = new WebPush($auth);
            $payload = json_encode([
                'title' => 'Uji Coba Notifikasi',
                'body' => 'Halo ' . $user->name . '! Notifikasi push absensi Anda telah aktif di perangkat ini. 🚀',
                'url' => '/employee/dashboard'
            ]);

            foreach ($subscriptions as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->public_key,
                        'authToken' => $sub->auth_token,
                        'contentEncoding' => $sub->content_encoding,
                    ]),
                    $payload
                );
            }

            $results = $webPush->flush();
            $successCount = 0;
            $failedCount = 0;
            $expiredEndpoints = [];

            foreach ($results as $report) {
                if ($report->isSuccess()) {
                    $successCount++;
                } else {
                    $failedCount++;
                    if ($report->isSubscriptionExpired()) {
                        $expiredEndpoints[] = $report->getEndpoint();
                    }
                    Log::warning('Gagal mengirim Web Push: ' . $report->getReason());
                }
            }

            if (!empty($expiredEndpoints)) {
                PushSubscription::whereIn('endpoint', $expiredEndpoints)->delete();
            }

            return response()->json([
                'status' => 'success',
                'message' => "Notifikasi uji coba dikirim. Sukses: {$successCount}, Gagal: {$failedCount}"
            ]);

        } catch (\Exception $e) {
            Log::error('Kesalahan pengiriman Web Push: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan internal: ' . $e->getMessage()
            ], 500);
        }
    }
}
