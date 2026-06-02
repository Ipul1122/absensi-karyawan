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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('period_month'); // Format: YYYY-MM (misal: '2026-06')
            $table->integer('days_present')->default(0); // Jumlah hari hadir
            $table->integer('days_late')->default(0); // Jumlah hari telat
            $table->integer('days_leave')->default(0); // Jumlah hari cuti disetujui
            $table->decimal('basic_salary', 15, 2); // Salinan Gaji Pokok saat generate
            $table->decimal('allowance_transport', 15, 2); // days_present * allowance_transport_daily
            $table->decimal('allowance_fixed', 15, 2); // Salinan Tunjangan Tetap
            $table->decimal('deduction_late', 15, 2); // days_late * deduction_late_daily
            $table->decimal('deduction_fixed', 15, 2); // Salinan Potongan Tetap
            $table->decimal('net_salary', 15, 2); // Total Bersih = (Gaji Pokok + Tunjangan) - Potongan
            $table->enum('status', ['draft', 'unpaid', 'paid'])->default('draft');
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Unik per user per bulan
            $table->unique(['user_id', 'period_month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
