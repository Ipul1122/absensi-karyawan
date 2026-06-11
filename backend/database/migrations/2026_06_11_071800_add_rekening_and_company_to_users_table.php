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
        Schema::table('users', function (Blueprint $table) {
            $table->string('no_rekening', 50)->nullable()->after('cv');
            $table->enum('company', [
                'PT Cakrawala Parama Internasional',
                'PT Yasodana Parvez Internasional',
            ])->nullable()->after('no_rekening');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['no_rekening', 'company']);
        });
    }
};
