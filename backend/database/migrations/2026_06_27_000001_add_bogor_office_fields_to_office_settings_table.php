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
        Schema::table('office_settings', function (Blueprint $table) {
            $table->string('bogor_latitude')->nullable();
            $table->string('bogor_longitude')->nullable();
            $table->integer('bogor_radius')->nullable()->default(100);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('office_settings', function (Blueprint $table) {
            $table->dropColumn(['bogor_latitude', 'bogor_longitude', 'bogor_radius']);
        });
    }
};
