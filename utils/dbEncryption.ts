import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

const DELIMITER = '::';

/**
 * Encrypts a single field value
 * Used for sensitive data like API keys and message content
 */
export async function encryptField(value: string, password: string): Promise<string> {
    try {
        // Generate random salt
        const salt = await Crypto.getRandomBytesAsync(16);
        const saltHex = Buffer.from(salt).toString('hex');

        // Create encryption key from password and salt
        const key = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password + saltHex
        );

        // Convert value to hex
        const valueHex = Buffer.from(value, 'utf8').toString('hex');

        // Encrypt value using key
        const encrypted = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            valueHex + key
        );

        return `${saltHex}${DELIMITER}${encrypted}${DELIMITER}${valueHex}`;
    } catch (error) {
        throw new Error('Field encryption failed');
    }
}

/**
 * Decrypts a single encrypted field value
 */
export async function decryptField(encryptedString: string, password: string): Promise<string> {
    try {
        const [saltHex, encrypted, valueHex] = encryptedString.split(DELIMITER);
        
        if (!saltHex || !encrypted || !valueHex) {
            throw new Error('Invalid encrypted field format');
        }

        // Recreate the key
        const key = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password + saltHex
        );

        // Verify the encryption
        const verification = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            valueHex + key
        );

        if (verification !== encrypted) {
            throw new Error('Invalid password or corrupted field data');
        }

        return Buffer.from(valueHex, 'hex').toString('utf8');
    } catch (error) {
        throw new Error('Field decryption failed');
    }
}

/**
 * Determines if a string is encrypted
 */
export function isEncrypted(value: string): boolean {
    const parts = value.split(DELIMITER);
    return parts.length === 3 && parts.every(part => part.length > 0);
}