// @flow
const forge = require('node-forge');
const process = require('process');

process.on('message', (secret) => {
  forge.pki.rsa.generateKeyPair({bits: 2048}, function (err, keyPair) {
    const publicPem = forge.pki.publicKeyToPem(keyPair.publicKey);
    const privatePem = forge.pki.encryptRsaPrivateKey(keyPair.privateKey, secret);
    process.send({privatePem, publicPem});
  });
});