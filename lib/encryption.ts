import crypto from "crypto"

// Algorithm: AES-256-GCM
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16 // For AES, this is always 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16

/**
 * Encrypt a text using the ENCRYPTION_KEY from env
 */
export function encrypt(text: string): string {
  const secretKey = process.env.ENCRYPTION_KEY
  if (!secretKey) {
    throw new Error("ENCRYPTION_KEY is not defined in environment variables")
  }

  // Generate a random IV
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)

  // Create cipher
  // Use a proper key derivation function (PBKDF2) to generate a 32-byte key from the env secret
  const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha512')

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  // Output format: salt:iv:tag:encrypted (all hex encoded)
  return [
    salt.toString("hex"),
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":")
}

/**
 * Decrypt a text using the ENCRYPTION_KEY from env
 */
export function decrypt(encryptedText: string): string {
  const secretKey = process.env.ENCRYPTION_KEY
  if (!secretKey) {
    throw new Error("ENCRYPTION_KEY is not defined in environment variables")
  }

  const parts = encryptedText.split(":")
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted text format")
  }

  const [saltHex, ivHex, tagHex, contentHex] = parts

  const salt = Buffer.from(saltHex, "hex")
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const content = Buffer.from(contentHex, "hex")

  // Derive the same key
  const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha512')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(content),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}
