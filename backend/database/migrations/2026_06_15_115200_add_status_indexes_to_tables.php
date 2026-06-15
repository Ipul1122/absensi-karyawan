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
            $table->index('role');
            $table->index('status');
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('overtimes', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('reimbursements', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('bonuses', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('inventories', function (Blueprint $table) {
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['status']);
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('overtimes', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('reimbursements', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('bonuses', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('inventories', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
