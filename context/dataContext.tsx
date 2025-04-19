import React, { createContext, useContext, useState } from 'react';
import { DatabaseService, Message as DbMessage, ChatThread as DbChatThread, Settings } from '../database/init';
import { initializeDatabase } from '../database/init';

// Interface definitions for the app's data model
export interface Message {
    isUser: boolean;
    text: string;
    timestamp: number;
}

export interface ChatThread {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
    model: {
        id: string;
        displayName: string;
        provider: string;
    };
}

export interface AppData {
    apiKeys: {
        gemini: string;
        openRouter: string;
    };
    chatThreads: ChatThread[];
    openRouterModels?: string[];
    activeThreadId?: string;
    settings?: {
        customPrompt?: string;
    };
}

interface DataContextType {
    data: AppData | null;
    loadData: (password: string) => Promise<void>;
    saveData: (newData: AppData, password: string) => Promise<void>;
    createChatThread: (password: string, model: { id: string; displayName: string; provider: string }) => Promise<string>;
    updateChatThread: (threadId: string, messages: Message[], password: string) => Promise<void>;
    setActiveThread: (threadId: string, password: string) => Promise<void>;
    deleteChatThread: (threadId: string, password: string) => Promise<void>;
    setActiveThreadInMemory: (threadId: string) => void;
    updateChatThreadInMemory: (threadId: string, messages: Message[]) => void;
    deleteChatThreadInMemory: (threadId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<AppData | null>(null);
    const [dbService] = useState(() => new DatabaseService());

    const loadData = async (password: string) => {
        try {
            await initializeDatabase();
            // Set password for database operations
            dbService.setPassword(password);
            
            const threads = await dbService.getAllChatThreads();
            const settings = await dbService.getSettings();
            const geminiKey = await dbService.getApiKey('gemini', password);
            const openRouterKey = await dbService.getApiKey('openRouter', password);

            const appData: AppData = {
                chatThreads: threads.map(thread => ({
                    id: thread.id,
                    title: thread.title,
                    messages: thread.messages.map(msg => ({
                        isUser: msg.isUser,
                        text: msg.text,
                        timestamp: msg.timestamp
                    })),
                    createdAt: thread.createdAt.getTime(),
                    updatedAt: thread.updatedAt.getTime(),
                    model: {
                        id: thread.modelId,
                        displayName: thread.modelDisplayName,
                        provider: thread.modelProvider
                    }
                })),
                apiKeys: {
                    gemini: geminiKey || '',
                    openRouter: openRouterKey || ''
                },
                activeThreadId: threads.find(t => t.isActive)?.id,
                openRouterModels: settings.openRouterModels ? JSON.parse(settings.openRouterModels) : [],
                settings: {
                    customPrompt: settings.customPrompt
                }
            };

            setData(appData);
            console.log('[dataContext] Loaded data from database');
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    };

    const saveData = async (newData: AppData, password: string) => {
        try {
            // Save API keys
            await dbService.setApiKey('gemini', newData.apiKeys.gemini, password);
            await dbService.setApiKey('openRouter', newData.apiKeys.openRouter, password);

            // Update settings
            await dbService.updateSettings({
                customPrompt: newData.settings?.customPrompt,
                openRouterModels: JSON.stringify(newData.openRouterModels || [])
            });

            // Update active thread
            if (data?.activeThreadId !== newData.activeThreadId) {
                // Reset all active states
                const threads = await dbService.getAllChatThreads();
                for (const thread of threads) {
                    if (thread.isActive) {
                        await dbService.updateChatThread(thread.id, { isActive: false });
                    }
                }
                // Set new active thread
                if (newData.activeThreadId) {
                    await dbService.updateChatThread(newData.activeThreadId, { isActive: true });
                }
            }

            setData(newData);
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    };

    const createChatThread = async (password: string, model: { id: string; displayName: string; provider: string }): Promise<string> => {
        const thread = await dbService.createChatThread('New Chat', model);
        
        // Update the in-memory state
        const newThread: ChatThread = {
            id: thread.id,
            title: thread.title,
            messages: [],
            createdAt: thread.createdAt.getTime(),
            updatedAt: thread.updatedAt.getTime(),
            model: {
                id: thread.modelId,
                displayName: thread.modelDisplayName,
                provider: thread.modelProvider
            }
        };

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                chatThreads: [...prev.chatThreads, newThread],
                activeThreadId: thread.id
            };
        });

        return thread.id;
    };

