<?php

namespace App\Http\Controllers;

class TeapotController extends Controller
{
    public function brew(Request $request) {
        return response()->json(['message' => "I'm a happy teapot!"], 418);
    }
}
