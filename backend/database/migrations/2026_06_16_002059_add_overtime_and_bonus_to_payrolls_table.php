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
        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('allowance_overtime', 15, 2)->default(0)->after('allowance_position'); // Lembur
            $table->decimal('allowance_bonus', 15, 2)->default(0)->after('allowance_overtime'); // Bonus
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn(['allowance_overtime', 'allowance_bonus']);
        });
    }
};
