<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

use App\User;

class UserController extends Controller
{
    public function login(Request $request) {
        $this->validate($request, [
            'username' => 'required|exists:users',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->get('username'))->first();

        if (!$user->checkPassword($request->get('password'))) {
            return response()->json(['message' => "Password is incorrect"], 401);
        }

        return response()->json(['message' => "Login successful for " . $user->username, 'api_token' => $user->generateToken(env('API_TOKEN_LIFETIME')), 'private_key' => $user->private_key], 200);
    }

    public function renew(Request $request) {
        $user = $request->user();

        return response()->json(['message' => "API token renewed.", 'api_token' => $user->generateToken(env('API_TOKEN_RENEW_LIFETIME'))], 200);
    }

    public function register(Request $request) {
        $this->validate($request, [
            'username' => 'required|min:3|unique:users',
            'password' => 'required|min:6',
            'email' => 'sometimes|email',
            'public_key' => 'required',
            'private_key' => 'required',
        ]);

        $user = User::create([
            'username' => $request->get('username'),
            'email' => $request->get('email'),
            'password' => Hash::make($request->get('password')),
            'public_key' => $request->get('public_key'),
            'private_key' => $request->get('private_key'),
        ]);

        return response()->json(['message' => "Account " .  $user->username . " successfully created "], 201);
    }

    public function logout(Request $request) {
        $request->user()->invalidateToken();

        return response()->json(['message' => "You have been logged out."], 200);
    }

    public function keys(Request $request) {
        $this->validate($request, [
            'usernames' => 'required|array',
        ]);

        $userkeys = User::whereIn('username', $request->get('usernames'))->select('username', 'public_key')->get();

        $public_keys = [];
        foreach ($userkeys as $userkey) {
            $public_keys[$userkey->username] = $userkey->public_key;
        }

        return response()->json(['message' => "Public keys, if any, have been retrieved.", 'public_keys' => $public_keys], 200);
    }
}
