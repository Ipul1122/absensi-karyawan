<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'whatsapp', 'password', 'password_plain', 'role', 'photo', 'date_of_birth', 'address', 'employee_number', 'join_date', 'gender', 'division', 'cv', 'status', 'no_rekening', 'company', 'saturday_off', 'sunday_off', 'office_location'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, \App\Traits\RecycleBinable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'saturday_off' => 'boolean',
            'sunday_off' => 'boolean',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * The "booted" method of the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($user) {
            if (method_exists($user, 'isForceDeleting') && !$user->isForceDeleting()) {
                return;
            }

            // Delete user's own profile photo
            if ($user->photo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $user->photo));
            }

            // Delete user's CV document
            if ($user->cv) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $user->cv));
            }

            // Delete related attendance photos (photo_in and photo_out)
            $user->attendances()->each(function ($attendance) {
                if ($attendance->photo_in) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $attendance->photo_in));
                }
                if ($attendance->photo_out) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $attendance->photo_out));
                }
            });

            // Delete related leave request attachment images
            $user->leaveRequests()->each(function ($leave) {
                if ($leave->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $leave->image));
                }
            });

            // Delete related reimbursement receipt files
            $user->reimbursements()->each(function ($reimbursement) {
                if ($reimbursement->receipt_path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $reimbursement->receipt_path));
                }
            });

            // Delete related sales visit photos
            $user->salesVisits()->each(function ($visit) {
                if ($visit->photo_path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $visit->photo_path));
                }
            });
        });
    }

    /**
     * Get the attendances for the user.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get the leave requests for the user.
     */
    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /**
     * Get the salary configuration associated with the user.
     */
    public function salaryConfiguration()
    {
        return $this->hasOne(SalaryConfiguration::class);
    }

    /**
     * Get the payrolls for the user.
     */
    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }

    /**
     * Get the reimbursements for the user.
     */
    public function reimbursements()
    {
        return $this->hasMany(Reimbursement::class);
    }

    /**
     * Get the bonuses for the user.
     */
    public function bonuses()
    {
        return $this->hasMany(Bonus::class);
    }

    /**
     * Get the overtime requests for the user.
     */
    public function overtimes()
    {
        return $this->hasMany(Overtime::class);
    }

    /**
     * Get the sales visits for the user.
     */
    public function salesVisits()
    {
        return $this->hasMany(SalesVisit::class);
    }

    /**
     * Get the push subscriptions for the user.
     */
    public function pushSubscriptions()
    {
        return $this->hasMany(PushSubscription::class);
    }

    /**
     * Get a user-friendly name for this specific record in the Recycle Bin.
     */
    public function getRecycleBinName(): string
    {
        return "Karyawan: " . $this->name . " (" . $this->email . ")";
    }
}

