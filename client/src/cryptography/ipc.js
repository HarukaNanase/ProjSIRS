const path = require('path');
const forge = require('node-forge');
const {fork} = require('child_process');
const {ipcMain} = require('electron');
const request = require('request');
const fs = require('fs');

const ALGORITHM = 'AES-CBC';
const KEY_SIZE = 16;
const IV_SIZE = 16;

/**
 * Returns the encrypted file of a given path.
 * @param filePath The path of the file.
 * @returns {string} The path of the encrypted version of the file.
 */
const encryptedPath = (filePath) => filePath + '.enc';

/**
 * Ciphers the name of a file with the given key, by generating a new IV and appending to the file's name.
 * @param key The key of the file.
 * @param fileName The name of the file.
 * @returns {string} The ciphered name.
 */
const cipherFileName = (key, fileName) => {
  // Cipher the name.
  const nameIv = forge.random.getBytesSync(IV_SIZE);
  const cipher = forge.cipher.createCipher(ALGORITHM, key);
  cipher.start({iv: nameIv});
  cipher.update(forge.util.createBuffer(fileName, 'utf8'));
  cipher.finish();

  // Build the filename using the iv and the ciphered name.
  const cipheredName64 = forge.util.encode64(cipher.output.getBytes());
  const ivHex = forge.util.bytesToHex(nameIv);
  return ivHex + cipheredName64;
};

/**
 * Deciphers the ciphered name of a file with the given key.
 * @param key The key of the file.
 * @param fileName The deciphered name of the file if successful. The given ciphered name if not.
 */
const decipherFileName = (key, fileName) => {
  // Split the IV from the ciphered content.
  const ivHex = fileName.slice(0, IV_SIZE * 2);
  const cipheredName64 = fileName.slice(ivHex.length);
  const iv = forge.util.hexToBytes(ivHex);
  const cipheredName = forge.util.decode64(cipheredName64);

  // Decipher the name
  const decipher = forge.cipher.createDecipher(ALGORITHM, key);
  decipher.start({iv});
  decipher.update(forge.util.createBuffer(cipheredName));
  if (decipher.finish()) {
    return decipher.output.data;
  }
  return fileName;
};

/**
 * Ciphers the file in the given path to the given destination, using the given key.
 * @param key The key of the file.
 * @param srcPath The path of where the file is.
 * @param dstPath The destination of the ciphered file.
 */
const cipherFile = (key, srcPath, dstPath) => {
  const input = fs.readFileSync(srcPath, {encoding: 'binary'});
  const fileIv = forge.random.getBytesSync(IV_SIZE);
  const cipher = forge.cipher.createCipher(ALGORITHM, key);
  cipher.start({iv: fileIv});
  cipher.update(forge.util.createBuffer(input, 'binary'));
  cipher.finish();
  const output = forge.util.createBuffer();
  output.putBuffer(cipher.output);
  // Write the file and append the IV.
  fs.writeFileSync(dstPath, output.getBytes(), {encoding: 'binary'});
  fs.writeFileSync(dstPath, fileIv, {flag: 'a', encoding: 'binary'});
};

/**
 * Deciphers a file in the given destination with the given key.
 * @param key The key of the file.
 * @param srcPath The source of the ciphered file.
 * @param dstPath The destination of the deciphered file.
 * @returns {boolean} If the decipher was successful.
 */
const decipherFile = (key, srcPath, dstPath) => {
  const fileBuffer = fs.readFileSync(srcPath);
  // Slice the iv and the ciphered file.
  const cipheredFileBuffer = fileBuffer.slice(0, fileBuffer.length - IV_SIZE);
  const ivBuffer = fileBuffer.slice(fileBuffer.length - IV_SIZE);

  const fileIv = ivBuffer.toString('binary');
  const decipher = forge.cipher.createDecipher(ALGORITHM, key);
  decipher.start({iv: fileIv});
  decipher.update(forge.util.createBuffer(cipheredFileBuffer.toString('binary'), 'binary'));
  const result = decipher.finish();
  fs.writeFileSync(dstPath, decipher.output.getBytes(), {encoding: 'binary'});
  return result;
};

ipcMain.on('revokeFile', (event, {token, baseUrl}, remoteFileId, usernames) => {
  request.post({
    baseUrl,
    uri: `/file/${remoteFileId}/revoke`,
    auth: {bearer: token},
    json: true,
    form: {usernames},
  }, (error, response, body) => {
    console.log(body);
    event.sender.send('revokeFile', !error);
  });
});

