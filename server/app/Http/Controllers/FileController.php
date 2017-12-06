<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

use App\User;
use App\File;
use App\Access;
use App\Log;

class FileController extends Controller
{
    public function __construct() {
        $this->storageLocation = app()->basePath() . '/' . env('FILE_STORAGE');
    }

    public function root(Request $request) {
        $files = File::hydrate(Access::where('accesses.user_id', $request->user()->user_id)->join('files', 'accesses.file_id', '=', 'files.file_id')->get()->toArray())->keyBy('file_id');

        $formatted_files = [];
        foreach ($files as $id => $file) {
            if (!$files->has($file->parent)) {
                $shared = Access::where('accesses.file_id', $file->file_id)->where('accesses.user_id', '<>', $file->owner)->join('users', 'accesses.user_id', '=', 'users.user_id')->pluck('username');

                $formatted_files[] = [
                    'id' => $file->file_id,
                    'key' => $file->key,
                    'name' => $file->name,
                    'directory' => $file->isDirectory(),
                    'size' => 0,
                    'created' => Carbon::parse($file->created_at)->getTimestamp(),
                    'modified' => Carbon::parse($file->updated_at)->getTimestamp(),
                    'owner' => User::where('user_id', $file->owner)->first()->username,
                    'shared' => $shared->values(),
                    'needs_reciphering' => $file->needs_reciphering,
                ];
            }
        }

        return response()->json(['message' => "Retrieved root directory.", 'files' => $formatted_files], 200);
    }

