const {encode64, decode64} = require('node-forge').util;
const {ipcMain} = require('electron');
const fs = require('fs');
const {
  decipherFileName, getKeyPair,
  cipherFileName, cipherFile, generateKey,
  publicKeyFromPem, decipherFile, decryptKey
} = require('../cryptography/cryptography');

/**
 * Constants
 */
const KEY_SIZE = 16;

/**
 * Variables
 */
const request = require('./request');
let privateKey = undefined;
let publicKey = undefined;

/**
 * Functions
 */

/**
 * Returns the encrypted file of a given path.
 * @param filePath The path of the file.
 * @returns {string} The path of the encrypted version of the file.
 */
const encryptedPath = (filePath) => filePath + '.enc';

/**
 * Returns if a given response is an error or not, since request doesn't activate on all errors.
 * @param response The response of a request request.
 */
const isError = (response) => response.statusCode >= 400;

/**
 * Fetches all public keys of the users with the given usernames.
 * @param {Array<string>} usernames An array with the usernames of the users.
 * @returns {Promise.<*>} The public keys.
 */
const getPublicKeys = async (usernames) => {
  try {
    // Fetch all public keys from all the users.
    const {public_keys} = await new Promise((resolve, reject) => request.post({
      uri: '/keys',
      form: {usernames}
    }, (error, response, body) => {
      if (error) reject(error);
      else resolve(body);
    }));
    // Convert the PEMs to forge public keys.
    for (const username in public_keys) {
      if (public_keys.hasOwnProperty(username)) {
        public_keys[username] = publicKeyFromPem(public_keys[username]);
      }
    }
    return public_keys;
  } catch (error) {
    return error;
  }
};

/**
 * IPC functions
 */

ipcMain.on('register', (event, username, password, privateKeyEncryptedPem, publicKeyPem) => {
  request.post({
    uri: '/register',
    form: {username, password, private_key: privateKeyEncryptedPem, public_key: publicKeyPem},
  }, (error, response) => {
    event.sender.send('register', {error: error || isError(response), response});
  });
});

ipcMain.on('login', (event, username, password) => {
  request.post({
    uri: '/login',
    form: {username, password}
  }, (error, response, body) => {
    event.sender.send('login', {
      error: error || isError(response),
      response,
      privateKeyEncryptedPem: body.private_key,
      token: body.api_token
    });
  });
});

ipcMain.on('logout', () => {
  request.get('/logout');
});

ipcMain.on('renew', (event) => {
  request.get('/renew', (error, response, body) => {
    event.sender.send('renew', {error: error || isError(response), token: body.api_token});
  });
});

ipcMain.on('revokeFile', (event, remoteFileId, usernames) => {
  request.post({
    uri: `/file/${remoteFileId}/revoke`,
    form: {usernames},
  }, (error, response) => {
    event.sender.send('revokeFile', {error: error || isError(response)});
  });
});

ipcMain.on('shareFile', async (event, remoteFileId, usernames) => {
  // Fetch all public keys from all the users.
  const publicKeys = await getPublicKeys(usernames);
  // Fetch the usernames that were real and that the server had.
  usernames = Object.keys(publicKeys);

  // Fetch all keys of the file, or if a directory, all files.
  const {keys} = await new Promise((resolve, reject) => request.get({
    uri: `/file/${remoteFileId}/keys`,
  }, (error, response, body) => {
    if (error) reject(error);
    else resolve(body);
  }));

  // Encrypt the file keys with users' public keys.
  const formData = {};
  for (let id in keys) {
    if (keys.hasOwnProperty(id)) {
      const key = decryptKey(keys[id], privateKey);
      for (let username in publicKeys) {
        if (publicKeys.hasOwnProperty(username)) {
          formData[`keys[${id}][${username}]`] = encode64(publicKeys[username].encrypt(key));
        }
      }
    }
  }
  // Make the share request
  request.post({
    uri: `/file/${remoteFileId}/share`,
    formData
  }, (error, response) => {
    event.sender.send('shareFile', {error: error || isError(response), usernames});
  });
});

ipcMain.on('updateFile', async (event, remoteFileId, key64, filePath, recipher, name, allMembersUsernames) => {
  let key = decode64(key64);
  // Craft the form data.
  const formData = {};

  // If needs reciphering, generate a new key, cipher the name and cipher the new key.
  if (recipher) {
    key = generateKey(KEY_SIZE);
    // Recipher the name
    formData.name = cipherFileName(key, name);

    // Fetch all public keys from all the users.
    const publicKeys = await getPublicKeys(allMembersUsernames);

    // Re-encrypt the file key with each shared user key.
    for (let username in publicKeys) {
      if (publicKeys.hasOwnProperty(username)) {
        formData['keys[' + username + ']'] = encode64(publicKeys[username].encrypt(key));
      }
    }
  }

  // Cipher the file.
  cipherFile(key, filePath, encryptedPath(filePath));

  // Make the edit request
  formData.file = {
    value: fs.createReadStream(encryptedPath(filePath)),
    options: {filename: encode64(generateKey(32))}
  };
  request.post({
    uri: `/file/${remoteFileId}/update`,
    formData
  }, (error, response) => {
    if (filePath) fs.unlink(encryptedPath(filePath));
    event.sender.send('updateFile', {error: error || isError(response), key: encode64(key)});
  });
});