    const updateChatThread = async (threadId: string, messages: Message[], password: string) => {
        // Update messages in the database
        const thread = await dbService.getChatThread(threadId);
        if (!thread) throw new Error('Thread not found');

        // Clear existing messages and add new ones
        thread.messages = [];
        for (const msg of messages) {
            await dbService.addMessage(threadId, msg);
        }

        // Update the thread's title if it's a new chat
        if (thread.title === 'New Chat' && messages.length >= 2) {
            const firstUserMessage = messages.find(m => m.isUser)?.text || '';
            let title = firstUserMessage
                .split('\n')[0]
                .replace(/^[#\s]+/, '')
                .substring(0, 50);

            if (firstUserMessage.length > 50) title += '...';

            if (title.length < 10) {
                const firstAIResponse = messages.find(m => !m.isUser)?.text || '';
                const aiTitle = firstAIResponse
                    .split('\n')[0]
                    .replace(/^[#\s]+/, '')
                    .substring(0, 50);

                if (aiTitle.length > title.length) title = aiTitle;
            }

            await dbService.updateChatThread(threadId, { title });
        }

        // Update in-memory state
        setData(prev => {
            if (!prev) return prev;
            const updatedThreads = prev.chatThreads.map(thread =>
                thread.id === threadId ? { ...thread, messages } : thread
            );
            return { ...prev, chatThreads: updatedThreads };
        });
    };

    const setActiveThread = async (threadId: string, password: string) => {
        // Update in database
        const threads = await dbService.getAllChatThreads();
        for (const thread of threads) {
            if (thread.isActive) {
                await dbService.updateChatThread(thread.id, { isActive: false });
            }
        }
        await dbService.updateChatThread(threadId, { isActive: true });

        // Update in-memory state
        setData(prev => prev ? { ...prev, activeThreadId: threadId } : prev);
    };

    const deleteChatThread = async (threadId: string, password: string) => {
        // Delete from database
        await dbService.deleteChatThread(threadId);

        // Update in-memory state
        setData(prev => {
            if (!prev) return prev;
            const updatedThreads = prev.chatThreads.filter(thread => thread.id !== threadId);
            const activeThreadId = prev.activeThreadId === threadId
                ? (updatedThreads.length > 0 ? updatedThreads[0].id : undefined)
                : prev.activeThreadId;
            return { ...prev, chatThreads: updatedThreads, activeThreadId };
        });
    };

    // In-memory only operations remain the same
    const setActiveThreadInMemory = (threadId: string) => {
        setData(prev => prev ? { ...prev, activeThreadId: threadId } : prev);
    };

    const updateChatThreadInMemory = (threadId: string, messages: Message[]) => {
        setData(prev => {
            if (!prev) return prev;
            const updatedThreads = prev.chatThreads.map(thread =>
                thread.id === threadId ? { ...thread, messages } : thread
            );
            return { ...prev, chatThreads: updatedThreads };
        });
    };

    const deleteChatThreadInMemory = (threadId: string) => {
        setData(prev => {
            if (!prev) return prev;
            const updatedThreads = prev.chatThreads.filter(thread => thread.id !== threadId);
            const activeThreadId = prev.activeThreadId === threadId
                ? (updatedThreads.length > 0 ? updatedThreads[0].id : undefined)
                : prev.activeThreadId;
            return { ...prev, chatThreads: updatedThreads, activeThreadId };
        });
    };

    return (
        <DataContext.Provider value={{
            data,
            loadData,
            saveData,
            createChatThread,
            updateChatThread,
            setActiveThread,
            deleteChatThread,
            setActiveThreadInMemory,
            updateChatThreadInMemory,
            deleteChatThreadInMemory
        }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};