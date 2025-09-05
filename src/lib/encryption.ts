import { createClient } from '@/lib/auth'
import { Database } from '@/lib/database.types'

type EncryptionKey = Database['public']['Tables']['user_encryption_keys']['Row']

// AES-256-GCM encryption utility
export class EncryptionService {
  private static instance: EncryptionService
  private keyCache = new Map<string, CryptoKey>()

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  // Generate a new encryption key for a user
  async generateUserKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )
    
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    return Buffer.from(exportedKey).toString('base64')
  }

  // Get user's encryption key from database
  async getUserKey(userId: string): Promise<CryptoKey> {
    // Check cache first
    if (this.keyCache.has(userId)) {
      return this.keyCache.get(userId)!
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_encryption_keys')
      .select('encryption_key')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Try to create a key if it doesn't exist (fallback safety)
      console.log('Encryption key not found, attempting to create one for user:', userId)
      try {
        await createUserEncryptionKey(userId)
        
        // Try to fetch the key again
        const { data: newData, error: newError } = await supabase
          .from('user_encryption_keys')
          .select('encryption_key')
          .eq('user_id', userId)
          .single()
        
        if (newError || !newData) {
          throw new Error('Failed to create and retrieve encryption key')
        }
        
        // Convert base64 key back to CryptoKey
        const keyBuffer = Buffer.from(newData.encryption_key, 'base64')
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        )

        // Cache the key for this request
        this.keyCache.set(userId, cryptoKey)
        return cryptoKey
        
      } catch (createError) {
        console.error('Failed to create encryption key as fallback:', createError)
        throw new Error('User encryption key not found and could not be created')
      }
    }

    // Convert base64 key back to CryptoKey
    const keyBuffer = Buffer.from(data.encryption_key, 'base64')
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )

    // Cache the key for this request
    this.keyCache.set(userId, cryptoKey)
    return cryptoKey
  }

  // Encrypt a string value
  async encryptString(value: string, userId: string): Promise<string> {
    if (!value) return value

    const key = await this.getUserKey(userId)
    const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
    const encoder = new TextEncoder()
    const data = encoder.encode(value)

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return Buffer.from(combined).toString('base64')
  }

  // Decrypt a string value
  async decryptString(encryptedValue: string, userId: string): Promise<string> {
    if (!encryptedValue) return encryptedValue

    try {
      const key = await this.getUserKey(userId)
      const combined = Buffer.from(encryptedValue, 'base64')
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12)
      const encrypted = combined.slice(12)

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  // Encrypt a number (convert to string first)
  async encryptNumber(value: number, userId: string): Promise<string> {
    return this.encryptString(value.toString(), userId)
  }

  // Decrypt a number (decrypt string then parse)
  async decryptNumber(encryptedValue: string, userId: string): Promise<number> {
    const decryptedString = await this.decryptString(encryptedValue, userId)
    return parseFloat(decryptedString)
  }

  // Batch encrypt multiple strings
  async batchEncryptStrings(values: Record<string, string>, userId: string): Promise<Record<string, string>> {
    const encrypted: Record<string, string> = {}
    
    for (const [key, value] of Object.entries(values)) {
      encrypted[key] = await this.encryptString(value, userId)
    }
    
    return encrypted
  }

  // Batch decrypt multiple strings
  async batchDecryptStrings(encryptedValues: Record<string, string>, userId: string): Promise<Record<string, string>> {
    const decrypted: Record<string, string> = {}
    
    for (const [key, encryptedValue] of Object.entries(encryptedValues)) {
      decrypted[key] = await this.decryptString(encryptedValue, userId)
    }
    
    return decrypted
  }

  // Clear cache (useful for memory management)
  clearCache(): void {
    this.keyCache.clear()
  }
}

// Helper functions for easier usage
export const encryption = EncryptionService.getInstance()

export async function createUserEncryptionKey(userId: string): Promise<void> {
  const supabase = await createClient()
  const encryptionService = EncryptionService.getInstance()
  
  const keyBase64 = await encryptionService.generateUserKey()
  
  const { error } = await supabase
    .from('user_encryption_keys')
    .insert({
      user_id: userId,
      encryption_key: keyBase64
    })

  if (error) {
    throw new Error(`Failed to create user encryption key: ${error.message}`)
  }
}