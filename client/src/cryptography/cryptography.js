const forge = require('node-forge');
const fs = require('fs');

const ALGORITHM = 'AES-CBC';
const IV_SIZE = 16;
const CANARY_SIZE = 8;
const CANARY = 'T_26_M10';
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
  cipher.update(forge.util.createBuffer(CANARY, 'binary'));
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
 * @returns {boolean} If the decipher was successful and passed the canary test.
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
  const buf = forge.util.createBuffer();
  buf.putBuffer(decipher.output);
  const data = buf.getBytes();
  if (data.slice(data.length - CANARY_SIZE) !== CANARY) {
  	console.log(data.slice(data.length - CANARY_SIZE));
    return false;
  } else {
    fs.writeFileSync(dstPath, data.slice(0, data.length - CANARY_SIZE), {encoding: 'binary'});
    return result;
  }
};


/**
 * Decrypts a key in base 64 encrypted with a public key to the original key.
 * @param key64 The key in base 64.
 * @param privateKey The private key, pair of the public key that was used to encrypt the given key.
 */
const decryptKey = (key64, privateKey) => privateKey.decrypt(forge.util.decode64(key64));

/**
 * Decrypts an encrypted private key pem.
 * @param privateKeyEncryptedPem The encrypted private key pem.
 * @param secret The secret that decrypts the pem.
 * @returns The private key.
 */
const decryptPrivateKey = (privateKeyEncryptedPem, secret) => {
  return forge.pki.decryptRsaPrivateKey(privateKeyEncryptedPem, secret);
};

/**
 * Transforms a private key pem into forge key pair.
 * @param privateKeyPem The private key pem.
 * @returns {{privateKey, publicKey}} The key pair.
 */
const getKeyPair = (privateKeyPem) => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
  return {privateKey, publicKey};
};

/**
 * Generates a new key with the given size.
 * @param keySizeBytes The key size in bytes.
 */
const generateKey = (keySizeBytes) => forge.random.getBytes(keySizeBytes);

/**
 * Gets a public key from a public key pem.
 * @param publicKeyPem The public key in pem format.
 */
const publicKeyFromPem = (publicKeyPem) => forge.pki.publicKeyFromPem(publicKeyPem);

module.exports.cipherFileName = cipherFileName;
module.exports.decipherFileName = decipherFileName;
module.exports.cipherFile = cipherFile;
module.exports.decipherFile = decipherFile;
module.exports.decryptKey = decryptKey;
module.exports.decryptPrivateKey = decryptPrivateKey;
module.exports.generateKey = generateKey;
module.exports.publicKeyFromPem = publicKeyFromPem;
module.exports.getKeyPair = getKeyPair;
