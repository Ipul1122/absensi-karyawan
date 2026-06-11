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

#[Fillable(['name', 'email', 'password', 'role', 'password_plain', 'photo', 'date_of_birth', 'address', 'employee_number', 'join_date', 'gender', 'division', 'cv', 'status'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

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
        ];
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
     * Get the sales visits for the user.
     */
    public function salesVisits()
    {
        return $this->hasMany(SalesVisit::class);
    }
}

