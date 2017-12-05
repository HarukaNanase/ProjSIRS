<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

use App\User;
use App\File;
use App\Access;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Boot the authentication and authorization services for the application.
     *
     * @return void
     */
    public function boot()
    {
        // Define how authentication should be performed
        $this->app['auth']->viaRequest('api', function ($request) {
            if ($request->header('Authorization')) {
                $token = explode(' ', $request->header('Authorization'))[1];

                if (empty($token)) {
                    return null;
                }

                $user = User::where('api_token', $token)->first();

                if (empty($user) || !$user->checkToken()) {
                    return null;
                }

                return $user;
            }
        });

        Gate::define('file-create', function ($user, $file) {
            if (empty($file->parent)) {
                return true;
            }

            $access = Access::where('file_id', $file->parent)->where('user_id', $user->id)->first();

            return !empty($access);
        });

        Gate::define('file-read-modify', function ($user, $file) {
            $access = Access::where('file_id', $file->id)->where('user_id', $user->id)->first();

            return !empty($access);
        });

        Gate::define('file-share', function ($user, $file) {
            return $user->id === $file->owner;
        });
    }
}
