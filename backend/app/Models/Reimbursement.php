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
    use \App\Traits\RecycleBinable;

    protected static function boot()
    {
        parent::boot();
        static::forceDeleted(function ($reimbursement) {
            if ($reimbursement->receipt_path) {
                $storagePath = str_replace('/storage/', '', $reimbursement->receipt_path);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($storagePath);
            }
        });
    }

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

    /**
     * Get a user-friendly name for this specific record in the Recycle Bin.
     */
    public function getRecycleBinName(): string
    {
        $userName = $this->user ? $this->user->name : ('User ID: ' . $this->user_id);
        return "Reimbursement: " . $userName . " - " . $this->title . " (Rp " . number_format($this->amount, 0, ',', '.') . ")";
    }
}
