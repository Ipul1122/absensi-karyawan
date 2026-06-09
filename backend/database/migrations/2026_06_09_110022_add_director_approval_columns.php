<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add status to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('status')->default('active'); // active, pending, pending_delete
        });

        // Add pending columns to salary_configurations
        Schema::table('salary_configurations', function (Blueprint $table) {
            $table->decimal('pending_basic_salary', 15, 2)->nullable();
            $table->decimal('pending_allowance_meal_daily', 15, 2)->nullable();
            $table->decimal('pending_allowance_transport_daily', 15, 2)->nullable();
            $table->decimal('pending_allowance_position', 15, 2)->nullable();
            $table->decimal('pending_deduction_late_daily', 15, 2)->nullable();
            $table->decimal('pending_deduction_absence_daily', 15, 2)->nullable();
            $table->decimal('pending_deduction_fixed', 15, 2)->nullable();
            $table->string('salary_change_status')->default('none'); // none, pending, approved, rejected
        });

        // Add status to bonuses
        Schema::table('bonuses', function (Blueprint $table) {
            $table->string('status')->default('approved'); // pending, approved, rejected
        });

        // Add approval_status to attendances
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('approval_status')->default('approved'); // approved, pending, rejected
        });

        // Change payrolls status to string to allow 'pending_approval'
        Schema::table('payrolls', function (Blueprint $table) {
            $table->string('status')->default('draft')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->enum('status', ['draft', 'unpaid', 'paid'])->default('draft')->change();
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn('approval_status');
        });

        Schema::table('bonuses', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('salary_configurations', function (Blueprint $table) {
            $table->dropColumn([
                'pending_basic_salary',
                'pending_allowance_meal_daily',
                'pending_allowance_transport_daily',
                'pending_allowance_position',
                'pending_deduction_late_daily',
                'pending_deduction_absence_daily',
                'pending_deduction_fixed',
                'salary_change_status'
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
