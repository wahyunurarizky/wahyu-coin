const cryptoHash = require('./crypto-hash')

const EC = require('elliptic').ec

const ec = new EC('secp256k1')

const verifySignature = ({ publicKey, data, signature }) => {
  const keyFormPublic = ec.keyFromPublic(publicKey, 'hex')

  return keyFormPublic.verify(cryptoHash(data), signature)
}

module.exports = { ec, verifySignature, cryptoHash }
