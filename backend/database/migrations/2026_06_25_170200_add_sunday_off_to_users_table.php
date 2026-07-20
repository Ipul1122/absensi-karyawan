<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('saturday_off')->default(false)->after('whatsapp');
            $table->boolean('sunday_off')->default(true)->after('saturday_off');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['saturday_off', 'sunday_off']);
        });
    }
};
