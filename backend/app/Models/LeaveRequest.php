<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'category',
    'custom_category',
    'start_date',
    'end_date',
    'reason',
    'image',
    'status',
    'admin_notes',
])]
class LeaveRequest extends Model
{
    use \App\Traits\RecycleBinable;

    protected static function boot()
    {
        parent::boot();
        static::forceDeleted(function ($leave) {
            if ($leave->image) {
                $storagePath = str_replace('/storage/', '', $leave->image);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($storagePath);
            }
        });
    }

    /**
     * Get the user that owns the leave request.
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
        $cat = $this->category === 'other' ? $this->custom_category : $this->category;
        return "Cuti/Izin: " . $userName . " - " . ucfirst($cat ?: '') . " (" . $this->start_date . " s/d " . $this->end_date . ")";
    }
}
