<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class UpdateLastSeenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            $user = $request->user();
            
            // To avoid excessive database writes, only update if last_seen_at is empty
            // or has not been updated in the last 1 minute.
            if (!$user->last_seen_at || Carbon::parse($user->last_seen_at)->diffInMinutes(Carbon::now()) >= 1) {
                $user->forceFill([
                    'last_seen_at' => Carbon::now()
                ])->saveQuietly();
            }
        }

        return $next($request);
    }
}
