<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\User;
use App\File;
use App\Access;

class FileController extends Controller
{
    public function __construct() {
        $this->storageLocation = app()->basePath() . '/' . env('FILE_STORAGE');
    }

    public function upload(Request $request) {
        $this->validate($request, [
            'name' => 'required',
            'key' => 'required',
            'parent' => 'sometimes|exists:files,id',
        ]);

        if ($request->hasFile('file')) {
            if (!$request->file('file')->isValid()) {
                return response()->json(['message' => "File is invalid or corrupted."], 400);
            }

            $path = pathinfo(tempnam($this->storageLocation, 'sirs'));
            $request->file('file')->move($path['dirname'], $path['basename']);

            $file = File::create([
                'owner' => $request->user()->id,
                'path' => $path['dirname'] . '/' . $path['basename'],
                'name' => $request->get('name'),
                'parent' => $request->get('parent'),
            ]);
        } else {
            $file = File::create([
                'owner' => $request->user()->id,
                'name' => $request->get('name'),
                'parent' => $request->get('parent'),
            ]);
        }

        $access = Access::create([
            'user_id' => $request->user()->id,
            'file_id' => $file->id,
            'key' => $request->get('key'),
        ]);

        return response()->json(['message' => "Successfully created.", 'id' => $file->id], 201);
    }

    public function root(Request $request) {
        $files = Access::where('user_id', $request->user()->id)->join('files', 'accesses.file_id', '=', 'files.id')->whereNull('parent')->get();

        $formatted_files = [];
        foreach ($files as $file) {
            $owner = User::where('id', $file->owner)->first()->username;
            $shared = Access::where('file_id', $file->id)->join('users', 'accesses.user_id', '=', 'users.id')->pluck('username');

            $shared->forget($shared->search($owner));

            $formatted_files[] = [
                'id' => $file->id,
                'key' => $file->key,
                'name' => $file->name,
                'directory' => empty($file->path),
                'size' => 0,
                'created' => $file->created_at,
                'modified' => $file->updated_at,
                'owner' => $owner,
                'shared' => $shared,
        ];
        }

        return response()->json(['message' => "Retrieved root directory.", 'files' => $formatted_files], 200);
    }

    public function download(Request $request, string $file_id) {
        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if (empty($file->path)) {
            $files = Access::where('user_id', $request->user()->id)->join('files', 'accesses.file_id', '=', 'files.id')->where('parent', $file_id)->get();

            $formatted_files = [];
            foreach ($files as $file) {
                $owner = User::where('id', $file->owner)->first()->username;
                $shared = Access::where('file_id', $file->id)->join('users', 'accesses.user_id', '=', 'users.id')->pluck('username');

                $shared->forget($shared->search($owner));

                $formatted_files[] = [
                    'id' => $file->id,
                    'key' => $file->key,
                    'name' => $file->name,
                    'directory' => empty($file->path),
                    'size' => 0,
                    'created' => $file->created_at,
                    'modified' => $file->updated_at,
                    'owner' => $owner,
                    'shared' => $shared,
            ];
            }

            return response()->json(['message' => "Retrieved directory.", 'files' => $formatted_files], 200);
        } else {
            return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);
        }
    }

    public function update(Request $request, string $file_id) {
        return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);

        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }
    }

    public function rename(Request $request, string $file_id) {
        $this->validate($request, [
            'name' => 'required',
        ]);

        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        $file->name = $request->get('name');
        $file->save();

        return response()->json(['message' => "Rename successful."], 200);
    }

    public function delete(Request $request, string $file_id) {
        return response()->json(['message' => "Not yet implemented due to bad time scheduling"], 501);

        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }
    }

    public function share(Request $request, string $file_id) {
        $this->validate($request, [
            'username' => 'required|exists:users',
            'key' => 'required',
        ]);

        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        $user = User::where('username', $username)->first();

        $access = Access::create([
            'user_id' => $user->id,
            'file_id' => $file->id,
            'key' => $request->get('key'),
        ]);

        return response()->json(['message' => "Access granted."], 200);
    }

    public function revoke(Request $request, string $file_id) {
        $this->validate($request, [
            'username' => 'required|exists:users'
        ]);

        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        $user = User::where('username', $username)->first();

        $access = Access::where('file_id', $file->id)->andWhere('user_id', $user->id)->first();

        if (empty($access)) {
            return response()->json(['message' => "Share to be revoked not found."], 404);
        }

        $access->delete();

        return response()->json(['message' => "Access revoked."], 200);
    }
}
