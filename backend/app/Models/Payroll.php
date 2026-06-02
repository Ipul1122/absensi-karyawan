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
    'deduction_late',
    'deduction_fixed',
    'net_salary',
    'status',
    'paid_at',
    'notes'
])]
class Payroll extends Model
{
    protected $casts = [
        'paid_at' => 'datetime',
        'basic_salary' => 'double',
        'allowance_meal' => 'double',
        'allowance_transport' => 'double',
        'allowance_fixed' => 'double',
        'allowance_position' => 'double',
        'deduction_late' => 'double',
        'deduction_fixed' => 'double',
        'net_salary' => 'double',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
