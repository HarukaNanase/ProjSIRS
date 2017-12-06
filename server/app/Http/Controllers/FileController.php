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
                'created' => Carbon::parse($file->created_at)->getTimestamp(),
                'modified' => Carbon::parse($file->updated_at)->getTimestamp(),
                'owner' => $owner,
                'shared' => $shared->values(),
                'needs_reciphering' => $file->needs_reciphering,
            ];
        }

        return response()->json(['message' => "Retrieved root directory.", 'files' => $formatted_files], 200);
    }

    public function download(Request $request, string $file_id) {
        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-read-modify', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
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
                    'created' => Carbon::parse($file->created_at)->getTimestamp(),
                    'modified' => Carbon::parse($file->updated_at)->getTimestamp(),
                    'owner' => $owner,
                    'shared' => $shared->values(),
                    'needs_reciphering' => $file->needs_reciphering,
                ];
            }

            return response()->json(['message' => "Retrieved directory.", 'files' => $formatted_files], 200);
        } else {
            return response()->download($file->path);
        }
    }

    public function upload(Request $request) {
        $this->validate($request, [
            'name' => 'required',
            'keys' => 'required|array',
            'parent' => 'sometimes|exists:files,id',
            'file' => 'sometimes|file',
        ]);

        $file = File::newModelInstance([
            'owner' => $request->user()->id,
            'name' => $request->get('name'),
            'parent' => $request->get('parent'),
        ]);

        if (!empty($request->get('parent'))) {
            $parent = File::where('id', $request->get('parent'))->first();
            $file->owner = $parent->owner;
        }

        if ($request->user()->cannot('file-create', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        if (!empty($request->get('parent'))) {
            if (Access::where('file_id', $file->parent)->join('users', 'accesses.user_id', '=', 'users.id')->whereNotIn('username', array_keys($request->get('keys')))->count()) {
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
            $userAccesses = Access::where('file_id', $file->parent)->join('users', 'accesses.user_id', '=', 'users.id')->get();

            foreach ($userAccesses as $userAccess) {
                $access = Access::create([
                    'user_id' => $userAccess->user_id,
                    'file_id' => $file->id,
                    'key' => $request->get('keys')[$userAccess->username],
                ]);
            }
        } else {
            $access = Access::create([
                'user_id' => $request->user()->id,
                'file_id' => $file->id,
                'key' => $request->get('keys')[$request->user()->username],
            ]);
        }

        Log::create([
            'user_id' => $request->user()->id,
            'file_id' => $file->id,
            'message' => "File created",
        ]);

        return response()->json(['message' => "Successfully created.", 'id' => $file->id], 201);
    }

    public function update(Request $request, string $file_id) {
        $this->validate($request, [
            'file' => 'required|file',
            'keys' => 'sometimes|array',
            'name' => 'sometimes',
        ]);

        $file = File::where('id', $file_id)->first();

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

            if (Access::where('file_id', $file->id)->join('users', 'accesses.user_id', '=', 'users.id')->whereNotIn('username', array_keys($request->get('keys')))->count()) {
                return response()->json(['message' => "Users missing in keys list."], 400);
            }

            $userAccesses = Access::where('file_id', $file->id)->join('users', 'accesses.user_id', '=', 'users.id')->get();

            foreach ($userAccesses as $userAccess) {
                $access = Access::where('file_id', $file->id)->where('user_id', $userAccess->user_id)->first();

                $access->key = $request->get('keys')[$userAccess->username];
                $access->save();
            }

            $file->name = $request->get('name');
            $file->needs_reciphering = false;
        }

        $path = pathinfo($file->path);
        $request->file('file')->move($path['dirname'], $path['basename']);

        $file->save();

        Log::create([
            'user_id' => $request->user()->id,
            'file_id' => $file->id,
            'message' => "File updated",
        ]);

        return response()->json(['message' => "File updated"], 200);
    }

    public function rename(Request $request, string $file_id) {
        $this->validate($request, [
            'name' => 'required',
            'keys' => 'sometimes|array',
        ]);

        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-read-modify', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        if (!empty($request->get('keys'))) {
            if (Access::where('file_id', $file->id)->join('users', 'accesses.user_id', '=', 'users.id')->whereNotIn('username', array_keys($request->get('keys')))->count()) {
                return response()->json(['message' => "Users missing in keys list."], 400);
            }

            $userAccesses = Access::where('file_id', $file->id)->join('users', 'accesses.user_id', '=', 'users.id')->get();

            foreach ($userAccesses as $userAccess) {
                $access = Access::where('file_id', $file->id)->where('user_id', $userAccess->user_id)->first();

                $access->key = $request->get('keys')[$userAccess->username];
                $access->save();
            }

            $file->needs_reciphering = false;
        }

        $file->name = $request->get('name');
        $file->save();

        Log::create([
            'user_id' => $request->user()->id,
            'file_id' => $file->id,
            'message' => "File renamed",
        ]);

        return response()->json(['message' => "Rename successful."], 200);
    }

    public function delete(Request $request, string $file_id) {
        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-read-modify', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        Log::create([
            'user_id' => $request->user()->id,
            'file_id' => $file->id,
            'message' => "File deleted",
        ]);

        $file->recursivelyDelete();

        return response()->json(['message' => "File deleted successfully."], 200);
    }

    public function share(Request $request, string $file_id) {
        $this->validate($request, [
            'keys' => 'required|array',
        ]);

        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-share', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        if (Access::where('file_id', $file->id)->join('users', 'accesses.user_id', '=', 'users.id')->whereIn('username', array_keys($request->get('keys')))->count()) {
            return response()->json(['message' => "Cannot share with the same users more than once."], 400);
        }

        foreach ($request->get('keys') as $username => $key) {
            $user = User::where('username', $username)->first();

            $access = Access::create([
                'user_id' => $user->id,
                'file_id' => $file->id,
                'key' => $key,
            ]);

            Log::create([
                'user_id' => $request->user()->id,
                'file_id' => $file->id,
                'message' => "File shared with user " . $user->id,
            ]);
        }

        return response()->json(['message' => "File access granted."], 200);
    }

    public function revoke(Request $request, string $file_id) {
        $this->validate($request, [
            'usernames' => 'required|array'
        ]);

        $file = File::where('id', $file_id)->first();

        if (empty($file)) {
            return response()->json(['message' => "File not found."], 404);
        }

        if ($request->user()->cannot('file-share', $file)) {
            return response()->json(['message' => "Forbidden."], 403);
        }

        $userAccesses = Access::where('file_id', $file->id)->join('users', 'accesses.user_id', '=', 'users.id')->whereIn('username', $request->get('usernames'))->get();

        if ($userAccesses->isEmpty()) {
            return response()->json(['message' => "No matching users found."], 400);
        }

        foreach ($userAccesses as $userAccess) {
            Access::where('file_id', $file->id)->where('user_id', $userAccess->user_id)->first()->delete();

            Log::create([
                'user_id' => $request->user()->id,
                'file_id' => $file->id,
                'message' => "File unshared with user " . $userAccess->user_id,
            ]);
        }

        $file->needs_reciphering = true;
        $file->save();

        return response()->json(['message' => "File access revoked."], 200);
    }
}