ipcMain.on('shareFile', async (event, {token, baseUrl}, privateKeyPem, remoteFileId, usernames) => {
  // Create a custom request object to be used in both requests (fetch keys, share).
  const customRequest = request.defaults({
    baseUrl,
    auth: {bearer: token},
    json: true,
  });

  // Fetch all public keys from all the users.
  const {public_keys} = await new Promise((resolve, reject) => customRequest.post({
    uri: '/keys',
    form: {usernames}
  }, (error, response, body) => {
    if (error) reject(error);
    else resolve(body);
  }));
  // Fetch the usernames that were real and that the server had.
  usernames = Object.keys(public_keys);

  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const {keys} = await new Promise((resolve, reject) => customRequest.get({
    uri: `/file/${remoteFileId}/keys`,
  }, (error, response, body) => {
    if (error) reject(error);
    else resolve(body);
  }));

  // Encrypt the file keys with users' public keys.
  const formData = {};
  for (let id in keys) {
    if (keys.hasOwnProperty(id)) {
      const key = privateKey.decrypt(forge.util.decode64(keys[id]));

      for (let username in public_keys) {
        if (public_keys.hasOwnProperty(username)) {
          const publicKey = forge.pki.publicKeyFromPem(public_keys[username]);
          formData[`keys[${id}][${username}]`] = forge.util.encode64(publicKey.encrypt(key));
        }
      }
    }
  }
  // Make the share request
  customRequest.post({
    uri: `/file/${remoteFileId}/share`,
    formData
  }, (error, response, body) => {
    console.log(error);
    console.log(response.statusCode);
    console.log(body);
    event.sender.send('shareFile', {usernames});
  });
});

ipcMain.on('editFile', async (event, {token, baseUrl}, key64, remoteFileId, filePath, recipher, name, allMembersUsernames) => {
  let key = forge.util.decode64(key64);
  const formData = {};

  // Create a custom request object to be used in both requests (fetch keys, edit file).
  const customRequest = request.defaults({
    baseUrl,
    auth: {bearer: token},
    json: true,
  });

  // If needs reciphering, generate a new key, cipher the name and cipher the new key.
  if (recipher) {
    key = forge.random.getBytesSync(KEY_SIZE);
    // Recipher the name
    formData.name = cipherFileName(key, name);
    // Fetch all public keys from all the users.
    const {public_keys} = await new Promise((resolve, reject) => customRequest.post({
      uri: '/keys',
      form: {usernames: allMembersUsernames}
    }, (error, response, body) => {
      if (error) reject(error);
      else resolve(body);
    }));

    // Re-encrypt the file key with each shared user key.
    // Build all public keys from the pems, and encrypt the file key for each shared user.
    for (let username in public_keys) {
      if (public_keys.hasOwnProperty(username)) {
        const publicKey = forge.pki.publicKeyFromPem(public_keys[username]);
        public_keys[username] = forge.util.encode64(publicKey.encrypt(key));
      }
    }

    // Construct the keys map.
    for (let username in public_keys) {
      if (public_keys.hasOwnProperty(username))
        formData['keys[' + username + ']'] = public_keys[username];
    }
  }

  // Cipher the file.
  cipherFile(key, filePath, encryptedPath(filePath));

  // Make the edit request
  formData.file = {
    value: fs.createReadStream(encryptedPath(filePath)),
    options: {
      filename: forge.util.encode64(forge.random.getBytesSync(32))
    }
  };
  customRequest.post({
    uri: `/file/${remoteFileId}`,
    formData
  }, (error) => {
    if (filePath) fs.unlink(encryptedPath(filePath));
    const result = {
      error,
      key: forge.util.encode64(key),
    };
    event.sender.send('editFile', result);
  });
});

ipcMain.on('renameFile', async (event, {token, baseUrl}, key64, remoteFileId, name, recipher, allMembersUsernames) => {
  let key = forge.util.decode64(key64);
  const form = {};
  // Create a custom request object to be used in both requests (fetch keys, edit file).
  const customRequest = request.defaults({
    baseUrl,
    auth: {bearer: token},
    json: true,
  });

  // If needs reciphering, generate a new key, cipher the name and cipher the new key.
  if (recipher) {
    key = forge.random.getBytesSync(KEY_SIZE);
    // Fetch all public keys from all the users.
    const {public_keys} = await new Promise((resolve, reject) => customRequest.post({
      uri: '/keys',
      form: {usernames: allMembersUsernames}
    }, (error, response, body) => {
      if (error) reject(error);
      else resolve(body);
    }));

    // Re-encrypt the file key with each shared user key.
    // Build all public keys from the pems, and encrypt the file key for each shared user.
    for (let username in public_keys) {
      if (public_keys.hasOwnProperty(username)) {
        const publicKey = forge.pki.publicKeyFromPem(public_keys[username]);
        public_keys[username] = forge.util.encode64(publicKey.encrypt(key));
      }
    }

    // Construct the keys map.
    for (let username in public_keys) {
      if (public_keys.hasOwnProperty(username))
        form['keys[' + username + ']'] = public_keys[username];
    }
  }

  form.name = cipherFileName(key, name);
  customRequest.post({
    uri: `/file/${remoteFileId}/rename`,
    form,
  }, (error) => {
    const result = {
      error,
      key: forge.util.encode64(key),
    };
    event.sender.send('renameFile', result);
  });
});

