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
        Schema::table('salary_configurations', function (Blueprint $table) {
            $table->decimal('allowance_meal_daily', 15, 2)->default(0)->after('basic_salary'); // Tunjangan makan per hari
            $table->decimal('allowance_position', 15, 2)->default(0)->after('allowance_fixed'); // Tunjangan jabatan
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('allowance_meal', 15, 2)->default(0)->after('basic_salary'); // Total tunjangan makan
            $table->decimal('allowance_position', 15, 2)->default(0)->after('allowance_fixed'); // Total tunjangan jabatan
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_configurations', function (Blueprint $table) {
            $table->dropColumn(['allowance_meal_daily', 'allowance_position']);
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn(['allowance_meal', 'allowance_position']);
        });
    }
};
