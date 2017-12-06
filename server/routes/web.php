<?php

/* ------------------
 User-related routes
------------------ */

// Logs in
$router->post('login', 'UserController@login');

// Registers a new user
$router->post('register', 'UserController@register');

// Requires authentication
$router->group(['middleware' => 'auth'], function ($router) {
    // Renews session
    $router->get('renew', 'UserController@renew');

    // Logs the user out
    $router->get('logout', 'UserController@logout');

    // Gets a group of users' public keys
    $router->post('keys', 'UserController@keys');
});


/* ------------------
 File-related routes
------------------ */

// Requires authentication
$router->group(['middleware' => 'auth'], function ($router) {
    // Gets the root directory
    $router->get('file', 'FileController@root');

    // Downloads a file with a specific ID
    $router->get('file/{file_id}', 'FileController@download');

    // Uploads a new file
    $router->post('file', 'FileController@upload');

    // Deletes a group of files with specific IDs
    $router->post('file/delete', 'FileController@delete');

    // Updates a file with a specific ID
    $router->post('file/{file_id}/update', 'FileController@update');

    // Renames a file with a specific ID
    $router->post('file/{file_id}/rename', 'FileController@rename');

    // Gets all the "file_id => key" pairs within a folder, recursively
    $router->get('file/{file_id}/keys', 'FileController@keys');

    // Shares a file with a specific ID with someone else
    $router->post('file/{file_id}/share', 'FileController@share');

    // Revokes share of a file with a specific ID with someone else
    $router->post('file/{file_id}/revoke', 'FileController@revoke');
});

/* -------------------
 Miscellaneous routes
------------------- */

// Brews coffee
$router->get('brew', 'TeapotController@brew');
$router->post('brew', 'TeapotController@brew');
