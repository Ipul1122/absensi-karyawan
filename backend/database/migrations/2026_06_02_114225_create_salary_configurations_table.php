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
        Schema::create('salary_configurations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('basic_salary', 15, 2)->default(0); // Gaji Pokok
            $table->decimal('allowance_transport_daily', 15, 2)->default(0); // Tunjangan transport per hari hadir
            $table->decimal('allowance_fixed', 15, 2)->default(0); // Tunjangan tetap bulanan (misal tunjangan jabatan)
            $table->decimal('deduction_late_daily', 15, 2)->default(0); // Potongan per hari terlambat
            $table->decimal('deduction_fixed', 15, 2)->default(0); // Potongan tetap bulanan (misal BPJS/asuransi)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_configurations');
    }
};
