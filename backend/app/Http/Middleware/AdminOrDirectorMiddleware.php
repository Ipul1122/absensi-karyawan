<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOrDirectorMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ($request->user()->role === 'admin' || $request->user()->role === 'director')) {
            return $next($request);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Hanya Admin atau Direktur yang diperbolehkan mengakses resource ini.'
        ], 403);
    }
}
