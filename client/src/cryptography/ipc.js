const path = require('path');
const forge = require('node-forge');
const bcrypt = require('bcrypt');
const {fork} = require('child_process');
const {ipcMain} = require('electron');

ipcMain.on('hashSecret', (event, secret) => {
  const md = forge.md.sha256.create();
  md.update(secret);
  event.sender.send('hashSecret', md.digest().toHex());
});

ipcMain.on('hashPassword', (event, password) => {
  bcrypt.hash(password, 10, function (err, hash) {
    event.sender.send('hashPassword', hash);
  });
});

ipcMain.on('getKeyPair', (event, privateKeyPem, secret) => {
  const privateKey = forge.pki.decryptRsaPrivateKey(privateKeyPem, secret);
  const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
  event.sender.send('getKeyPair', {privateKey, publicKey});
});

ipcMain.on('generateKeyPair', (event, secret) => {
  const child = fork(path.resolve(__dirname, './children/keyPairGenerator.js'));
  child.on('message', (keyPair) => {
    event.sender.send('generateKeyPair', keyPair);
    child.kill();
  });
  child.send(secret);
});