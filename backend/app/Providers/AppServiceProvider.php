<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $host = request()->getHost();
        $isLocal = in_array($host, ['localhost', '127.0.0.1', '::1']);
        if (config('app.env') === 'production' || env('FORCE_HTTPS', false) || !$isLocal) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
