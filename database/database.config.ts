import { DataSource } from 'typeorm';
import * as FileSystem from 'expo-file-system';
import { Message } from './entities/Message';
import { ChatThread } from './entities/ChatThread';
import { ApiKey } from './entities/ApiKey';
import { Settings } from './entities/Settings';

const databaseName = 'androidllm.db';
const databasePath = `${FileSystem.documentDirectory}SQLite/${databaseName}`;

export const AppDataSource = new DataSource({
    type: 'expo',
    database: databaseName,
    driver: require('expo-sqlite'),
    entities: [Message, ChatThread, ApiKey, Settings],
    synchronize: true, // Auto-create database schema (disable in production)
    logging: __DEV__, // Only log in development
});

export const initializeDatabase = async () => {
    try {
        // Ensure directory exists
        const dbDir = `${FileSystem.documentDirectory}SQLite`;
        const dirInfo = await FileSystem.getInfoAsync(dbDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
        }

        // Initialize database connection
        await AppDataSource.initialize();
        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        return false;
    }
};

export const disconnectDatabase = async () => {
    try {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('Database connection closed successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error closing database connection:', error);
        return false;
    }
};