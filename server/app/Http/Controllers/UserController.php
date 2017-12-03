<?php

namespace App\Http\Controllers;

class UserController extends Controller
{
    public function login(Request $request) {
        $request->validate([
            'username' => 'required|exists:user',
            'password' => 'required'
        ]);

        $user = User::where('username', $request->get('username'))->first();

        if (!$user->checkPassword($request->get('password'))) {
            return response()->json(['message' => "Password is incorrect"], 401);
        }

        return response()->json(['message' => "Login successful for " . $user->username, 'api_token' => $user->generateToken(), 'private_key' => $user->private_key], 200);
    }

    public function renew(Request $request) {
        $user = Auth::user();

        return response()->json(['message' => "API token renewed.", 'api_token' => $user->generateToken()], 200);
    }

    public function register(Request $request) {
        $request->validate([
            'username' => 'required|min:6|unique:user',
            'password' => 'required|min:6',
            'email' => 'sometimes|email'
            'public_key' => 'required',
            'private_key' => 'required'
        ]);

        $user = User::create([
            'username' => $request->get('username'),
            'email' => $request->get('email'),
            'password' => Hash::make($request->get('password')),
            'public_key' => $request->get('public_key'),
            'private_key' => $request->get('private_key'),
        ]);

        return response()->json(['message' => "Account successfully created " . $user->username], 201);
    }

    public function logout(Request $request) {
        Auth::user()->invalidateToken();

        return response()->json(['message' => "You have been logged out."], 200);
    }
}
