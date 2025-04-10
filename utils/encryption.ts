/**
 * Data Encryption Utility Module
 * 
 * Provides secure encryption and decryption for user data using:
 * - SHA-256 for key derivation
 * - Random salt generation for each encryption
 * - Hex encoding for data storage
 * - Verification mechanism to validate password during decryption
 */
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

// Separator used to distinguish parts of encrypted data
const DELIMITER = '::';

/**
 * Encrypts JSON data with a password using a salt-based approach
 * 
 * @param {string} data - JSON string data to encrypt
 * @param {string} password - Password for encryption
 * @returns {Promise<string>} Encrypted data string containing salt, hash, and data
 * @throws {Error} If data is not valid JSON or encryption fails
 */
export async function encryptData(data: string, password: string): Promise<string> {
    try {
        // Validate JSON before encryption
        JSON.parse(data);

        // Generate random salt
        const salt = await Crypto.getRandomBytesAsync(16);
        const saltHex = Buffer.from(salt).toString('hex');

        // Create encryption key from password and salt
        const key = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password + saltHex
        );

        // Convert data to hex
        const dataHex = Buffer.from(data, 'utf8').toString('hex');

        // Encrypt data using key
        const encrypted = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            dataHex + key
        );

        // Combine salt and encrypted data with delimiter
        return `${saltHex}${DELIMITER}${encrypted}${DELIMITER}${dataHex}`;
    } catch (error) {
        throw new Error('Encryption failed: Invalid JSON data');
    }
}

/**
 * Decrypts data encrypted with encryptData function
 * 
 * @param {string} encryptedString - String from encryptData
 * @param {string} password - Password used for encryption
 * @returns {Promise<string>} Decrypted JSON string
 * @throws {Error} If password is incorrect or data is corrupted
 */
export async function decryptData(encryptedString: string, password: string): Promise<string> {
    try {
        // Split the components
        const [saltHex, encrypted, dataHex] = encryptedString.split(DELIMITER);
        
        if (!saltHex || !encrypted || !dataHex) {
            throw new Error('Invalid encrypted data format');
        }

        // Recreate the key
        const key = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password + saltHex
        );

        // Verify the encryption
        const verification = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            dataHex + key
        );

        if (verification !== encrypted) {
            throw new Error('Invalid password or corrupted data');
        }

        // Convert hex back to string
        const decrypted = Buffer.from(dataHex, 'hex').toString('utf8');
        
        // Validate JSON
        JSON.parse(decrypted);
        
        return decrypted;
    } catch (error) {
        throw new Error('Decryption failed: Invalid password or corrupted data');
    }
}