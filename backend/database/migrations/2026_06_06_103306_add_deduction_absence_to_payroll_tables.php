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
            $table->decimal('deduction_absence_daily', 15, 2)->default(0)->after('deduction_late_daily');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('deduction_absence', 15, 2)->default(0)->after('deduction_late');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_configurations', function (Blueprint $table) {
            $table->dropColumn('deduction_absence_daily');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn('deduction_absence');
        });
    }
};
