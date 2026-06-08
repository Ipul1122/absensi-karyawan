<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'title',
    'category',
    'amount',
    'expense_date',
    'description',
    'receipt_path',
    'status',
    'admin_notes'
])]
class Reimbursement extends Model
{
    protected $casts = [
        'amount' => 'double',
        'expense_date' => 'date',
    ];

    /**
     * Get the user that owns the reimbursement request.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
