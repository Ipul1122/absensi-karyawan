<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'basic_salary',
    'allowance_meal_daily',
    'allowance_transport_daily',
    'allowance_fixed',
    'allowance_position',
    'deduction_late_daily',
    'deduction_absence_daily',
    'deduction_fixed',
    'pending_basic_salary',
    'pending_allowance_meal_daily',
    'pending_allowance_transport_daily',
    'pending_allowance_position',
    'pending_deduction_late_daily',
    'pending_deduction_absence_daily',
    'pending_deduction_fixed',
    'salary_change_status'
])]
class SalaryConfiguration extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
