import * as FileSystem from 'expo-file-system';
import { encryptData, decryptData } from './encryption';

/**
 * Loads and parses a JSON file from the app's file system
 * @param {string} password - Password for decryption
 * @returns {Promise<any>} The parsed JSON data
 */
const loadFile = async (password: string): Promise<any> => {
  try {
    // Check if the file exists first
    const fileInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}data.json`);
    
    if (!fileInfo.exists) {
      console.log('File does not exist');
      // Initialize with empty object - always use the password
      await writeFile({}, password);
      return {};
    }
    
    console.log('Reading file with password length:', password ? password.length : 'none');
    
    // Read the file content
    const encryptedContent = await FileSystem.readAsStringAsync(
      `${FileSystem.documentDirectory}data.json`
    );
    
    console.log('File content first 20 chars:', encryptedContent.substring(0, 20));
    
    // Check if the content appears to be encrypted (contains the delimiter)
    const isEncrypted = encryptedContent.includes('::');
    
    if (!isEncrypted) {
      console.warn('File appears to be unencrypted, re-encrypting');
      // The file is not encrypted, parse it and re-encrypt it
      try {
        const jsonData = JSON.parse(encryptedContent);
        await writeFile(jsonData, password);
        return jsonData;
      } catch (parseError) {
        console.error('Error parsing unencrypted content:', parseError);
        await writeFile({}, password);
        return {};
      }
    }
    
    // Try to decrypt
    try {
      const decryptedContent = await decryptData(encryptedContent, password);
      console.log('Decryption successful, content length:', decryptedContent.length);
      
      try {
        const jsonData = JSON.parse(decryptedContent);
        return jsonData;
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        await writeFile({}, password);
        return {};
      }
    } catch (decryptError) {
      console.error('Decryption error details:', decryptError);
      throw decryptError;
    }
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

/**
 * Writes data to a JSON file
 * @param {any} data - The data to write
 * @param {string} password - Password for encryption
 */
const writeFile = async (data: any, password: string): Promise<boolean> => {
  try {
    // Convert the data to a JSON string
    const jsonString = JSON.stringify(data);
    
    // ALWAYS encrypt when writing
    const encryptedData = await encryptData(jsonString, password);
    await FileSystem.writeAsStringAsync(
      `${FileSystem.documentDirectory}data.json`,
      encryptedData
    );
    
    console.log('File encrypted and written successfully');
    return true;
  } catch (error) {
    console.error('Error writing JSON file:', error);
    return false;
  }
}

export { loadFile, writeFile };

