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
            $table->date('contract_end_date')->nullable()->after('join_date')->comment('Tanggal berakhirnya masa kontrak');
            $table->enum('contract_status', ['permanent', 'contract'])->default('permanent')->after('contract_end_date')->comment('Status kontrak (permanent/contract)');
            $table->integer('days_until_contract_end')->nullable()->after('contract_status')->comment('Sisa hari kontrak (auto-calculated)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['contract_end_date', 'contract_status', 'days_until_contract_end']);
        });
    }
};
