<?php

namespace App\Http\Controllers;

class FileController extends Controller
{
    public function __construct() {
        $storageLocation = $app->basePath() . PATH_SEPARATOR . config('FILE_STORAGE');
    }

    public function upload(Request $request) {
        return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);
    }

    public function download(Request $request, string $file_id) {
        return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);
    }

    public function update(Request $request, string $file_id) {
        return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);
    }

    public function delete(Request $request, string $file_id) {
        return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);
    }

    public function share(Request $request, string $file_id) {
        return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);
    }

    public function revoke(Request $request, string $file_id) {
        return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);
    }
}
