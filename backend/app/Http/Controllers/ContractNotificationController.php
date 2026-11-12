<?php

namespace App\Http\Controllers;

use App\Models\ContractNotification;
use App\Services\ContractNotificationService;
use Illuminate\Http\Request;

class ContractNotificationController extends Controller
{
    protected $contractNotificationService;

    public function __construct(ContractNotificationService $contractNotificationService)
    {
        $this->contractNotificationService = $contractNotificationService;
    }

    /**
     * Get pending contract notifications untuk director
     */
    public function getPendingNotifications(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'director') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notifications = $this->contractNotificationService->getPendingNotifications($user->id);

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
            'count' => $notifications->count(),
        ]);
    }

    /**
     * Get semua contract notifications dengan pagination
     */
    public function getAllNotifications(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'director') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $type = $request->query('type'); // 'expiring_soon' atau 'expired'
        $notifications = $this->contractNotificationService->getAllNotifications($user->id, $type);

        return response()->json([
            'status' => 'success',
            'data' => $notifications->items(),
            'pagination' => [
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
            ],
        ]);
    }

    /**
     * Mark notification sebagai read
     */
    public function markAsRead(Request $request, $notificationId)
    {
        $user = $request->user();

        if ($user->role !== 'director') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification = $this->contractNotificationService->markAsRead($notificationId, $user->id);

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read',
            'data' => $notification,
        ]);
    }

    /**
     * Mark all notifications sebagai read
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'director') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $updated = ContractNotification::where('director_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read',
            'updated_count' => $updated,
        ]);
    }

    /**
     * Get contract summary untuk dashboard
     */
    public function getContractSummary(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'director') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $summary = $this->contractNotificationService->getContractSummary($user->id);

        return response()->json([
            'status' => 'success',
            'data' => $summary,
        ]);
    }

    /**
     * Get detail karyawan dengan kontrak yang akan/sudah habis
     */
    public function getContractEmployeeDetails(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'director') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $type = $request->query('type'); // 'expiring' atau 'expired'
        $query = \App\Models\User::with('push Subscriptions');

        if ($type === 'expired') {
            $query->withContractExpired();
        } elseif ($type === 'expiring') {
            $query->withContractExpiring();
        } else {
            $query->contractEmployees();
        }

        $employees = $query->select('id', 'name', 'email', 'employee_number', 'contract_end_date', 'contract_status', 'division')
            ->orderBy('contract_end_date', 'asc')
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'email' => $emp->email,
                    'employee_number' => $emp->employee_number,
                    'division' => $emp->division,
                    'contract_end_date' => $emp->contract_end_date,
                    'days_remaining' => $emp->getDaysUntilContractEnd(),
                    'is_expired' => $emp->isContractExpired(),
                ];
            });

        return response()->json([
            'status' => 'success',
            'type' => $type,
            'count' => $employees->count(),
            'data' => $employees,
        ]);
    }

    /**
     * Admin endpoint: trigger manual check untuk kontrak
     */
    public function triggerContractCheck(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Only admin can trigger manual check'], 403);
        }

        $daysThreshold = $request->input('days_threshold', 30);

        $expiringResult = $this->contractNotificationService->checkAndNotifyExpiringContracts($daysThreshold);
        $expiredResult = $this->contractNotificationService->checkAndNotifyExpiredContracts();

        return response()->json([
            'status' => 'success',
            'expiring_check' => $expiringResult,
            'expired_check' => $expiredResult,
        ]);
    }
}
