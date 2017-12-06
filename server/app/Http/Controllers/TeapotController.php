<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TeapotController extends Controller
{
    public function brew(Request $request) {
        return response()->json(['message' => "I'm a happy teapot!", 'output' => $request->get('input')], 418);
    }
}
