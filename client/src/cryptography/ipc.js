const path = require('path');
const forge = require('node-forge');
const {fork} = require('child_process');
const {ipcMain} = require('electron');

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