ipcMain.on('renameFile', async (event, remoteFileId, key64, name, recipher, allMembersUsernames) => {
  let key = decode64(key64);

  // Start crafting the form data.
  const form = {};

  // If needs reciphering, generate a new key, cipher the name and cipher the new key.
  if (recipher) {
    key = generateKey(KEY_SIZE);
    // Fetch all public keys from all the users.
    const publicKeys = await getPublicKeys(allMembersUsernames);

    // Re-encrypt the file key with each shared user key.
    for (let username in publicKeys) {
      if (publicKeys.hasOwnProperty(username)) {
        form['keys[' + username + ']'] = encode64(publicKeys[username].encrypt(key));
      }
    }
  }

  form.name = cipherFileName(key, name);
  // Make the request.
  request.post({
    uri: `/file/${remoteFileId}/rename`,
    form,
  }, (error, response) => {
    event.sender.send('renameFile', {error: error || isError(response), key: encode64(key)});
  });
});

ipcMain.on('downloadFile', (event, remoteFileId, key64, dstFilePath) => {
  request.get(`/file/${remoteFileId}`).on('end', () => {
    const result = decipherFile(decode64(key64), encryptedPath(dstFilePath), dstFilePath);
    fs.unlink(encryptedPath(dstFilePath));
    event.sender.send('downloadFile', {error: false, deciphered: result});
  }).on('error', () => {
    event.sender.send('downloadFile', {error: true});
  }).pipe(fs.createWriteStream(encryptedPath(dstFilePath)));
});

ipcMain.on('uploadFile', async (event, allMembersUsernames, name, parent, filePath) => {
  // Generate a new key and encode it in base 64.
  const key = generateKey(KEY_SIZE);
  const key64 = encode64(key);

  // Cipher the name.
  const cipheredName = cipherFileName(key, name);

  // Cipher the file, if there is a file.
  if (filePath) {
    // Cipher the file.
    cipherFile(key, filePath, encryptedPath(filePath));
  }

  // Fetch all public keys from all members.
  const publicKeys = await getPublicKeys(allMembersUsernames);

  // Start crafting the form.
  const formData = {
    name: cipheredName,
  };
  // Encrypt the file key with each shared user key.
  for (let username in publicKeys) {
    if (publicKeys.hasOwnProperty(username)) {
      formData['keys[' + username + ']'] = encode64(publicKeys[username].encrypt(key));
    }
  }
  if (parent) formData.parent = parent;
  if (filePath) {
    formData.file = {
      value: fs.createReadStream(encryptedPath(filePath)),
      options: {filename: cipheredName}
    };
  }
  // Make the upload request
  request.post({
    uri: '/file',
    formData
  }, (error, response, body) => {
    if (filePath) fs.unlink(encryptedPath(filePath));
    event.sender.send('uploadFile', {id: body.id, key: key64, error: error || isError(response)});
  });
});

ipcMain.on('deleteFile', async (event, remoteFilesIds) => {
  request.post({
    uri: '/file/delete',
    form: {files: remoteFilesIds}
  }, (error, response) => {
    event.sender.send('deleteFile', {error: error || isError(response)});
  });
});

ipcMain.on('loadRemotePath', (event, remoteFileId) => {
  const uri = '/file' + (remoteFileId ? '/' + remoteFileId : '');
  // Make the request
  request.get(uri, (error, response, body) => {
    if (error || !body.files) {
      event.sender.send('loadRemotePath', {error, files: []});
      return;
    }
    const files = body.files;
    files.forEach((file) => {
      // Decrypt the key and encode it in base 64.
      const key = decryptKey(file.key, privateKey);
      file['key'] = encode64(key);
      // Decipher the name.
      file['name'] = decipherFileName(key, file.name);
    });
    event.sender.send('loadRemotePath', {error: error || isError(response), files});
  });
});

ipcMain.on('setPrivateKey', (event, privateKeyPem) => {
  if (!privateKeyPem) {
    privateKey = undefined;
    publicKey = undefined;
    return;
  }
  const keyPair = getKeyPair(privateKeyPem);
  privateKey = keyPair.privateKey;
  publicKey = keyPair.publicKey;
});

ipcMain.on('setToken', (event, token) => {
  request.setToken(token);
});