ipcMain.on('downloadFile', (event, {token, baseUrl}, key64, remoteFileId, filePath) => {
  const key = forge.util.decode64(key64);
  request.get({
    baseUrl,
    uri: `/file/${remoteFileId}`,
    auth: {bearer: token},
  }).on('end', () => {
    const result = decipherFile(key, encryptedPath(filePath), filePath);
    fs.unlink(encryptedPath(filePath));
    event.sender.send('downloadFile', result);
  }).on('error', () => {
    event.sender.send('downloadFile', false);
  }).pipe(fs.createWriteStream(encryptedPath(filePath)));
});

ipcMain.on('uploadFile', async (event, {token, baseUrl}, allMembersUsernames, name, parent, filePath) => {
  // Generate a new key and IV.
  const key = forge.random.getBytesSync(KEY_SIZE);
  const key64 = forge.util.encode64(key);

  // Cipher the name.
  const cipheredName = cipherFileName(key, name);

  // Cipher the file, if there is a file.
  if (filePath) {
    // Cipher the file.
    cipherFile(key, filePath, encryptedPath(filePath));
  }

  // Create a custom request object to be used in both requests (fetch keys, upload file).
  const customRequest = request.defaults({
    baseUrl,
    auth: {bearer: token},
    json: true,
  });

  // Fetch all public keys from all the users.
  const {public_keys} = await new Promise((resolve, reject) => customRequest.post({
    uri: '/keys',
    form: {usernames: allMembersUsernames}
  }, (error, response, body) => {
    if (error) reject(error);
    else resolve(body);
  }));

  // Encrypt the file key with each shared user key.
  // Build all public keys from the pems, and encrypt the file key for each shared user.
  for (let username in public_keys) {
    if (public_keys.hasOwnProperty(username)) {
      const publicKey = forge.pki.publicKeyFromPem(public_keys[username]);
      public_keys[username] = forge.util.encode64(publicKey.encrypt(key));
    }
  }

  // Make the upload request
  const formData = {
    name: cipheredName,
  };
  // Construct the keys map.
  for (let username in public_keys) {
    if (public_keys.hasOwnProperty(username))
      formData['keys[' + username + ']'] = public_keys[username];
  }
  if (parent) formData.parent = parent;
  if (filePath) {
    let size = fs.lstatSync(filePath).size;
    let bytes = 0;
    formData.file = {
      value: fs.createReadStream(encryptedPath(filePath)).on('data', (chunk) => {
        console.log(bytes += chunk.length, size);
      }),
      options: {
        filename: cipheredName
      }
    };
  }
  customRequest.post({
    uri: '/file',
    formData
  }, (error, response, body) => {
    console.log(error);
    console.log(response.statusCode);
    console.log(body);
    if (filePath) fs.unlink(encryptedPath(filePath));
    event.sender.send('uploadFile', {id: body.id, key: key64});
  });
});

ipcMain.on('loadRemotePath', (event, {token, baseUrl}, privateKeyPem, remoteFileId) => {
  // Build the private key from the pem.
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  let uri = '/file';
  if (remoteFileId) uri += `/${remoteFileId}`;
  // Make the request
  request.get({
    baseUrl,
    uri,
    auth: {bearer: token},
    json: true,
  }, (error, response, body) => {
    if (error || !body.files) {
      event.sender.send('loadRemotePath', {files: []});
      return;
    }
    const files = body.files;
    files.forEach((file) => {
      // Decrypt the key.
      const encryptedKey = forge.util.decode64(file.key);
      const key = privateKey.decrypt(encryptedKey);
      file['key'] = forge.util.encode64(key);

      // Decipher the name.
      file['name'] = decipherFileName(key, file.name);
    });
    event.sender.send('loadRemotePath', {files});
  });
});

ipcMain.on('hashSecret', (event, secret) => {
  const md = forge.md.sha256.create();
  md.update(secret);
  event.sender.send('hashSecret', md.digest().toHex());
});

ipcMain.on('hashPassword', (event, username, password) => {
  const md = forge.md.sha256.create();
  md.update(username + password);
  event.sender.send('hashPassword', md.digest().toHex());
});

ipcMain.on('getPrivateKey', (event, privateKeyEncryptedPem, secret) => {
  const privateKey = forge.pki.decryptRsaPrivateKey(privateKeyEncryptedPem, secret);
  const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
  event.sender.send('getPrivateKey', privateKeyPem);
});

ipcMain.on('getPublicKey', (event, privateKeyPem) => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
  const publicKeyPem = forge.pki.publicKeyToPem(publicKey);
  event.sender.send('getPublicKey', publicKeyPem);
});

ipcMain.on('generateKeyPair', (event, secret) => {
  const child = fork(path.resolve(__dirname, './children/keyPairGenerator.js'));
  child.on('message', (keyPair) => {
    event.sender.send('generateKeyPair', keyPair);
    child.kill();
  });
  child.send(secret);
});