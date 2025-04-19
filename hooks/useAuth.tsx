/**
 * Authentication Hook and Protected Route Component
 * 
 * This module provides authentication functionality including:
 * - Password validation and hashing
 * - Secure storage of credentials
 * - Authentication state management
 * - Route protection for authenticated routes
 */
import { useState, useEffect, createContext, useContext } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { encryptData } from '../utils/encryption';
import React from 'react';
import { router, useRouter } from 'expo-router';
import { useData } from '../context/dataContext';
import { deleteFile } from '../utils/readJson';
import { initializeDatabase, disconnectDatabase } from '../database/database.config';
import { DatabaseService } from '../database/DatabaseService';

// Create a module-level variable to store authentication state
// This will persist only for the current app session
let isAuthenticatedSession = false;
let currentUserPassword = '';

interface AuthContextType {
  isNewUser: boolean;
  error: string;
  setError: (error: string) => void;
  isAuthenticated: boolean;
  validateAndSavePassword: (password: string, confirmPassword?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAllData: () => Promise<void>;
  getCurrentPassword: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authHook = useAuthHook();
  
  return (
    <AuthContext.Provider value={authHook}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook providing authentication functionality
 * 
 * @returns {Object} Authentication state and methods
 * @property {boolean} isNewUser - Whether the user is new (no data file exists)
 * @property {string} error - Current error message if any
 * @property {Function} setError - Function to update error state
 * @property {boolean} isAuthenticated - Current authentication status
 * @property {Function} validateAndSavePassword - Validates password and saves data
 * @property {Function} logout - Logs out the current user
 * @property {Function} deleteAllData - Deletes all user data and resets state
 */
function useAuthHook() {
    const [isNewUser, setIsNewUser] = useState(false);
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(isAuthenticatedSession);
    const { loadData } = useData();

    useEffect(() => {
        checkIfUserExists();
    }, []);

    /**
     * Checks if the user data exists in either JSON or SQLite format
     * Updates isNewUser state accordingly
     */
    const checkIfUserExists = async () => {
        try {
            // Check both JSON and SQLite existence
            const jsonPath = `${FileSystem.documentDirectory}data.json`;
            const sqlitePath = `${FileSystem.documentDirectory}SQLite/androidllm.db`;
            
            const jsonExists = (await FileSystem.getInfoAsync(jsonPath)).exists;
            const sqliteExists = (await FileSystem.getInfoAsync(sqlitePath)).exists;
            
            setIsNewUser(!jsonExists && !sqliteExists);
        } catch (err) {
            console.error('Error checking files:', err);
            setError('Error checking file status');
        }
    };

    /**
     * Creates a SHA-256 hash of the provided password
     * 
     * @param {string} pwd - The password to hash
     * @returns {Promise<string>} The hashed password
     */
    const hashPassword = async (pwd: string) => {
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pwd
        );
    };

    /**
     * Returns the current user's password (only available during the current session)
     * This is needed for encrypting/decrypting data
     */
    const getCurrentPassword = () => {
        return currentUserPassword;
    };

    /**
     * Validates the provided password and saves user data
     * For new users: Creates account, saves hashed password, and initializes data file
     * For existing users: Verifies password against stored hash
     * 
     * @param {string} password - The user's password
     * @param {string} [confirmPassword] - Password confirmation (required for new users)
     * @returns {Promise<boolean>} True if validation succeeds
     * @throws {Error} If passwords don't match or credentials are invalid
     */
    const validateAndSavePassword = async (password: string, confirmPassword?: string) => {
        try {
            if (isNewUser) {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                
                const hashedPassword = await hashPassword(password);
                await SecureStore.setItemAsync('passwordHash', hashedPassword);
                
                // Initialize SQLite database
                await initializeDatabase();
                const dbService = new DatabaseService();
                
                // Set authenticated for this session
                isAuthenticatedSession = true;
                currentUserPassword = password;
                setIsAuthenticated(true);
                setIsNewUser(false);
                return true;
            } else {
                const storedHash = await SecureStore.getItemAsync('passwordHash');
                const inputHash = await hashPassword(password);
                
                if (storedHash !== inputHash) {
                    throw new Error('Incorrect password');
                }
                
                try {
                    // Load data using the context instead of directly
                    await loadData(password);
                    
                    // Set authenticated for this session
                    isAuthenticatedSession = true;
                    currentUserPassword = password;
                    setIsAuthenticated(true);
                    return true;
                } catch (err) {
                    console.error('Error loading file:', err);
                    throw new Error('Could not decrypt data file. Please try again.');
                }
            }
        } catch (err) {
            throw err;
        }
    };

    /**
     * Logs out the current user by clearing authentication state
     */
    const logout = async () => {
        try {
            // Disconnect database first
            await disconnectDatabase();
            
            // Clear the authentication state
            isAuthenticatedSession = false;
            currentUserPassword = '';
            setIsAuthenticated(false);
            await checkIfUserExists();
            
            router.push("/");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    /**
     * Deletes all user data including the data file and stored password
     * Resets the app to new user state
     * 
     * @throws {Error} If file deletion fails
     */
    const deleteAllData = async () => {
        try {
            // Delete JSON file if it exists
            await deleteFile();
            
            // Delete SQLite database if it exists
            const sqlitePath = `${FileSystem.documentDirectory}SQLite/androidllm.db`;
            const sqliteExists = (await FileSystem.getInfoAsync(sqlitePath)).exists;
            if (sqliteExists) {
                await FileSystem.deleteAsync(sqlitePath);
            }
            
            // Delete stored password
            await SecureStore.deleteItemAsync('passwordHash');
            
            // Reset authentication state
            isAuthenticatedSession = false;
            currentUserPassword = '';
            setIsAuthenticated(false);
            await checkIfUserExists();
        } catch (err) {
            throw new Error('Failed to delete data');
        }
    };

    return {
        isNewUser,
        error,
        setError,
        isAuthenticated,
        validateAndSavePassword,
        logout,
        deleteAllData,
        getCurrentPassword
    };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Interface for ProtectedRoute component props
 */
interface Props {
    children: React.ReactNode;
}

/**
 * Component that protects routes requiring authentication
 * Redirects unauthenticated users to the home/login screen
 * 
 * @param {Props} props - Component properties
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @returns {JSX.Element | null} The children if authenticated, otherwise null (redirects)
 */
export function ProtectedRoute({ children }: Props) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/'); // Use replace to prevent going back
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null; // Don't render anything if not authenticated (already redirecting)
    }

    return <>{children}</>;
}
