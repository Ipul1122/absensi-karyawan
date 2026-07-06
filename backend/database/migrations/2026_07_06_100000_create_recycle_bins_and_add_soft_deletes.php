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
        // 1. Create recycle_bins table
        Schema::create('recycle_bins', function (Blueprint $table) {
            $table->id();
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->string('display_name');
            $table->timestamp('deleted_at')->useCurrent();
            $table->timestamps();

            $table->index(['model_type', 'model_id']);
        });

        // 2. Add deleted_at column to all target tables
        $tables = [
            'users', 
            'holidays', 
            'shifts', 
            'inventories', 
            'leave_requests', 
            'reimbursements', 
            'bonuses', 
            'overtimes', 
            'payrolls'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->softDeletes();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop recycle_bins table
        Schema::dropIfExists('recycle_bins');

        // 2. Drop deleted_at column from target tables
        $tables = [
            'users', 
            'holidays', 
            'shifts', 
            'inventories', 
            'leave_requests', 
            'reimbursements', 
            'bonuses', 
            'overtimes', 
            'payrolls'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropSoftDeletes();
                });
            }
        }
    }
};
