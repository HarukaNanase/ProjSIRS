const path = require('path');
const forge = require('node-forge');
const {fork} = require('child_process');
const {ipcMain} = require('electron');
const {hashContent} = require('./cryptography');

ipcMain.on('hashSecret', (event, secret) => {
  event.sender.send('hashSecret', hashContent(secret, 'sha256'));
});

ipcMain.on('hashPassword', (event, username, password) => {
  event.sender.send('hashPassword', hashContent(username + password, 'sha256'));
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