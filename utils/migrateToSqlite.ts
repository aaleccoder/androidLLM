import { loadFile } from './readJson';
import { DatabaseService } from '../database/DatabaseService';
import { initializeDatabase } from '../database/database.config';
import * as FileSystem from 'expo-file-system';

export const migrateToSqlite = async (password: string): Promise<boolean> => {
    try {
        // 1. Load existing JSON data
        console.log('Loading JSON data...');
        const jsonData = await loadFile(password);

        // 2. Initialize SQLite database
        console.log('Initializing SQLite database...');
        const initialized = await initializeDatabase();
        if (!initialized) {
            throw new Error('Failed to initialize database');
        }

        // 3. Create database service instance
        const dbService = new DatabaseService();

        // 4. Import data into SQLite
        console.log('Importing data into SQLite...');
        await dbService.importFromJson(jsonData);

        // 5. Create backup of JSON file
        console.log('Creating backup of JSON file...');
        const jsonPath = `${FileSystem.documentDirectory}data.json`;
        const backupPath = `${FileSystem.documentDirectory}data.json.bak`;
        const jsonInfo = await FileSystem.getInfoAsync(jsonPath);
        
        if (jsonInfo.exists) {
            await FileSystem.copyAsync({
                from: jsonPath,
                to: backupPath
            });
        }

        console.log('Migration completed successfully');
        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
};