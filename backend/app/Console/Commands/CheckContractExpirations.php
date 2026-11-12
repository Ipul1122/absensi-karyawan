<?php

namespace App\Console\Commands;

use App\Services\ContractNotificationService;
use Illuminate\Console\Command;

class CheckContractExpirations extends Command
{
    protected $signature = 'contract:check-expirations {--days=30 : Days threshold for expiring contracts}';

    protected $description = 'Check and notify directors about contract expirations';

    protected $contractNotificationService;

    public function __construct(ContractNotificationService $contractNotificationService)
    {
        parent::__construct();
        $this->contractNotificationService = $contractNotificationService;
    }

    public function handle()
    {
        $this->info('Checking contract expirations...');

        $daysThreshold = $this->option('days');

        // Check expiring contracts
        $this->info("Checking contracts expiring within {$daysThreshold} days...");
        $expiringResult = $this->contractNotificationService->checkAndNotifyExpiringContracts($daysThreshold);

        if ($expiringResult['status'] === 'success') {
            $this->info("✓ Expiring contracts checked: {$expiringResult['created_notifications']} new notifications created");
        } else {
            $this->warn('⚠ ' . $expiringResult['message']);
        }

        // Check expired contracts
        $this->info('Checking expired contracts...');
        $expiredResult = $this->contractNotificationService->checkAndNotifyExpiredContracts();

        if ($expiredResult['status'] === 'success') {
            $this->info("✓ Expired contracts checked: {$expiredResult['created_notifications']} new notifications created");
        } else {
            $this->warn('⚠ ' . $expiredResult['message']);
        }

        $this->info('Contract check completed!');
    }
}
