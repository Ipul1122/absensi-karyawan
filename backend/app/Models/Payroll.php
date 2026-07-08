<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'period_month',
    'days_present',
    'days_late',
    'days_leave',
    'basic_salary',
    'allowance_meal',
    'allowance_transport',
    'allowance_fixed',
    'allowance_position',
    'allowance_overtime',
    'allowance_bonus',
    'deduction_late',
    'deduction_fixed',
    'deduction_absence',
    'net_salary',
    'status',
    'paid_at',
    'notes'
])]
class Payroll extends Model
{
    use \App\Traits\RecycleBinable;

    protected $casts = [
        'paid_at' => 'datetime',
        'basic_salary' => 'double',
        'allowance_meal' => 'double',
        'allowance_transport' => 'double',
        'allowance_fixed' => 'double',
        'allowance_position' => 'double',
        'allowance_overtime' => 'double',
        'allowance_bonus' => 'double',
        'deduction_late' => 'double',
        'deduction_fixed' => 'double',
        'deduction_absence' => 'double',
        'net_salary' => 'double',
    ];

    protected $appends = ['verification_hash'];

    public function getVerificationHashAttribute(): string
    {
        // Generate a secure hash using the payroll ID, user ID, period month, and the application key as secret salt
        return substr(hash_hmac('sha256', $this->id . '-' . $this->user_id . '-' . $this->period_month, config('app.key')), 0, 32);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get a user-friendly name for this specific record in the Recycle Bin.
     */
    public function getRecycleBinName(): string
    {
        $userName = $this->user ? $this->user->name : ('User ID: ' . $this->user_id);
        return "Gaji/Payroll: " . $userName . " - Periode " . $this->period_month . " (Rp " . number_format($this->net_salary, 0, ',', '.') . ")";
    }
}