    public function download(Request $request, string $file_id) {
        $file = File::where('file_id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-read-modify', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        if ($file->isDirectory()) {
            $files = File::hydrate(Access::where('accesses.user_id', $request->user()->user_id)->join('files', 'accesses.file_id', '=', 'files.file_id')->where('parent', $file_id)->get()->toArray());
            $test = $file->treeTraverse();

            $formatted_files = [];
            foreach ($files as $file) {
                $shared = Access::where('accesses.file_id', $file->file_id)->where('accesses.user_id', '<>', $file->owner)->join('users', 'accesses.user_id', '=', 'users.user_id')->pluck('username');

                $formatted_files[] = [
                    'id' => $file->file_id,
                    'key' => $file->key,
                    'name' => $file->name,
                    'directory' => $file->isDirectory(),
                    'size' => 0,
                    'created' => Carbon::parse($file->created_at)->getTimestamp(),
                    'modified' => Carbon::parse($file->updated_at)->getTimestamp(),
                    'owner' => User::where('user_id', $file->owner)->first()->username,
                    'shared' => $shared->values(),
                    'needs_reciphering' => $file->needs_reciphering,
                ];
            }

            return response()->json(['message' => "Retrieved directory.", 'files' => $formatted_files, 'test' => $test], 200);
        } else {
            return response()->download($file->path);
        }
    }

    public function upload(Request $request) {
        $this->validate($request, [
            'name' => 'required',
            'keys' => 'required|array',
            'parent' => 'sometimes|exists:files,file_id',
            'file' => 'sometimes|file',
        ]);

        $file = File::newModelInstance([
            'owner' => $request->user()->user_id,
            'name' => $request->get('name'),
            'parent' => $request->get('parent'),
        ]);

        if (!empty($request->get('parent'))) {
            $parent = File::where('file_id', $request->get('parent'))->first();
            $file->owner = $parent->owner;
        }

        if ($request->user()->cannot('file-create', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        if (!empty($request->get('parent'))) {
            if (Access::where('accesses.file_id', $file->parent)->join('users', 'accesses.user_id', '=', 'users.user_id')->whereNotIn('username', array_keys($request->get('keys')))->count()) {
                return response()->json(['message' => "Users missing in keys list."], 400);
            }
        } else {
            if (!in_array($request->user()->username, array_keys($request->get('keys')))) {
                return response()->json(['message' => "Users missing in keys list."], 400);
            }
        }

        if ($request->hasFile('file')) {
            $path = pathinfo(tempnam($this->storageLocation, 'sirs'));
            $request->file('file')->move($path['dirname'], $path['basename']);
            $file->path = $path['dirname'] . '/' . $path['basename'];
        }

        $file->save();

        if (!empty($request->get('parent'))) {
            $userAccesses = Access::where('accesses.file_id', $file->parent)->join('users', 'accesses.user_id', '=', 'users.user_id')->get();

            foreach ($userAccesses as $userAccess) {
                Access::create([
                    'user_id' => $userAccess->user_id,
                    'file_id' => $file->file_id,
                    'key' => $request->get('keys')[$userAccess->username],
                ]);
            }
        } else {
            Access::create([
                'user_id' => $request->user()->user_id,
                'file_id' => $file->file_id,
                'key' => $request->get('keys')[$request->user()->username],
            ]);
        }

        Log::create([
            'user_id' => $request->user()->user_id,
            'file_id' => $file->file_id,
            'message' => "File created",
        ]);

        return response()->json(['message' => "Successfully created.", 'id' => $file->file_id], 201);
    }

    public function update(Request $request, string $file_id) {
        $this->validate($request, [
            'file' => 'required|file',
            'keys' => 'sometimes|array',
            'name' => 'sometimes',
        ]);

        $file = File::where('file_id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-read-modify', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        if (!empty($request->get('keys'))) {
            if (empty($request->get('name'))) {
                return response()->json(['message' => "Name for rename not provided."], 400);
            }

            if (Access::where('accesses.file_id', $file->file_id)->join('users', 'accesses.user_id', '=', 'users.user_id')->whereNotIn('username', array_keys($request->get('keys')))->count()) {
                return response()->json(['message' => "Users missing in keys list."], 400);
            }

            $accesses = Access::where('accesses.file_id', $file->file_id)->join('users', 'accesses.user_id', '=', 'users.user_id')->get();
            foreach ($accesses as $access) {
                $access->key = $request->get('keys')[$access->username];
                $access->save();
            }

            $file->name = $request->get('name');
            $file->needs_reciphering = false;
        }

        $path = pathinfo($file->path);
        $request->file('file')->move($path['dirname'], $path['basename']);

        $file->save();

        Log::create([
            'user_id' => $request->user()->user_id,
            'file_id' => $file->file_id,
            'message' => "File updated",
        ]);

        return response()->json(['message' => "File updated"], 200);
    }

    public function rename(Request $request, string $file_id) {
        $this->validate($request, [
            'name' => 'required',
            'keys' => 'sometimes|array',
        ]);

        $file = File::where('file_id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-read-modify', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        if (!empty($request->get('keys'))) {
            if (Access::where('accesses.file_id', $file->file_id)->join('users', 'accesses.user_id', '=', 'users.user_id')->whereNotIn('username', array_keys($request->get('keys')))->count()) {
                return response()->json(['message' => "Users missing in keys list."], 400);
            }

            $accesses = Access::where('accesses.file_id', $file->file_id)->join('users', 'accesses.user_id', '=', 'users.user_id')->get();

            foreach ($accesses as $access) {
                $access->key = $request->get('keys')[$access->username];
                $access->save();
            }

            $file->needs_reciphering = false;
        }

        $file->name = $request->get('name');
        $file->save();

        Log::create([
            'user_id' => $request->user()->user_id,
            'file_id' => $file->file_id,
            'message' => "File renamed",
        ]);

        return response()->json(['message' => "Rename successful."], 200);
    }

    public function delete(Request $request) {
        $this->validate($request, [
            'files' => 'required|array',
        ]);

        foreach ($request->get('files') as $file_id) {
            $file = File::where('file_id', $file_id)->first();

            if ($request->user()->can('file-read-modify', $file)) {
                foreach ($file->treeTraverse() as $file) {
                    if ($request->user()->can('file-read-modify', $file)) {
                        if (!$file->isDirectory()) {
                            unlink($file->path);
                        }

                        Log::create([
                            'user_id' => $request->user()->user_id,
                            'file_id' => $file->file_id,
                            'message' => "File deleted",
                        ]);

                        $file->delete();
                    }
                }
            }
        }

        return response()->json(['message' => "File deleted successfully."], 200);
    }

    public function keys(Request $request, string $file_id) {
        $file = File::where('file_id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-read-modify', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        $files = $file->treeTraverse();
        $keys = [];
        foreach ($files as $file) {
            if ($request->user()->can('file-read-modify', $file)) {
                $keys[$file->file_id] = Access::where('file_id', $file->file_id)->where('user_id', $request->user()->user_id)->first()->key;
            }
        }

        return response()->json(['message' => "Keys, if any, are in this request.", 'keys' => $keys], 200);
    }

    public function share(Request $request, string $file_id) {
        $this->validate($request, [
            'keys' => 'required|array',
        ]);

        $file = File::where('file_id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-share', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        $files = $file->treeTraverse();
        foreach ($files as $file) {
            if ($request->user()->can('file-share', $file)) {
                foreach ($request->get('keys')[$file->file_id] as $username => $key) {
                    $user = User::where('username', $username)->first();
                    $access = Access::where('user_id', $user->user_id)->where('file_id', $file->file_id)->first();

                    if (empty($access)) {
                        Access::create([
                            'user_id' => $user->user_id,
                            'file_id' => $file->file_id,
                            'key' => $key,
                        ]);

                        Log::create([
                            'user_id' => $request->user()->user_id,
                            'file_id' => $file->file_id,
                            'message' => "File shared with user " . $user->user_id,
                        ]);
                    } else {
                        $access->key = $key;
                    }
                }
            }
        }

        return response()->json(['message' => "File access granted."], 200);
    }

    public function revoke(Request $request, string $file_id) {
        $this->validate($request, [
            'usernames' => 'required|array'
        ]);

        $file = File::where('file_id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-share', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        $files = $file->treeTraverse();
        foreach ($files as $file) {
            if ($request->user()->can('file-share', $file)) {
                foreach (Access::where('accesses.file_id', $file->file_id)->join('users', 'accesses.user_id', '=', 'users.user_id')->whereIn('username', $request->get('usernames'))->get() as $access) {
                    $access->delete();
                    Log::create([
                        'user_id' => $request->user()->user_id,
                        'file_id' => $file->file_id,
                        'message' => "File unshared with user " . $access->user_id,
                    ]);
                }

                $file->needs_reciphering = true;
                $file->save();
            }
        }

        return response()->json(['message' => "File access revoked."], 200);
    }
}
