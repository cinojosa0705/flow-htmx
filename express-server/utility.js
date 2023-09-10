const solana = require("@solana/web3.js");

function isValidSolanaPubkey(pubkeyStr) {
  try {
    new solana.PublicKey(pubkeyStr); // Will throw an error if the public key is invalid
    return true;
  } catch (err) {
    return false;
  }
}

function returnPublicKey(privKeyArray) {
  try {
    const privateKeyUint8Array = new Uint8Array(privKeyArray);
    const account = new solana.Keypair.fromSecretKey(privateKeyUint8Array);
    const publicKey = account.publicKey.toString();
    return publicKey;
  } catch (error) {
    return "Error";
  }
}

module.exports = {
  isValidSolanaPubkey,
  returnPublicKey
};
