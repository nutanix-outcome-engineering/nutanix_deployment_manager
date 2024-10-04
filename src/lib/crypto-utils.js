const crypto = require('crypto')
const config = require('./config')
const fs = require('fs')

const supportedCiphers = {
  'aes-256-gcm': {
    name: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    authTagLength: 16
  },
  'aes-192-gcm': {
    name: 'aes-192-gcm',
    keyLength: 24,
    ivLength: 16,
    authTagLength: 16
  }
}
const encryptionCipher = supportedCiphers?.[config.cipher] || supportedCiphers['aes-256-gcm']


function encrypt(data, asString=true) {
  if (!data) {
    return null
  }
  const key = crypto.pbkdf2Sync(config.secret, 'saltysalt', 10000, encryptionCipher.keyLength, 'sha512')
  const iv = crypto.randomFillSync(new Uint8Array(encryptionCipher.ivLength))
  const cipher = crypto.createCipheriv(encryptionCipher.name, key, iv)

  let encrypted = cipher.update(JSON.stringify(data))
  encrypted =  Buffer.concat([encrypted, cipher.final()])

  const authTag = cipher.getAuthTag()
  if (asString) {
    return Buffer.concat([iv, encrypted, authTag]).toString('hex')
  } else {
    return Buffer.concat([iv, encrypted, authTag])
  }

}

function decrypt(toDecrypt) {
  if (!toDecrypt) {
    return null
  }
  const isBuffer = Buffer.isBuffer(toDecrypt)
  const encrypted = isBuffer ? toDecrypt : Buffer.from(toDecrypt, 'hex')
  const key = crypto.pbkdf2Sync(config.secret, 'saltysalt', 10000, encryptionCipher.keyLength, 'sha512')
  const iv = encrypted.subarray(0, encryptionCipher.ivLength)
  const cipher = crypto.createDecipheriv(encryptionCipher.name, key, iv)
  cipher.setAuthTag(encrypted.subarray(-encryptionCipher.authTagLength))
  let decrypted
  if (isBuffer) {
    decrypted = cipher.update(encrypted.subarray(encryptionCipher.ivLength, -encryptionCipher.authTagLength))
    decrypted = Buffer.concat([cipher.update(encrypted.subarray(encryptionCipher.ivLength, -encryptionCipher.authTagLength)), cipher.final()])
  } else {
    decrypted = cipher.update(encrypted.subarray(encryptionCipher.ivLength, -encryptionCipher.authTagLength), 'hex', 'utf8')
    decrypted += cipher.final('utf8')
    try {
      decrypted = JSON.parse(decrypted)
    } catch (err) {}
  }


  return decrypted
}

function extractKeyDetails(keyContents) {
  const key = crypto.createPrivateKey(keyContents)

  return {
    type: key.asymmetricKeyType,
    length: key.asymmetricKeyDetails.modulusLength
  }
}

module.exports = {
  encrypt,
  decrypt,
  extractKeyDetails
}
