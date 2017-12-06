<?php

namespace App\Http\Middleware;

use Closure;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if($request->isMethod('OPTIONS')) {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }

        // Adds headers to the response
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST');
        $response->headers->set('Access-Control-Allow-Headers', $request->header('Access-Control-Request-Headers'));
        $response->headers->set('Access-Control-Allow-Origin', '*');

        // Sends it
        return $response;
    }
}
